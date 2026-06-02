import { Socket } from "socket.io";
import { TypingData } from "@/types/socket";

type CustomSocket = Socket & { userId?: string };

export class TypingHandler {
  handleTyping(socket: CustomSocket) {
    socket.on("typing", (data: TypingData) => {
      const roomName = [socket.userId, data.partnerId].sort().join("_");
      socket.to(roomName).emit("user_typing", {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on("stop_typing", (data: TypingData) => {
      const roomName = [socket.userId, data.partnerId].sort().join("_");
      socket.to(roomName).emit("user_typing", {
        userId: socket.userId,
        isTyping: false
      });
    });
  }
}