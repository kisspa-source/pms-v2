'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card } from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  start_date: Date | null;
  due_date: Date | null;
  progress: number;
  status: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  phase_id?: string;
  predecessors?: string[];
}

interface GanttChartProps {
  tasks: Task[];
  phases?: Array<{
    id: string;
    name: string;
    start_date: Date | null;
    end_date: Date | null;
  }>;
  startDate?: Date;
  endDate?: Date;
  onTaskClick?: (taskId: string) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  phases = [],
  startDate,
  endDate,
  onTaskClick
}) => {
  const [chartStartDate, setChartStartDate] = useState<Date>(new Date());
  const [chartEndDate, setChartEndDate] = useState<Date>(new Date());
  const [cellWidth, setCellWidth] = useState(40);
  const [rowHeight, setRowHeight] = useState(50);

  // 차트 날짜 범위 계산
  useEffect(() => {
    if (startDate && endDate) {
      setChartStartDate(startOfDay(startDate));
      setChartEndDate(endOfDay(endDate));
    } else {
      const allDates = [
        ...tasks.map(t => t.start_date).filter(Boolean) as Date[],
        ...tasks.map(t => t.due_date).filter(Boolean) as Date[],
        ...phases.map(p => p.start_date).filter(Boolean) as Date[],
        ...phases.map(p => p.end_date).filter(Boolean) as Date[]
      ];

      if (allDates.length > 0) {
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        setChartStartDate(startOfDay(minDate));
        setChartEndDate(endOfDay(maxDate));
      }
    }
  }, [tasks, phases, startDate, endDate]);

  // 날짜 배열 생성
  const generateDateArray = (start: Date, end: Date): Date[] => {
    const dates: Date[] = [];
    let current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }
    
    return dates;
  };

  const dateArray = generateDateArray(chartStartDate, chartEndDate);
  const totalDays = differenceInDays(chartEndDate, chartStartDate) + 1;

  // 작업 위치 계산
  const getTaskPosition = (task: Task) => {
    if (!task.start_date || !task.due_date) return { left: 0, width: 0 };
    
    const left = differenceInDays(task.start_date, chartStartDate) * cellWidth;
    const width = (differenceInDays(task.due_date, task.start_date) + 1) * cellWidth;
    
    return { left, width };
  };

  // 진행률에 따른 색상 결정
  const getTaskColor = (task: Task) => {
    if (task.status === 'DONE') return 'bg-green-500';
    if (task.status === 'IN_PROGRESS') return 'bg-blue-500';
    if (task.status === 'BLOCKED') return 'bg-red-500';
    if (task.status === 'REVIEW') return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">프로젝트 일정 (간트 차트)</h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>시작일: {format(chartStartDate, 'yyyy-MM-dd', { locale: ko })}</span>
          <span>종료일: {format(chartEndDate, 'yyyy-MM-dd', { locale: ko })}</span>
          <span>총 {totalDays}일</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* 헤더 - 날짜 표시 */}
          <div className="flex border-b border-gray-200">
            <div className="w-64 p-2 font-semibold bg-gray-50 border-r border-gray-200">
              작업명
            </div>
            {dateArray.map((date, index) => (
              <div
                key={index}
                className="w-10 p-1 text-xs text-center border-r border-gray-200 bg-gray-50"
                style={{ minWidth: cellWidth }}
              >
                {format(date, 'MM/dd')}
              </div>
            ))}
          </div>

          {/* 단계별 구분 */}
          {phases.map((phase) => (
            <div key={phase.id} className="flex border-b border-gray-200">
              <div className="w-64 p-2 font-medium bg-blue-50 border-r border-gray-200">
                📋 {phase.name}
              </div>
              <div className="flex-1 relative">
                {phase.start_date && phase.end_date && (
                  <div
                    className="absolute h-6 bg-blue-200 opacity-50 border border-blue-300"
                    style={{
                      left: differenceInDays(phase.start_date, chartStartDate) * cellWidth,
                      width: (differenceInDays(phase.end_date, phase.start_date) + 1) * cellWidth,
                      top: '8px'
                    }}
                  />
                )}
              </div>
            </div>
          ))}

          {/* 작업 목록 */}
          {tasks.map((task) => {
            const { left, width } = getTaskPosition(task);
            
            return (
              <div key={task.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                <div className="w-64 p-2 border-r border-gray-200">
                  <div className="font-medium text-sm">{task.title}</div>
                  <div className="text-xs text-gray-500">
                    {task.assignee && `담당: ${task.assignee.name}`}
                  </div>
                </div>
                <div className="flex-1 relative" style={{ height: rowHeight }}>
                  {task.start_date && task.due_date && (
                    <div
                      className={`absolute h-8 rounded cursor-pointer transition-all hover:opacity-80 ${getTaskColor(task)}`}
                      style={{
                        left: left,
                        width: width,
                        top: '8px'
                      }}
                      onClick={() => onTaskClick?.(task.id)}
                      title={`${task.title} (${task.progress}% 완료)`}
                    >
                      <div className="flex items-center justify-center h-full text-white text-xs font-medium">
                        {task.progress}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>진행중</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>검토</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>차단</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>대기</span>
        </div>
      </div>
    </Card>
  );
}; 