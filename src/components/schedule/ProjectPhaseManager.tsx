'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProjectPhase {
  id: string;
  name: string;
  description?: string;
  start_date: Date | null;
  end_date: Date | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  order_index: number;
  task_count: number;
  completed_task_count: number;
}

interface ProjectPhaseManagerProps {
  phases: ProjectPhase[];
  onPhaseAdd: (phase: Omit<ProjectPhase, 'id' | 'task_count' | 'completed_task_count'>) => void;
  onPhaseUpdate: (phaseId: string, updates: Partial<ProjectPhase>) => void;
  onPhaseDelete: (phaseId: string) => void;
  onPhaseReorder: (phaseId: string, newOrder: number) => void;
}

export const ProjectPhaseManager: React.FC<ProjectPhaseManagerProps> = ({
  phases,
  onPhaseAdd,
  onPhaseUpdate,
  onPhaseDelete,
  onPhaseReorder
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'PENDING' as ProjectPhase['status']
  });

  // 단계 상태 옵션
  const phaseStatuses = [
    { value: 'PENDING', label: '대기', color: 'bg-gray-500' },
    { value: 'IN_PROGRESS', label: '진행중', color: 'bg-blue-500' },
    { value: 'COMPLETED', label: '완료', color: 'bg-green-500' },
    { value: 'DELAYED', label: '지연', color: 'bg-red-500' }
  ];

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'PENDING'
    });
  };

  // 단계 추가
  const handleAddPhase = () => {
    if (!formData.name.trim()) {
      alert('단계명을 입력해주세요.');
      return;
    }

    const newPhase = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      start_date: formData.start_date ? new Date(formData.start_date) : null,
      end_date: formData.end_date ? new Date(formData.end_date) : null,
      status: formData.status,
      order_index: phases.length
    };

    onPhaseAdd(newPhase);
    resetForm();
    setShowAddForm(false);
  };

  // 단계 수정
  const handleUpdatePhase = (phaseId: string) => {
    if (!formData.name.trim()) {
      alert('단계명을 입력해주세요.');
      return;
    }

    const updates = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      start_date: formData.start_date ? new Date(formData.start_date) : null,
      end_date: formData.end_date ? new Date(formData.end_date) : null,
      status: formData.status
    };

    onPhaseUpdate(phaseId, updates);
    resetForm();
    setEditingPhase(null);
  };

  // 편집 모드 시작
  const startEditing = (phase: ProjectPhase) => {
    setEditingPhase(phase.id);
    setFormData({
      name: phase.name,
      description: phase.description || '',
      start_date: phase.start_date ? format(phase.start_date, 'yyyy-MM-dd') : '',
      end_date: phase.end_date ? format(phase.end_date, 'yyyy-MM-dd') : '',
      status: phase.status
    });
  };

  // 편집 모드 취소
  const cancelEditing = () => {
    setEditingPhase(null);
    resetForm();
  };

  // 진행률 계산
  const getProgressPercentage = (phase: ProjectPhase) => {
    if (phase.task_count === 0) return 0;
    return Math.round((phase.completed_task_count / phase.task_count) * 100);
  };

  // 단계 상태 색상
  const getStatusColor = (status: string) => {
    const found = phaseStatuses.find(s => s.value === status);
    return found ? found.color : 'bg-gray-500';
  };

  // 단계 상태 레이블
  const getStatusLabel = (status: string) => {
    const found = phaseStatuses.find(s => s.value === status);
    return found ? found.label : status;
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">프로젝트 단계 관리</h3>
        <p className="text-sm text-gray-600 mb-4">
          프로젝트의 단계를 관리하고 각 단계별 진행 상황을 추적합니다.
        </p>
      </div>

      {/* 단계 추가 버튼 */}
      <div className="mb-6">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mb-4"
        >
          {showAddForm ? '단계 추가 취소' : '새 단계 추가'}
        </Button>

        {/* 단계 추가 폼 */}
        {showAddForm && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">새 단계 추가</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단계명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 기획 단계"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectPhase['status'] })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {phaseStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="단계에 대한 상세 설명을 입력하세요"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddPhase} className="bg-blue-500 hover:bg-blue-600">
                단계 추가
              </Button>
              <Button 
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="bg-gray-500 hover:bg-gray-600"
              >
                취소
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 단계 목록 */}
      <div className="space-y-4">
        {phases.length === 0 ? (
          <p className="text-gray-500 text-center py-8">등록된 단계가 없습니다.</p>
        ) : (
          phases.map((phase) => (
            <div key={phase.id} className="border rounded-lg p-4 bg-white">
              {editingPhase === phase.id ? (
                // 편집 모드
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        단계명 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        상태
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectPhase['status'] })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {phaseStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        시작일
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        종료일
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdatePhase(phase.id)} className="bg-blue-500 hover:bg-blue-600">
                      저장
                    </Button>
                    <Button onClick={cancelEditing} className="bg-gray-500 hover:bg-gray-600">
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-lg">{phase.name}</h4>
                      <span className={`px-2 py-1 text-xs text-white rounded-full ${getStatusColor(phase.status)}`}>
                        {getStatusLabel(phase.status)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEditing(phase)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        수정
                      </Button>
                      <Button
                        onClick={() => onPhaseDelete(phase.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>

                  {phase.description && (
                    <p className="text-gray-600 text-sm mb-3">{phase.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-500">시작일:</span>
                      <span className="ml-2">
                        {phase.start_date ? format(phase.start_date, 'yyyy-MM-dd', { locale: ko }) : '미정'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">종료일:</span>
                      <span className="ml-2">
                        {phase.end_date ? format(phase.end_date, 'yyyy-MM-dd', { locale: ko }) : '미정'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">순서:</span>
                      <span className="ml-2">{phase.order_index + 1}</span>
                    </div>
                  </div>

                  {/* 진행률 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">진행률</span>
                      <span className="font-medium">
                        {phase.completed_task_count} / {phase.task_count} 작업 완료
                        ({getProgressPercentage(phase)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(phase)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        {phaseStatuses.map(status => (
          <div key={status.value} className="flex items-center gap-2">
            <div className={`w-4 h-4 ${status.color} rounded`}></div>
            <span>{status.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}; 