'use client';

import { useSocket } from '@/hooks/useSocket';
import { Card } from '@/components/ui/card';
import { Users, Circle } from 'lucide-react';

export default function OnlineUsers() {
  const { onlineUsers, isConnected } = useSocket();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4" />
        <h3 className="font-semibold text-sm">온라인 사용자</h3>
        <div className="flex items-center gap-1 ml-auto">
          <Circle className={`w-2 h-2 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? '연결됨' : '연결 안됨'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            {isConnected ? '다른 사용자가 없습니다.' : '연결을 확인해주세요.'}
          </div>
        ) : (
          onlineUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">{user.userName}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {new Date(user.timestamp).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
      </div>

      {onlineUsers.length > 0 && (
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          총 {onlineUsers.length}명의 사용자가 온라인입니다.
        </div>
      )}
    </Card>
  );
} 