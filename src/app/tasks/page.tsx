'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TaskListItem, TaskFilterOptions, TaskStatistics } from '@/types/task';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import TaskFilter from '@/components/tasks/TaskFilter';
import TaskProgressChart from '@/components/tasks/TaskProgressChart';
import TaskOverdueAlert from '@/components/tasks/TaskOverdueAlert';
import TaskCreateModal from '@/components/tasks/TaskCreateModal';
import TaskEditModal from '@/components/tasks/TaskEditModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import MainLayout from '@/components/layout/MainLayout';

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [filters, setFilters] = useState<TaskFilterOptions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'statistics'>('kanban');
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  // 작업 목록 조회
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.project_id) params.append('project_id', filters.project_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.assignee_id) params.append('assignee_id', filters.assignee_id);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('작업 목록을 불러오는데 실패했습니다');
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('작업 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 통계 조회
  const fetchStatistics = async () => {
    try {
      setIsStatisticsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.project_id) params.append('project_id', filters.project_id);

      const response = await fetch(`/api/tasks/statistics?${params.toString()}`);
      if (!response.ok) throw new Error('통계를 불러오는데 실패했습니다');
      
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('통계 조회 오류:', error);
    } finally {
      setIsStatisticsLoading(false);
    }
  };

  // 담당자 목록 조회
  const fetchAssignees = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('담당자 목록을 불러오는데 실패했습니다');
      
      const data = await response.json();
      setAssignees(data);
    } catch (error) {
      console.error('담당자 목록 조회 오류:', error);
    }
  };

  // 작업 업데이트
  const handleTaskUpdate = async (taskId: string, updates: Partial<TaskListItem>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('작업 업데이트에 실패했습니다');

      const updatedTask = await response.json();
      
      // 로컬 상태 업데이트
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      ));

      // 통계 새로고침
      fetchStatistics();
    } catch (error) {
      console.error('작업 업데이트 오류:', error);
      throw error;
    }
  };

  // 작업 클릭 핸들러
  const handleTaskClick = (task: TaskListItem) => {
    // 작업 상세 모달 열기 (구현 예정)
    console.log('작업 클릭:', task);
  };

  // 작업 생성 핸들러
  const handleTaskCreate = () => {
    setShowCreateModal(true);
  };

  // 작업 생성 완료 핸들러
  const handleTaskCreated = () => {
    fetchTasks();
    fetchStatistics();
  };

  // 작업 수정 핸들러
  const handleTaskEdit = (task: TaskListItem) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  // 작업 수정 완료 핸들러
  const handleTaskUpdated = () => {
    fetchTasks();
    fetchStatistics();
  };

  // 작업 삭제 완료 핸들러
  const handleTaskDeleted = () => {
    fetchTasks();
    fetchStatistics();
  };

  // 필터 변경 핸들러
  const handleFiltersChange = (newFilters: TaskFilterOptions) => {
    setFilters(newFilters);
  };

  // 필터 초기화
  const handleClearFilters = () => {
    setFilters({});
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchTasks();
    fetchStatistics();
    fetchAssignees();
  }, [filters]);

  // 지연된 작업 필터링
  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date() > new Date(task.due_date) && task.status !== 'DONE'
  );

  if (!session) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">작업 관리</h1>
          <p className="text-gray-600 mt-1">
            프로젝트 작업을 효율적으로 관리하고 추적하세요
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleTaskCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            작업 추가
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            onClick={() => setViewMode('kanban')}
          >
            칸반 보드
          </Button>
          <Button
            variant={viewMode === 'statistics' ? 'default' : 'outline'}
            onClick={() => setViewMode('statistics')}
          >
            통계
          </Button>
        </div>
      </div>

      {/* 지연 알림 */}
      <div className="mb-6">
        <TaskOverdueAlert
          overdueTasks={overdueTasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskClick={handleTaskClick}
          onTaskEdit={handleTaskEdit}
        />
      </div>

      {/* 필터 */}
      <TaskFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        assignees={assignees}
        onClearFilters={handleClearFilters}
      />

      {/* 메인 콘텐츠 */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onTaskEdit={handleTaskEdit}
          isLoading={isLoading}
        />
      ) : (
        <div className="space-y-6">
          {statistics ? (
            <TaskProgressChart
              statistics={statistics}
              isLoading={isStatisticsLoading}
            />
          ) : (
            <Card className="p-8 text-center">
              <Loading />
            </Card>
          )}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && tasks.length === 0 && viewMode === 'kanban' && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">작업이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              새로운 작업을 추가하여 프로젝트를 시작하세요.
            </p>
            <div className="mt-6">
              <Button onClick={handleTaskCreate} className="bg-blue-600 hover:bg-blue-700">
                첫 번째 작업 추가
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 작업 생성 모달 */}
      <TaskCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* 작업 수정 모달 */}
      <TaskEditModal
        isOpen={showEditModal}
        task={selectedTask}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
      </div>
    </MainLayout>
  );
} 