import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export interface SocketServer extends SocketIOServer {
  server?: NetServer & {
    io?: SocketIOServer;
  };
}

export interface SocketWithIO extends NextApiResponse {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
}

export interface ServerToClientEvents {
  'comment:new': (data: {
    id: string;
    content: string;
    userId: string;
    userName: string;
    taskId: string;
    createdAt: string;
  }) => void;
  'notification:new': (data: {
    id: string;
    title: string;
    message: string;
    type: string;
    userId: string;
    createdAt: string;
  }) => void;
  'task:status-update': (data: {
    taskId: string;
    status: string;
    updatedBy: string;
    updatedAt: string;
  }) => void;
  'user:online': (data: {
    userId: string;
    userName: string;
    timestamp: string;
  }) => void;
  'user:offline': (data: {
    userId: string;
    userName: string;
    timestamp: string;
  }) => void;
  'project:update': (data: {
    projectId: string;
    field: string;
    value: any;
    updatedBy: string;
    updatedAt: string;
  }) => void;
}

export interface ClientToServerEvents {
  'comment:create': (data: {
    content: string;
    taskId: string;
    userId: string;
    userName: string;
  }) => void;
  'notification:create': (data: {
    title: string;
    message: string;
    type: string;
    userId: string;
  }) => void;
  'task:update-status': (data: {
    taskId: string;
    status: string;
    userId: string;
  }) => void;
  'user:join': (data: {
    userId: string;
    userName: string;
  }) => void;
  'user:leave': (data: {
    userId: string;
    userName: string;
  }) => void;
  'project:update-field': (data: {
    projectId: string;
    field: string;
    value: any;
    userId: string;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userName: string;
}

export const initSocket = (res: SocketWithIO) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(res.socket.server, {
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    // 연결 관리
    const connectedUsers = new Map<string, { userId: string; userName: string; socketId: string }>();

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // 사용자 참가
      socket.on('user:join', (data) => {
        socket.data.userId = data.userId;
        socket.data.userName = data.userName;
        
        connectedUsers.set(socket.id, {
          userId: data.userId,
          userName: data.userName,
          socketId: socket.id,
        });

        // 다른 사용자들에게 온라인 상태 알림
        socket.broadcast.emit('user:online', {
          userId: data.userId,
          userName: data.userName,
          timestamp: new Date().toISOString(),
        });

        console.log(`User ${data.userName} joined`);
      });

      // 댓글 생성
      socket.on('comment:create', async (data) => {
        try {
          // 데이터베이스에 댓글 저장 (실제 구현에서는 Prisma 사용)
          const commentData = {
            id: `comment_${Date.now()}`,
            content: data.content,
            userId: data.userId,
            userName: data.userName,
            taskId: data.taskId,
            createdAt: new Date().toISOString(),
          };

          // 모든 클라이언트에게 새 댓글 알림
          io.emit('comment:new', commentData);

          console.log(`New comment created by ${data.userName}`);
        } catch (error) {
          console.error('Error creating comment:', error);
        }
      });

      // 알림 생성
      socket.on('notification:create', async (data) => {
        try {
          const notificationData = {
            id: `notification_${Date.now()}`,
            title: data.title,
            message: data.message,
            type: data.type,
            userId: data.userId,
            createdAt: new Date().toISOString(),
          };

          // 특정 사용자에게 알림 전송
          io.emit('notification:new', notificationData);

          console.log(`New notification created for ${data.userId}`);
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      });

      // 작업 상태 업데이트
      socket.on('task:update-status', async (data) => {
        try {
          const updateData = {
            taskId: data.taskId,
            status: data.status,
            updatedBy: data.userId,
            updatedAt: new Date().toISOString(),
          };

          // 모든 클라이언트에게 상태 변경 알림
          io.emit('task:status-update', updateData);

          console.log(`Task ${data.taskId} status updated to ${data.status}`);
        } catch (error) {
          console.error('Error updating task status:', error);
        }
      });

      // 프로젝트 필드 업데이트
      socket.on('project:update-field', async (data) => {
        try {
          const updateData = {
            projectId: data.projectId,
            field: data.field,
            value: data.value,
            updatedBy: data.userId,
            updatedAt: new Date().toISOString(),
          };

          // 모든 클라이언트에게 프로젝트 업데이트 알림
          io.emit('project:update', updateData);

          console.log(`Project ${data.projectId} field ${data.field} updated`);
        } catch (error) {
          console.error('Error updating project field:', error);
        }
      });

      // 연결 해제
      socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
          // 다른 사용자들에게 오프라인 상태 알림
          socket.broadcast.emit('user:offline', {
            userId: user.userId,
            userName: user.userName,
            timestamp: new Date().toISOString(),
          });

          connectedUsers.delete(socket.id);
          console.log(`User ${user.userName} disconnected`);
        }
      });
    });

    res.socket.server.io = io;
  }

  return res.socket.server.io;
}; 