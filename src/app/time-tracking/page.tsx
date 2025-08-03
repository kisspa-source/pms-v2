'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TimeLogForm from '@/components/time-tracking/TimeLogForm';
import TimeLogList from '@/components/time-tracking/TimeLogList';

interface TimeLog {
  id: string;
  project: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  description?: string;
  hours: number;
  log_date: string;
  hourly_rate?: number;
  created_at: string;
}

export default function TimeTrackingPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTimeLog, setEditingTimeLog] = useState<TimeLog | null>(null);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTimeLog(null);
    // 목록 새로고침을 위해 key를 변경
    window.location.reload();
  };

  const handleEdit = (timeLog: TimeLog) => {
    setEditingTimeLog(timeLog);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTimeLog(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">시간 추적</h1>
        <Button onClick={() => setShowForm(true)}>
          시간 로그 입력
        </Button>
      </div>

      {/* 시간 로그 입력 폼 */}
      {showForm && (
        <Card className="p-6">
          <TimeLogForm
            projectId={editingTimeLog?.project.id}
            taskId={editingTimeLog?.task?.id}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        </Card>
      )}

      {/* 시간 로그 목록 */}
      <TimeLogList
        onEdit={handleEdit}
        onDelete={() => {
          // 삭제 후 목록 새로고침
          window.location.reload();
        }}
      />
    </div>
  );
} 