import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function getSocketUrl(): string {
  if (typeof window !== 'undefined') {
    const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (configuredUrl) {
      // If configured for localhost but user is visiting from another hostname/IP, adapt host
      if (
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        configuredUrl.includes('localhost')
      ) {
        return configuredUrl.replace('localhost', window.location.hostname);
      }
      return configuredUrl;
    }
    if (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
    }
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
}

let sharedSocket: Socket | null = null;
let activeSubscribers = 0;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(sharedSocket);
  const [isConnected, setIsConnected] = useState<boolean>(sharedSocket?.connected || false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    if (!sharedSocket || !sharedSocket.connected) {
      const socketUrl = getSocketUrl();
      sharedSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
      });

      sharedSocket.on('connect', () => {
        setIsConnected(true);
        setSocket(sharedSocket);
      });

      sharedSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      sharedSocket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });
    } else {
      setSocket(sharedSocket);
      setIsConnected(sharedSocket.connected);
    }

    activeSubscribers++;

    return () => {
      activeSubscribers--;
      if (activeSubscribers <= 0) {
        activeSubscribers = 0;
        // Don't disconnect immediately to allow smooth page transitions across client components
        setTimeout(() => {
          if (activeSubscribers === 0 && sharedSocket) {
            sharedSocket.disconnect();
            sharedSocket = null;
          }
        }, 2000);
      }
    };
  }, []);

  return { socket, isConnected };
}
