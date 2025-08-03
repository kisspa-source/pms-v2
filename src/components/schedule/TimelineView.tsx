'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, differenceInDays, isSameDay, isAfter, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card } from '@/components/ui/card';

interface TimelineTask {
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
  priority: string;
}

interface Milestone {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'deadline' | 'review';
}

interface TimelineViewProps {
  tasks: TimelineTask[];
  milestones?: Milestone[];
  startDate?: Date;
  endDate?: Date;
  onTaskClick?: (taskId: string) => void;
  onMilestoneClick?: (milestoneId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  milestones = [],
  startDate,
  endDate,
  onTaskClick,
  onMilestoneClick
}) => {
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 타임라인 날짜 범위 계산
  useEffect(() => {
    if (startDate && endDate) {
      setTimelineStart(startDate);
      setTimelineEnd(endDate);
    } else {
      const allDates = [
        ...tasks.map(t => t.start_date).filter(Boolean) as Date[],
        ...tasks.map(t => t.due_date).filter(Boolean) as Date[],
        ...milestones.map(m => m.date)
      ];

      if (allDates.length > 0) {
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        setTimelineStart(minDate);
        setTimelineEnd(maxDate);
      }
    }
  }, [tasks, milestones, startDate, endDate]);

  // 날짜별 작업 그룹핑
  const groupTasksByDate = () => {
    const grouped: { [key: string]: TimelineTask[] } = {};
    
    tasks.forEach(task => {
      if (task.start_date && task.due_date) {
        let current = new Date(task.start_date);
        while (current <= task.due_date) {
          const dateKey = format(current, 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(task);
          current = addDays(current, 1);
        }
      }
    });
    
    return grouped;
  };

  const tasksByDate = groupTasksByDate();

  // 날짜별 마일스톤 그룹핑
  const groupMilestonesByDate = () => {
    const grouped: { [key: string]: Milestone[] } = {};
    
    milestones.forEach(milestone => {
      const dateKey = format(milestone.date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(milestone);
    });
    
    return grouped;
  };

  const milestonesByDate = groupMilestonesByDate();

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

  const dateArray = generateDateArray(timelineStart, timelineEnd);

  // 마일스톤 아이콘 및 색상
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'milestone': return '🎯';
      case 'deadline': return '⏰';
      case 'review': return '📋';
      default: return '📌';
    }
  };

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'bg-blue-500';
      case 'deadline': return 'bg-red-500';
      case 'review': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // 작업 상태 색상
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'border-green-500 bg-green-50';
      case 'IN_PROGRESS': return 'border-blue-500 bg-blue-50';
      case 'BLOCKED': return 'border-red-500 bg-red-50';
      case 'REVIEW': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-blue-600';
      case 'LOW': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">타임라인 뷰</h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>시작일: {format(timelineStart, 'yyyy-MM-dd', { locale: ko })}</span>
          <span>종료일: {format(timelineEnd, 'yyyy-MM-dd', { locale: ko })}</span>
          <span>총 {dateArray.length}일</span>
        </div>
      </div>

      <div className="space-y-4">
        {dateArray.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const dayMilestones = milestonesByDate[dateKey] || [];
          const isToday = isSameDay(date, new Date());
          const isPast = isBefore(date, new Date());
          const isFuture = isAfter(date, new Date());

          return (
            <div
              key={dateKey}
              className={`border rounded-lg p-3 transition-all ${
                isToday 
                  ? 'border-blue-500 bg-blue-50' 
                  : isPast 
                    ? 'border-gray-200 bg-gray-50' 
                    : 'border-gray-200 bg-white'
              }`}
            >
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    isToday ? 'text-blue-600' : 
                    isPast ? 'text-gray-500' : 'text-gray-700'
                  }`}>
                    {format(date, 'MM월 dd일 (E)', { locale: ko })}
                  </span>
                  {isToday && (
                    <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                      오늘
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {dayTasks.length}개 작업, {dayMilestones.length}개 마일스톤
                </div>
              </div>

              {/* 마일스톤 */}
              {dayMilestones.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">마일스톤</h4>
                  <div className="space-y-2">
                    {dayMilestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all hover:opacity-80 ${getMilestoneColor(milestone.type)}`}
                        onClick={() => onMilestoneClick?.(milestone.id)}
                      >
                        <span className="text-white">{getMilestoneIcon(milestone.type)}</span>
                        <span className="text-white text-sm font-medium">{milestone.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 작업 목록 */}
              {dayTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">작업</h4>
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 border-l-4 rounded cursor-pointer transition-all hover:shadow-md ${getTaskStatusColor(task.status)}`}
                        onClick={() => onTaskClick?.(task.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{task.title}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)} bg-white`}>
                                {task.priority}
                              </span>
                            </div>
                            {task.assignee && (
                              <div className="text-xs text-gray-500 mt-1">
                                담당: {task.assignee.name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500">
                              진행률: {task.progress}%
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 빈 날짜 */}
              {dayTasks.length === 0 && dayMilestones.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-4">
                  예정된 작업이 없습니다
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>마일스톤</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>데드라인</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>검토</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>진행중</span>
        </div>
      </div>
    </Card>
  );
}; 