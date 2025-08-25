'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export const useSocket = () => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; userName: string; timestamp: string }>>([]);

  useEffect(() => {
    if (!session?.user) return;

    // 임시로 연결된 것처럼 시뮬레이션
    setIsConnected(true);
    console.log('Socket simulation mode - connected');

    // 정리 함수
    return () => {
      setIsConnected(false);
      console.log('Socket simulation mode - disconnected');
    };
  }, [session]);

  // 댓글 생성 (시뮬레이션)
  const createComment = (content: string, taskId: string) => {
    if (!session?.user) return;
    console.log('Comment created (simulation):', { content, taskId, userId: session.user.id });
  };

  // 알림 생성 (시뮬레이션)
  const createNotification = (title: string, message: string, type: string, userId: string) => {
    if (!session?.user) return;
    
    // 커스텀 이벤트로 알림 전송
    const notificationEvent = new CustomEvent('notification:new', {
      detail: {
        id: `notification_${Date.now()}`,
        title,
        message,
        type,
        userId,
        createdAt: new Date().toISOString(),
      }
    });
    
    window.dispatchEvent(notificationEvent);
    console.log('Notification created (simulation):', { title, message, type, userId });
  };

  // 작업 상태 업데이트 (시뮬레이션)
  const updateTaskStatus = (taskId: string, status: string) => {
    if (!session?.user) return;
    console.log('Task status updated (simulation):', { taskId, status, userId: session.user.id });
  };

  // 프로젝트 필드 업데이트 (시뮬레이션)
  const updateProjectField = (projectId: string, field: string, value: any) => {
    if (!session?.user) return;
    console.log('Project field updated (simulation):', { projectId, field, value, userId: session.user.id });
  };

  return {
    socket: null, // 시뮬레이션 모드에서는 null
    isConnected,
    onlineUsers,
    createComment,
    createNotification,
    updateTaskStatus,
    updateProjectField,
  };
}; 