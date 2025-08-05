'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskListItem, TaskPriority } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: TaskListItem;
  onClick: () => void;
  onUpdate: (taskId: string, updates: Partial<TaskListItem>) => Promise<void>;
  onEdit?: () => void;
  isDragging?: boolean;
}

export default function TaskCard({
  task,
  onClick,
  onUpdate,
  onEdit,
  isDragging = false,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 우선순위별 색상 및 라벨
  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'LOW':
        return { color: 'bg-gray-100 text-gray-700', label: '낮음' };
      case 'MEDIUM':
        return { color: 'bg-blue-100 text-blue-700', label: '보통' };
      case 'HIGH':
        return { color: 'bg-orange-100 text-orange-700', label: '높음' };
      case 'CRITICAL':
        return { color: 'bg-red-100 text-red-700', label: '긴급' };
      default:
        return { color: 'bg-gray-100 text-gray-700', label: '보통' };
    }
  };

  // 진행률 색상
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  // 지연 여부 확인
  const isOverdue = task.due_date ? new Date() > new Date(task.due_date) && task.status !== 'DONE' : false;

  const priorityConfig = getPriorityConfig(task.priority);
  const progressColor = getProgressColor(task.progress);

  // 빠른 상태 변경 핸들러
  const handleQuickStatusChange = async (newStatus: string) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onUpdate(task.id, { status: newStatus as any });
    } catch (error) {
      console.error('상태 변경 오류:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging || isSortableDragging ? 'opacity-50' : ''}`}
    >
      <Card
        className={`p-3 hover:shadow-md transition-shadow ${
          isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
        }`}
        onClick={onClick}
      >
        {/* 작업 제목 */}
        <div className="mb-2 flex items-start justify-between">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
            {task.title}
          </h4>
          {onEdit && !isDragging && !isSortableDragging && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600 ml-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )}
        </div>

        {/* 작업 메타 정보 */}
        <div className="space-y-2">
          {/* 우선순위 및 진행률 */}
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
            <div className="flex items-center space-x-1">
              <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-300`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">{task.progress}%</span>
            </div>
          </div>

          {/* 담당자 */}
          {task.assignee && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600">{task.assignee.name}</span>
            </div>
          )}

          {/* 마감일 */}
          {task.due_date && (
            <div className="flex items-center space-x-1">
              <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                📅 {new Date(task.due_date).toLocaleDateString()}
              </span>
              {isOverdue && (
                <span className="text-xs text-red-600 font-medium">(지연)</span>
              )}
            </div>
          )}

          {/* 하위 작업 */}
          {task.sub_tasks.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">📋</span>
              <span className="text-xs text-gray-600">
                하위 작업 {task.sub_tasks.length}개
              </span>
            </div>
          )}

          {/* 댓글 및 첨부파일 */}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            {task._count.comments > 0 && (
              <span>💬 {task._count.comments}</span>
            )}
            {task._count.attachments > 0 && (
              <span>📎 {task._count.attachments}</span>
            )}
            {task._count.time_logs > 0 && (
              <span>⏱️ {task._count.time_logs}</span>
            )}
          </div>
        </div>

        {/* 빠른 액션 버튼 */}
        {!isDragging && !isSortableDragging && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex space-x-1">
              {task.status !== 'TODO' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickStatusChange('TODO');
                  }}
                  disabled={isUpdating}
                  className="text-xs px-2 py-1 h-6"
                >
                  할 일로
                </Button>
              )}
              {task.status !== 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickStatusChange('IN_PROGRESS');
                  }}
                  disabled={isUpdating}
                  className="text-xs px-2 py-1 h-6"
                >
                  진행
                </Button>
              )}
              {task.status !== 'DONE' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickStatusChange('DONE');
                  }}
                  disabled={isUpdating}
                  className="text-xs px-2 py-1 h-6"
                >
                  완료
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 