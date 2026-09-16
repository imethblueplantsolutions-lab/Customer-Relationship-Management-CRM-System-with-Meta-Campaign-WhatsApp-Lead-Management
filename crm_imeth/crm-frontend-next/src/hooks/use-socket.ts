import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:4000');

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) return;

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return { socket, isConnected };
}

