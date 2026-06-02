export interface MessageData {
  recipientId: string;
  content?: string;
  messageType?: "text" | "image" | "file" | "booking" | "campsite";
  attachments?: Array<{ url: string; type: string; name?: string; size?: number }>;
  bookingRef?: string | null;
  siteRef?: string | null;
}

export interface ReadMessageData {
  messageId: string;
  partnerId: string;
}

export interface ReactMessageData {
  messageId: string;
  emoji: string;
  partnerId: string;
}

export interface TypingData {
  partnerId: string;
}
