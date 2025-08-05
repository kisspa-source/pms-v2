'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { TaskListItem, TaskStatus } from '@/types/task';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';

interface KanbanBoardProps {
  projectId?: string;
  tasks: TaskListItem[];
  onTaskUpdate: (taskId: string, updates: Partial<TaskListItem>) => Promise<void>;
  onTaskCreate?: () => void;
  onTaskEdit?: (task: TaskListItem) => void;
  isLoading?: boolean;
}

// 칸반 컬럼 정의
const KANBAN_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: '할 일', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', title: '진행 중', color: 'bg-blue-100' },
  { id: 'REVIEW', title: '검토', color: 'bg-yellow-100' },
  { id: 'DONE', title: '완료', color: 'bg-green-100' },
  { id: 'BLOCKED', title: '차단됨', color: 'bg-red-100' },
];

export default function KanbanBoard({
  projectId,
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskEdit,
  isLoading = false,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskListItem | null>(null);
  const [columns, setColumns] = useState<Record<TaskStatus, TaskListItem[]>>({
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
    BLOCKED: [],
  });

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 작업을 컬럼별로 분류
  useEffect(() => {
    const newColumns: Record<TaskStatus, TaskListItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      BLOCKED: [],
    };

    tasks.forEach((task) => {
      newColumns[task.status].push(task);
    });

    setColumns(newColumns);
  }, [tasks]);

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  // 드래그 오버
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // 컬럼에 드롭하는 경우
    if (KANBAN_COLUMNS.some((col) => col.id === overId)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        handleTaskStatusChange(activeId, newStatus);
      }
      return;
    }

    // 다른 작업 위에 드롭하는 경우
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    if (activeTask.status !== overTask.status) {
      handleTaskStatusChange(activeId, overTask.status);
    }
  };

  // 드래그 종료
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      setActiveTask(null);
      return;
    }

    // 컬럼 내에서의 순서 변경
    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (activeTask && overTask && activeTask.status === overTask.status) {
      const oldIndex = columns[activeTask.status].findIndex((t) => t.id === activeId);
      const newIndex = columns[overTask.status].findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex) {
        const newColumns = { ...columns };
        const newTasks = arrayMove(columns[activeTask.status], oldIndex, newIndex);
        newColumns[activeTask.status] = newTasks;
        setColumns(newColumns);
      }
    }

    setActiveTask(null);
  };

  // 작업 상태 변경
  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        await onTaskUpdate(taskId, { status: newStatus });
      } catch (error) {
        console.error('작업 상태 변경 오류:', error);
        // 에러 발생 시 원래 상태로 복원
        const newColumns = { ...columns };
        setColumns(newColumns);
      }
    },
    [onTaskUpdate, columns]
  );

  // 작업 클릭 핸들러
  const handleTaskClick = (task: TaskListItem) => {
    // 작업 상세 모달 열기 (구현 예정)
    console.log('작업 클릭:', task);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* 칸반 보드 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">칸반 보드</h2>
          <p className="text-gray-600 mt-1">
            총 {tasks.length}개의 작업 • {tasks.filter(t => t.status === 'DONE').length}개 완료
          </p>
        </div>
        {onTaskCreate && (
          <Button onClick={onTaskCreate} className="bg-blue-600 hover:bg-blue-700">
            작업 추가
          </Button>
        )}
      </div>

      {/* 칸반 보드 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={columns[column.id]}
              onTaskClick={handleTaskClick}
              onTaskUpdate={onTaskUpdate}
              onTaskEdit={onTaskEdit}
            />
          ))}
        </div>

        {/* 드래그 오버레이 */}
        <DragOverlay>
          {activeTask ? (
            <div className="w-80">
              <TaskCard
                task={activeTask}
                isDragging={true}
                onClick={() => {}}
                onUpdate={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 빈 상태 */}
      {tasks.length === 0 && (
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
            {onTaskCreate && (
              <div className="mt-6">
                <Button onClick={onTaskCreate} className="bg-blue-600 hover:bg-blue-700">
                  첫 번째 작업 추가
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
} 