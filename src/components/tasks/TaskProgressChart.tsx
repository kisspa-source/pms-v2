'use client';

import React from 'react';
import { TaskStatistics } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';

interface TaskProgressChartProps {
  statistics: TaskStatistics;
  isLoading?: boolean;
}

export default function TaskProgressChart({
  statistics,
  isLoading = false,
}: TaskProgressChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Loading />
      </Card>
    );
  }

  const statusData = [
    { status: 'TODO', label: '할 일', count: statistics.by_status.TODO, color: 'bg-gray-500' },
    { status: 'IN_PROGRESS', label: '진행 중', count: statistics.by_status.IN_PROGRESS, color: 'bg-blue-500' },
    { status: 'REVIEW', label: '검토', count: statistics.by_status.REVIEW, color: 'bg-yellow-500' },
    { status: 'DONE', label: '완료', count: statistics.by_status.DONE, color: 'bg-green-500' },
    { status: 'BLOCKED', label: '차단됨', count: statistics.by_status.BLOCKED, color: 'bg-red-500' },
  ];

  const priorityData = [
    { priority: 'LOW', label: '낮음', count: statistics.by_priority.LOW, color: 'bg-gray-400' },
    { priority: 'MEDIUM', label: '보통', count: statistics.by_priority.MEDIUM, color: 'bg-blue-400' },
    { priority: 'HIGH', label: '높음', count: statistics.by_priority.HIGH, color: 'bg-orange-400' },
    { priority: 'CRITICAL', label: '긴급', count: statistics.by_priority.CRITICAL, color: 'bg-red-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 전체 통계 */}
      <Card className="p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{statistics.total}</div>
          <div className="text-sm text-gray-600">전체 작업</div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{statistics.completed}</div>
          <div className="text-sm text-gray-600">완료된 작업</div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{Math.round(statistics.completion_rate)}%</div>
          <div className="text-sm text-gray-600">완료율</div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{statistics.overdue}</div>
          <div className="text-sm text-gray-600">지연된 작업</div>
        </div>
      </Card>

      {/* 상태별 통계 */}
      <Card className="p-6 md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">상태별 작업</h3>
        <div className="space-y-3">
          {statusData.map((item) => (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm text-gray-600">{item.count}개</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 우선순위별 통계 */}
      <Card className="p-6 md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">우선순위별 작업</h3>
        <div className="space-y-3">
          {priorityData.map((item) => (
            <div key={item.priority} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm text-gray-600">{item.count}개</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}