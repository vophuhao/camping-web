/* eslint-disable @typescript-eslint/no-explicit-any */
// ...existing code...
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

type Conversation = any;
type Message = any;

const API = process.env.NEXT_PUBLIC_API_URL;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API;

export default function useAdminSupportChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const selectedRef = useRef<Conversation | null>(null); // <- NEW
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const socketRef = useRef<any>(null);

  // keep ref in sync
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // init socket
  useEffect(() => {
    if (socketRef.current) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : undefined;
    socketRef.current = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });

    socketRef.current.on("support_conversation_update", (payload: any) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.conversationId === payload.conversationId);
        if (idx === -1) return [payload, ...prev];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...payload };
        return copy.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      });
    });

    socketRef.current.on("support_new_message", (msg: Message) => {
      // use selectedRef (not closed-over selected)
      if (selectedRef.current?.conversationId === msg.conversationId) {
        setMessages((m) => {
          if (m.some(x => String(x._id) === String(msg._id))) return m;
          // replace optimistic match if needed
          const idx = m.findIndex(x => x.__optimistic && x.message === msg.message);
          if (idx !== -1) {
            const copy = [...m];
            copy.splice(idx, 1);
            return [...copy, msg];
          }
          return [...m, msg];
        });
      }

      // update conversation list (unread/last)
      setConversations((prev) => {
        return prev.map(c => {
          if (c.conversationId === msg.conversationId) {
            return {
              ...c,
              lastMessage: msg.message ?? msg.content,
              lastMessageAt: msg.createdAt ?? new Date().toISOString(),
              unreadCountSeller: (c.unreadCountSeller || 0) + (msg.senderModel === 'User' ? 1 : 0),
            };
          }
          return c;
        }).sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ...existing code for loadConversations / selectConversation (no change)...

  const selectConversation = useCallback(async (conv: Conversation) => {
    setSelected(conv);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${API}/support/conversation/${conv.conversationId}/messages?page=1&limit=200`, { credentials: "include" });
      if (!res.ok) throw new Error("Load messages failed");
      const body = await res.json();
      const msgs = body?.data?.messages ?? body.messages ?? body?.data ?? [];
      setMessages(msgs);
      // ensure socket joined room (leave previous handled server-side or by admin)
      socketRef.current?.emit("join_support_room", conv.conversationId);
      // mark read on server
      await fetch(`${API}/support/conversation/${conv.conversationId}/mark-read`, { method: "POST", credentials: "include" }).catch(() => { });
      setConversations(prev => prev.map(c => c.conversationId === conv.conversationId ? { ...c, unreadCountSeller: 0 } : c));
      return msgs;
    } finally { setLoadingMsgs(false); }
  }, []);

  // sendReply now accepts senderId and ensures join before sending
  const sendReply = useCallback(async (convId: string, text: string, senderId?: string) => {
    // ensure joined
    try { socketRef.current?.emit("join_support_room", convId); } catch { }
    await new Promise(r => setTimeout(r, 60)); // small wait to ensure join on server

    // optimistic append with senderId
    const tmpId = `tmp-${Date.now()}`;
    const tmpMsg: Message = {
      _id: tmpId,
      conversationId: convId,
      message: text,
      senderModel: "Seller",
      senderName: "Admin",
      senderId: senderId ?? null,
      createdAt: new Date().toISOString(),
      __optimistic: true,
    };
    setMessages(m => [...m, tmpMsg]);

    try {
      const res = await fetch(`${API}/support/conversation/${convId}/message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, messageType: "text" }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessages(m => m.filter(x => x._id !== tmpId));
        throw new Error(body?.message || "Send failed");
      }
      // server will emit saved message and socket handler will replace optimistic
      return body?.data ?? body;
    } catch (err) {
      setMessages(m => m.filter(x => x._id !== tmpId));
      throw err;
    }
  }, []);
  const loadConversations = useCallback(async (page = 1, limit = 30) => {
    setLoadingConvs(true);
    try {
      const res = await fetch(`${API}/support/admin/conversations?page=${page}&limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Load convs failed");
      const body = await res.json();
      const list = body?.data?.conversations ?? body.conversations ?? body?.data ?? [];
      setConversations(list);
      return list;
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  return {
    conversations, loadingConvs, loadConversations,
    selected, selectConversation,
    messages, loadingMsgs, sendReply,
  };
}
// ...existing code...