/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/provider/socketProvider";
import { useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export function useUnreadMessagesCount() {
  const { user } = useAuthStore();
  const { socket } = useSocket();

  const query = useQuery({
    queryKey: ["unreadMessagesCount", user?._id],
    queryFn: async () => {
      if (!user) return { unreadCount: 0 };

      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API}/messages/unread-count`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch unread messages count");
      }

      const data = await res.json();
      return data.data || { unreadCount: 0 };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
  });

  // Listen to socket events for real-time updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = () => {
      // Refetch unread count when new message arrives
      query.refetch();
    };

    const handleMessagesRead = () => {
      // Refetch unread count when messages are marked as read
      query.refetch();
    };

    const handleConversationUpdate = () => {
      // Refetch when conversation is updated
      query.refetch();
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("conversation_updated", handleConversationUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("conversation_updated", handleConversationUpdate);
    };
  }, [socket, user, query]);

  return query;
}
