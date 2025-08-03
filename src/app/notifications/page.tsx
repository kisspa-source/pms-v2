'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // 알림 목록 조회
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('read', 'false');
      if (filter === 'read') params.append('read', 'true');

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('알림 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read_at);
      
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return '📋';
      case 'task_completed': return '✅';
      case 'comment': return '💬';
      case 'project_update': return '📊';
      case 'deadline': return '⏰';
      default: return '🔔';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'task_assigned': return '작업 배정';
      case 'task_completed': return '작업 완료';
      case 'comment': return '댓글';
      case 'project_update': return '프로젝트 업데이트';
      case 'deadline': return '마감일';
      default: return '알림';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">알림</h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            읽지 않음
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            onClick={() => setFilter('read')}
          >
            읽음
          </Button>
        </div>
      </div>

      {/* 필터 및 액션 */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            총 {notifications.length}개의 알림
          </div>
          {notifications.some(n => !n.read_at) && (
            <Button onClick={markAllAsRead}>
              모두 읽음 처리
            </Button>
          )}
        </div>
      </Card>

      {/* 알림 목록 */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-lg">알림이 없습니다.</p>
              <p className="text-sm">새로운 알림이 오면 여기에 표시됩니다.</p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-6 transition-colors ${
                !notification.read_at ? 'border-blue-200 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {notification.message}
                  </p>
                  
                  {!notification.read_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notification.id)}
                    >
                      읽음 처리
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 