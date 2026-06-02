/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useDirectMessage } from '@/hooks/useDirectMessage';
import { useSocket } from '@/provider/socketProvider';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { uploadMedia } from '@/lib/client-actions';
import { Paperclip, Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Conversation {
  _id: string;
  conversationId: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  otherParticipant: {
    _id: string;
    username?: string;
    name?: string;
    userId: {
      avatarUrl?: string;

    }
  };
}

export default function HostSupportPage() {
  const { user } = useAuthStore();
  const currentUserId = user?._id;
  const { socket } = useSocket();

  const {
    messages,
    loading: loadingMsgs,
    sending,
    loadMessages,
    sendMessage: sendMsg,
    markAsRead,
    isConnected,
  } = useDirectMessage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const { data: unreadMessagesData, refetch: refetchUnreadCount } = useUnreadMessagesCount();
  const totalUnread = unreadMessagesData?.unreadCount || 0;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLenRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const getDisplayName = (participant: { username?: string; name?: string }) => {
    return participant.username || participant.name || 'Người dùng';
  };

  const getFirstLetter = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatLastMessage = (message: string) => {
    if (!message || message.trim() === '') {
      return '📷 Hình ảnh';
    }
    // Check if message contains image URLs (starts with http and has image extension)
    if (message.includes('cloudinary.com') || message.startsWith('http')) {
      return '📷 Hình ảnh';
    }
    return message || 'Chưa có tin nhắn';
  };

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/messages/conversations`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error('Load conversations error:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const sendReply = async () => {
    if (!selectedConv?._id) return;
    const trimmed = replyText.trim();
    if (!trimmed && selectedImages.length === 0) return;

    try {
      let imageUrls: string[] = [];

      // Upload images if any
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        selectedImages.forEach((file) => {
          formData.append('files', file);
        });

        const uploadRes = await uploadMedia(formData);
        if (uploadRes.success && uploadRes.data) {
          // Normalize uploadRes.data to string[] in a type-safe way
          const data = uploadRes.data as any;
          if (Array.isArray(data) && data.every((d) => typeof d === 'string')) {
            imageUrls = data as string[];
          } else if (typeof data === 'string') {
            imageUrls = [data];
          } else if (Array.isArray(data)) {
            imageUrls = data.map((d: any) => String(d));
          } else {
            imageUrls = [];
          }
        } else {
          toast.error('Không thể upload hình ảnh');
          setUploadingImages(false);
          return;
        }
      }

      // Send message with images as attachments
      const attachments = imageUrls.map(url => ({
        url,
        type: 'image',
      }));

      // If only images (no text), leave message empty and set type to 'image'
      // If has text with/without images, use text and set type to 'text'
      const messageContent = trimmed || '';
      const messageType = imageUrls.length > 0 && !trimmed ? 'image' : 'text';

      await sendMsg(selectedConv._id, {
        message: messageContent,
        messageType: messageType,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setReplyText('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setUploadingImages(false);
    } catch (err) {
      console.error('[HostSupport] Send message failed:', err);
      toast.error('Gửi tin nhắn thất bại');
      setUploadingImages(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images
    const newFiles = files.slice(0, 5 - selectedImages.length);
    if (newFiles.length < files.length) {
      toast.warning('Tối đa 5 hình ảnh');
    }

    setSelectedImages(prev => [...prev, ...newFiles]);

    // Create preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));

    // Revoke old URL to prevent memory leak
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;

    const prev = prevMessagesLenRef.current;
    const behavior: ScrollBehavior =
      prev === 0 || messages.length > prev + 1 ? 'auto' : 'smooth';

    el.scrollTo({ top: el.scrollHeight, behavior });
    prevMessagesLenRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  // Listen to socket events for real-time updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleConversationUpdate = (data: any) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === data.conversationId) {
            return {
              ...conv,
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt,
              unreadCount: selectedConv?._id === conv._id ? 0 : (data.unreadCount ?? conv.unreadCount),
            };
          }
          return conv;
        });

        // Sort by lastMessageAt
        return updated.sort((a, b) => {
          const aTime = new Date(a.lastMessageAt || 0).getTime();
          const bTime = new Date(b.lastMessageAt || 0).getTime();
          return bTime - aTime;
        });
      });
    };

    const handleNewMessage = (data: any) => {
      // If message is in current conversation, mark as read
      if (selectedConv?._id === data.conversationId) {
        markAsRead(data.conversationId);
      } else {
        // Update unread count for other conversations
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === data.conversationId
              ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
              : conv
          )
        );
      }
    };

    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user, selectedConv, markAsRead]);

  const filteredConvs = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => {
      const name = getDisplayName(c.otherParticipant).toLowerCase();
      const lastMsg = (c.lastMessage || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || lastMsg.includes(query);
    });
  }, [conversations, searchQuery]);

  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv(conv);

    // Reset unread count immediately
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conv._id ? { ...c, unreadCount: 0 } : c
      )
    );

    try {
      await loadMessages(conv._id);
      await markAsRead(conv._id);

      // Refetch total unread count after marking as read
      refetchUnreadCount();

      setTimeout(() => {
        const el = messagesEndRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
      }, 100);

      setTimeout(() => inputRef.current?.focus(), 200);
    } catch (err) {
      console.error('[HostSupport] Load messages error:', err);
    }
  };
  console.log('selectedConv', conversations);

  return (
    <div className="flex h-screen bg-white">
      {/* Left Panel */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Tin nhắn</h1>
            {totalUnread > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-500 px-2 text-xs font-semibold text-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {conversations.length} cuộc trò chuyện
            {totalUnread > 0 && ` • ${totalUnread} tin nhắn chưa đọc`}
          </p>
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 px-4 py-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {!loadingConvs && filteredConvs.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">
              Chưa có tin nhắn
            </div>
          )}

          {filteredConvs.map((conv) => {
            const isSelected = selectedConv?._id === conv._id;
            const hasUnread = conv.unreadCount > 0;
            const displayName = getDisplayName(conv.otherParticipant);

            return (
              <button
                key={conv._id}
                onClick={() => handleSelectConv(conv)}
                className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {conv.otherParticipant.userId.avatarUrl ? (
                      <img
                        src={conv.otherParticipant.userId.avatarUrl}
                        alt={displayName}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                        {getFirstLetter(displayName)}
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {displayName}
                      </p>
                      <span className="flex-shrink-0 text-xs text-gray-400">
                        {conv.lastMessageAt &&
                          new Date(conv.lastMessageAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                      </span>
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${hasUnread ? 'font-medium text-gray-600' : 'text-gray-500'}`}>
                      {formatLastMessage(conv.lastMessage)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
              <div className="relative">
                {selectedConv.otherParticipant.userId.avatarUrl ? (
                  <img
                    src={selectedConv.otherParticipant.userId.avatarUrl}
                    alt={getDisplayName(selectedConv.otherParticipant)}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                    {getFirstLetter(getDisplayName(selectedConv.otherParticipant))}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"></span>
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {getDisplayName(selectedConv.otherParticipant)}
                </p>
                <p className="text-xs text-gray-500">
                  {isConnected ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesEndRef} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-5">
              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}

              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="rounded-full bg-gray-200 p-6 mb-4">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Bắt đầu cuộc trò chuyện</p>
                  <p className="text-xs text-gray-400 mt-1">Gửi tin nhắn đầu tiên của bạn</p>
                </div>
              )}

              {messages.map((msg: any, i: number) => {
                const senderId = msg.senderId?._id;
                const isHost = senderId === currentUserId;
                const hasAttachments = msg.attachments && msg.attachments.length > 0;

                // If messageType is image but no attachments, parse URLs from message
                let imageUrls: string[] = [];
                if (msg.messageType === 'image' && !hasAttachments && msg.message) {
                  imageUrls = msg.message.split('\n').filter((url: string) => url.trim());
                }

                return (
                  <div
                    key={msg._id || i}
                    className={`flex ${isHost ? 'justify-end' : 'justify-start'} ${msg.__optimistic ? 'opacity-60' : ''}`}
                  >
                    <div className={`group max-w-[75%] ${isHost ? 'items-end' : 'items-start'} flex flex-col`}>
                      {msg.messageType === 'image' ? (
                        <div>
                          {/* Images from attachments */}
                          {hasAttachments && (
                            <div className={`grid gap-2 ${msg.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {msg.attachments.map((att: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group/img relative overflow-hidden rounded-lg"
                                >
                                  <img
                                    src={att.url}
                                    alt={`attachment-${idx}`}
                                    className="h-48 w-full object-cover transition-transform group-hover/img:scale-105 rounded-lg shadow-md"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-lg" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Images from message URLs (if no attachments) */}
                          {!hasAttachments && imageUrls.length > 0 && (
                            <div className={`grid gap-2 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {imageUrls.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group/img relative overflow-hidden rounded-lg"
                                >
                                  <img
                                    src={url}
                                    alt={`image-${idx}`}
                                    className="h-48 w-full object-cover transition-transform group-hover/img:scale-105 rounded-lg shadow-md"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-lg" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`relative rounded-2xl px-4 py-3 shadow-sm transition-all hover:shadow-md ${isHost
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                        >
                          {/* Images from attachments */}
                          {hasAttachments && (
                            <div className={`${msg.message && msg.messageType !== 'image' ? 'mb-2' : ''} grid gap-2 ${msg.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {msg.attachments.map((att: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group/img relative overflow-hidden rounded-lg"
                                >
                                  <img
                                    src={att.url}
                                    alt={`attachment-${idx}`}
                                    className="h-48 w-full object-cover transition-transform group-hover/img:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Images from message URLs (if no attachments) */}
                          {!hasAttachments && imageUrls.length > 0 && (
                            <div className={`grid gap-2 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {imageUrls.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group/img relative overflow-hidden rounded-lg"
                                >
                                  <img
                                    src={url}
                                    alt={`image-${idx}`}
                                    className="h-48 w-full object-cover transition-transform group-hover/img:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Text - only show if not image type or has actual text message */}
                          {msg.message && msg.messageType !== 'image' && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Timestamp & Status */}
                      <div className={`mt-1 flex items-center gap-1.5 px-1 text-xs text-gray-400 ${isHost ? 'flex-row-reverse' : ''}`}>
                        <span>
                          {msg.createdAt &&
                            new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </span>
                        {isHost && msg.isRead && (
                          <svg className="h-3.5 w-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {imagePreviewUrls.map((url, idx) => (
                    <div key={idx} className="group relative">
                      <img
                        src={url}
                        alt={`preview-${idx}`}
                        className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploadingImages || selectedImages.length >= 5}
                />

                {/* Image Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages || selectedImages.length >= 5}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Chọn hình ảnh"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>

                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối..."}
                    disabled={sending || uploadingImages || !isConnected}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-12 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50"
                  />
                  {selectedImages.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                      {selectedImages.length}
                    </span>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={sendReply}
                  disabled={sending || uploadingImages || (!replyText.trim() && selectedImages.length === 0) || !isConnected}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {sending || uploadingImages ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium">Chọn một cuộc trò chuyện</p>
            <p className="mt-1 text-xs text-gray-400">Chọn khách hàng để bắt đầu hỗ trợ</p>
          </div>
        )}
      </div>
    </div>
  );
}