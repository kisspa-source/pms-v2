'use client';

import React from 'react';
import { TaskListItem } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TaskOverdueAlertProps {
  overdueTasks: TaskListItem[];
  onTaskUpdate: (taskId: string, updates: Partial<TaskListItem>) => Promise<void>;
  onTaskClick: (task: TaskListItem) => void;
}

export default function TaskOverdueAlert({
  overdueTasks,
  onTaskUpdate,
  onTaskClick,
}: TaskOverdueAlertProps) {
  if (overdueTasks.length === 0) {
    return null;
  }

  const handleMarkAsComplete = async (taskId: string) => {
    try {
      await onTaskUpdate(taskId, { status: 'DONE', progress: 100 });
    } catch (error) {
      console.error('작업 완료 처리 오류:', error);
    }
  };

  return (
    <Card className="p-4 border-red-200 bg-red-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-sm">⚠️</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            지연된 작업 {overdueTasks.length}개
          </h3>
          <div className="mt-2 space-y-2">
            {overdueTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 bg-white rounded border border-red-200"
              >
                <div className="flex-1">
                  <button
                    onClick={() => onTaskClick(task)}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left"
                  >
                    {task.title}
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    마감일: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '미설정'}
                    {task.assignee && ` • 담당자: ${task.assignee.name}`}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsComplete(task.id)}
                    className="text-xs px-2 py-1 h-6"
                  >
                    완료
                  </Button>
                </div>
              </div>
            ))}
            {overdueTasks.length > 3 && (
              <div className="text-xs text-red-600 text-center">
                +{overdueTasks.length - 3}개 더 있습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}