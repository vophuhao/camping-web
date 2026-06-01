'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

type SocketCtx = { socket: Socket | null; isConnected: boolean };

const SocketContext = createContext<SocketCtx>({ socket: null, isConnected: false });
export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!url) return;

    const s = io(url, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
    });

    let isMounted = true;
    const connectTimer = setTimeout(() => {
      if (isMounted) setSocket(s);
    }, 0);

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    return () => {
      clearTimeout(connectTimer);
      isMounted = false;
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
}