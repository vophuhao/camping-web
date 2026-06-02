import { container, TOKENS } from "@/di";
import DirectMessageService from "@/services/directMessage.service";
import NotificationService from "@/services/notification.service";
import { MessageData, ReactMessageData, ReadMessageData } from "@/types/socket"
import { Server, Socket } from "socket.io";

type CustomSocket = Socket & { userId?: string };

const directMessageService = container.resolve<DirectMessageService>(TOKENS.DirectMessageService);
const notificationService = container.resolve<NotificationService>(TOKENS.NotificationService);

export class MessageHandler {
  constructor(private io: Server) { }

  handleSendMessage(socket: CustomSocket) {
    socket.on("send_message", async (data: MessageData) => {
      try {
        console.log(`[MESSAGE] Sending from ${socket.userId} to ${data.recipientId}`);

        const conversation = await directMessageService.getOrCreateConversation(
          socket.userId!,
          data.recipientId
        );

        const payload: any = {
          message: data.content || "",
        };

        if (data.messageType !== undefined) {
          payload.messageType = data.messageType;
        }
        if (data.attachments !== undefined) {
          payload.attachments = data.attachments;
        }
        if (data.bookingRef !== undefined) {
          payload.bookingRef = data.bookingRef;
        }
        if (data.siteRef !== undefined) {
          payload.siteRef = data.siteRef;
        }

        const message = await directMessageService.sendMessage(
          conversation._id.toString(),
          socket.userId!,
          payload
        );

        // Gửi đến tất cả connections của recipient qua room
        this.io.to(`user:${data.recipientId}`).emit("new_message", message);

        // Create or update message notification in database
        await notificationService.createGuestMessageForHost(
          data.recipientId,
          socket.userId!,
          (message.senderId as any).username || "User",
          data.content || "Sent a message"
        );

        // Emit notification to all recipient connections via room
        this.io.to(`user:${data.recipientId}`).emit("message_notification", {
          sender: message.senderId, // message.senderId contains populated sender info
          preview: message.message?.substring(0, 50) || "Sent a message",
          messageId: message._id,
        });

        // Confirm to sender
        socket.emit("message_sent", { success: true, message });

        console.log(`[MESSAGE] Successfully sent message ${message._id}`);
      } catch (error: any) {
        console.error("[MESSAGE] Error sending message:", error);
        socket.emit("message_error", { message: error.message });
      }
    });
  }

  handleMarkAsRead(socket: CustomSocket) {
    socket.on("mark_as_read", async (data: ReadMessageData) => {
      try {
        await directMessageService.markAsRead(data.messageId, socket.userId!);

        const roomName = [socket.userId!, data.partnerId].sort().join("_");
        socket.to(roomName).emit("message_read", {
          messageId: data.messageId,
          readBy: socket.userId!,
        });

        console.log(`[MESSAGE] Message ${data.messageId} marked as read by ${socket.userId}`);
      } catch (error: any) {
        console.error("[MESSAGE] Error marking message as read:", error);
        socket.emit("error", { message: error.message });
      }
    });
  }

  handleReactToMessage(socket: CustomSocket) {
    socket.on("react_message", async (data: ReactMessageData) => {
      try {
        const result = await directMessageService.reactToMessage({
          messageId: data.messageId,
          userId: socket.userId!,
          emoji: data.emoji,
        });

        const roomName = [socket.userId!, data.partnerId].sort().join("_");
        this.io.to(roomName).emit("message_reaction", result.data);

        console.log(`[MESSAGE] User ${socket.userId} reacted to message ${data.messageId} with ${data.emoji}`);
      } catch (error: any) {
        console.error("[MESSAGE] Error reacting to message:", error);
        socket.emit("error", { message: error.message });
      }
    });
  }

  // ✅ THÊM: Handle delete message
  handleDeleteMessage(socket: CustomSocket) {
    socket.on("delete_message", async (data: { messageId: string; partnerId: string }) => {
      try {
        console.log(`[MESSAGE] Deleting message ${data.messageId} by user ${socket.userId}`);

        const result = await directMessageService.deleteMessage(data.messageId, socket.userId!);

        const roomName = [socket.userId, data.partnerId].sort().join("_");
        this.io.to(roomName).emit("message_deleted", {
          messageId: data.messageId,
          deletedBy: socket.userId,
        });

        console.log(`[MESSAGE] Successfully deleted message ${data.messageId}`);

        socket.emit("message_delete_result", {
          success: true,
          message: result.message || "Message deleted successfully",
          messageId: data.messageId
        });

      } catch (error: any) {
        console.error("[MESSAGE] Error deleting message:", error);
        socket.emit("message_delete_result", {
          success: false,
          error: error.message
        });
      }
    });
  }
}
