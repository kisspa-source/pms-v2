'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@/lib/socket';

export const useSocket = () => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; userName: string; timestamp: string }>>([]);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData
  > | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // Socket.io 연결
    const socket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // 연결 이벤트
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);

      // 사용자 참가
      socket.emit('user:join', {
        userId: session.user.id,
        userName: session.user.name || 'Unknown User',
      });
    });

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    // 사용자 온라인 이벤트
    socket.on('user:online', (data) => {
      setOnlineUsers(prev => {
        const existing = prev.find(user => user.userId === data.userId);
        if (existing) {
          return prev.map(user => 
            user.userId === data.userId 
              ? { ...user, timestamp: data.timestamp }
              : user
          );
        }
        return [...prev, data];
      });
    });

    // 사용자 오프라인 이벤트
    socket.on('user:offline', (data) => {
      setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
    });

    // 연결 해제
    return () => {
      if (socket) {
        socket.emit('user:leave', {
          userId: session.user.id,
          userName: session.user.name || 'Unknown User',
        });
        socket.disconnect();
      }
    };
  }, [session]);

  // 댓글 생성
  const createComment = (content: string, taskId: string) => {
    if (!socketRef.current || !session?.user) return;

    socketRef.current.emit('comment:create', {
      content,
      taskId,
      userId: session.user.id,
      userName: session.user.name || 'Unknown User',
    });
  };

  // 알림 생성
  const createNotification = (title: string, message: string, type: string, userId: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit('notification:create', {
      title,
      message,
      type,
      userId,
    });
  };

  // 작업 상태 업데이트
  const updateTaskStatus = (taskId: string, status: string) => {
    if (!socketRef.current || !session?.user) return;

    socketRef.current.emit('task:update-status', {
      taskId,
      status,
      userId: session.user.id,
    });
  };

  // 프로젝트 필드 업데이트
  const updateProjectField = (projectId: string, field: string, value: any) => {
    if (!socketRef.current || !session?.user) return;

    socketRef.current.emit('project:update-field', {
      projectId,
      field,
      value,
      userId: session.user.id,
    });
  };

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    createComment,
    createNotification,
    updateTaskStatus,
    updateProjectField,
  };
}; 