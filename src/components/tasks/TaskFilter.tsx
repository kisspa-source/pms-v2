'use client';

import React, { useState, useEffect } from 'react';
import { TaskFilterOptions, TaskStatus, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TaskFilterProps {
  filters: TaskFilterOptions;
  onFiltersChange: (filters: TaskFilterOptions) => void;
  assignees: Array<{ id: string; name: string; email: string }>;
  phases?: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

export default function TaskFilter({
  filters,
  onFiltersChange,
  assignees,
  phases,
  onClearFilters,
}: TaskFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 필터 옵션들
  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'TODO', label: '할 일', color: 'bg-gray-100 text-gray-700' },
    { value: 'IN_PROGRESS', label: '진행 중', color: 'bg-blue-100 text-blue-700' },
    { value: 'REVIEW', label: '검토', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'DONE', label: '완료', color: 'bg-green-100 text-green-700' },
    { value: 'BLOCKED', label: '차단됨', color: 'bg-red-100 text-red-700' },
  ];

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'LOW', label: '낮음', color: 'bg-gray-100 text-gray-700' },
    { value: 'MEDIUM', label: '보통', color: 'bg-blue-100 text-blue-700' },
    { value: 'HIGH', label: '높음', color: 'bg-orange-100 text-orange-700' },
    { value: 'CRITICAL', label: '긴급', color: 'bg-red-100 text-red-700' },
  ];

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof TaskFilterOptions, value: string | undefined) => {
    const newFilters = { ...filters };
    
    if (value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value as any;
    }
    
    onFiltersChange(newFilters);
  };

  // 필터 토글 핸들러
  const toggleFilter = (key: keyof TaskFilterOptions, value: string) => {
    const currentValue = filters[key];
    if (currentValue === value) {
      handleFilterChange(key, undefined);
    } else {
      handleFilterChange(key, value);
    }
  };

  // 활성 필터 수 계산
  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Card className="p-4 mb-6">
      {/* 필터 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">필터</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
              {activeFiltersCount}개 활성
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              모두 지우기
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? '접기' : '펼치기'}
          </Button>
        </div>
      </div>

      {/* 필터 내용 */}
      {isExpanded && (
        <div className="space-y-4">
          {/* 상태 필터 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">상태</h4>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleFilter('status', option.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.status === option.value
                      ? `${option.color} ring-2 ring-blue-500`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 우선순위 필터 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">우선순위</h4>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleFilter('priority', option.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.priority === option.value
                      ? `${option.color} ring-2 ring-blue-500`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 담당자 필터 */}
          {assignees.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">담당자</h4>
              <div className="flex flex-wrap gap-2">
                {assignees.map((assignee) => (
                  <button
                    key={assignee.id}
                    onClick={() => toggleFilter('assignee_id', assignee.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filters.assignee_id === assignee.id
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {assignee.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 단계 필터 */}
          {phases && phases.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">단계</h4>
              <div className="flex flex-wrap gap-2">
                {phases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => toggleFilter('phase_id', phase.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filters.phase_id === phase.id
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {phase.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 활성 필터 표시 */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                상태: {statusOptions.find(s => s.value === filters.status)?.label}
              </span>
            )}
            {filters.priority && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                우선순위: {priorityOptions.find(p => p.value === filters.priority)?.label}
              </span>
            )}
            {filters.assignee_id && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                담당자: {assignees.find(a => a.id === filters.assignee_id)?.name}
              </span>
            )}
            {filters.phase_id && phases && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                단계: {phases.find(p => p.id === filters.phase_id)?.name}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
} 