'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskListItem, TaskStatus } from '@/types/task';
import TaskCard from './TaskCard';
import { Card } from '@/components/ui/card';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: TaskListItem[];
  onTaskClick: (task: TaskListItem) => void;
  onTaskUpdate: (taskId: string, updates: Partial<TaskListItem>) => Promise<void>;
  onTaskEdit?: (task: TaskListItem) => void;
}

export default function KanbanColumn({
  id,
  title,
  color,
  tasks,
  onTaskClick,
  onTaskUpdate,
  onTaskEdit,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  // 컬럼별 색상 및 아이콘 설정
  const getColumnConfig = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return {
          icon: '📋',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          headerColor: 'bg-gray-100',
        };
      case 'IN_PROGRESS':
        return {
          icon: '🔄',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          headerColor: 'bg-blue-100',
        };
      case 'REVIEW':
        return {
          icon: '👀',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          headerColor: 'bg-yellow-100',
        };
      case 'DONE':
        return {
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          headerColor: 'bg-green-100',
        };
      case 'BLOCKED':
        return {
          icon: '🚫',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          headerColor: 'bg-red-100',
        };
      default:
        return {
          icon: '📋',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          headerColor: 'bg-gray-100',
        };
    }
  };

  const config = getColumnConfig(id);

  return (
    <div className="h-full">
      <Card className={`h-full ${config.bgColor} ${config.borderColor} border-2`}>
        {/* 컬럼 헤더 */}
        <div className={`p-4 ${config.headerColor} border-b ${config.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{config.icon}</span>
              <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
              {tasks.length}
            </span>
          </div>
        </div>

        {/* 컬럼 본문 */}
        <div
          ref={setNodeRef}
          className="p-2 h-[calc(100%-80px)] overflow-y-auto"
        >
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onUpdate={onTaskUpdate}
                  onEdit={onTaskEdit ? () => onTaskEdit(task) : undefined}
                />
              ))}
            </div>
          </SortableContext>

          {/* 빈 상태 */}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="text-center">
                <div className="text-2xl mb-2">📭</div>
                <p className="text-sm">작업이 없습니다</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 