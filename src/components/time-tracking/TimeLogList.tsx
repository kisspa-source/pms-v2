'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { input } from '@/components/ui/input';
import { label } from '@/components/ui/label';

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

interface TimeLogListProps {
  projectId?: string;
  taskId?: string;
  userId?: string;
  onEdit?: (timeLog: TimeLog) => void;
  onDelete?: (timeLogId: string) => void;
}

export default function TimeLogList({ projectId, taskId, userId, onEdit, onDelete }: TimeLogListProps) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    projectId: projectId || '',
    taskId: taskId || '',
    userId: userId || ''
  });

  // 시간 로그 목록 조회
  const fetchTimeLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.taskId) params.append('taskId', filters.taskId);
      if (filters.userId) params.append('userId', filters.userId);

      const response = await fetch(`/api/time-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTimeLogs(data);
      }
    } catch (error) {
      console.error('시간 로그 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeLogs();
  }, [filters]);

  const handleDelete = async (timeLogId: string) => {
    if (!confirm('정말로 이 시간 로그를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/time-logs/${timeLogId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTimeLogs(prev => prev.filter(log => log.id !== timeLogId));
        onDelete?.(timeLogId);
      } else {
        const error = await response.json();
        alert(error.error || '시간 로그 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('시간 로그 삭제 오류:', error);
      alert('시간 로그 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatTime = (hours: number) => {
    return `${hours}시간`;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">로딩 중...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={label()}>시작 날짜</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className={input()}
            />
          </div>
          <div>
            <label className={label()}>종료 날짜</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className={input()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchTimeLogs} className="w-full">
              필터 적용
            </Button>
          </div>
        </div>
      </Card>

      {/* 시간 로그 목록 */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">시간 로그 목록</h3>
          <div className="text-sm text-gray-600">
            총 {timeLogs.length}개 항목
          </div>
        </div>

        {timeLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            시간 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">날짜</th>
                  <th className="text-left p-2">프로젝트</th>
                  <th className="text-left p-2">작업</th>
                  <th className="text-left p-2">사용자</th>
                  <th className="text-left p-2">시간</th>
                  <th className="text-left p-2">시급</th>
                  <th className="text-left p-2">설명</th>
                  <th className="text-left p-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {timeLogs.map((timeLog) => (
                  <tr key={timeLog.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{formatDate(timeLog.log_date)}</td>
                    <td className="p-2">{timeLog.project.name}</td>
                    <td className="p-2">
                      {timeLog.task ? timeLog.task.title : '-'}
                    </td>
                    <td className="p-2">{timeLog.user.name}</td>
                    <td className="p-2 font-medium">{formatTime(timeLog.hours)}</td>
                    <td className="p-2">{formatCurrency(timeLog.hourly_rate)}</td>
                    <td className="p-2 max-w-xs truncate">
                      {timeLog.description || '-'}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(timeLog)}
                          >
                            수정
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(timeLog.id)}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
} 