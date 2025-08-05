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
  projectId: string;
  phases: ProjectPhase[];
  onPhaseAdd: (phase: Omit<ProjectPhase, 'id' | 'task_count' | 'completed_task_count'>) => void;
  onPhaseUpdate: (phaseId: string, updates: Partial<ProjectPhase>) => void;
  onPhaseDelete: (phaseId: string) => void;
  onPhaseReorder: (phaseId: string, newOrder: number) => void;
  onPhasesReload: () => void;
}

export const ProjectPhaseManager: React.FC<ProjectPhaseManagerProps> = ({
  projectId,
  phases,
  onPhaseAdd,
  onPhaseUpdate,
  onPhaseDelete,
  onPhaseReorder,
  onPhasesReload
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: number;
    errorMessages: string[];
  } | null>(null);

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

  // 단계 삭제 확인
  const handleDeletePhase = (phase: ProjectPhase) => {
    let confirmMessage = `"${phase.name}" 단계를 삭제하시겠습니까?`;
    
    // 작업이 있는 경우 추가 경고
    if (phase.task_count > 0) {
      confirmMessage += `\n\n⚠️ 이 단계에는 ${phase.task_count}개의 작업이 연결되어 있습니다.`;
      confirmMessage += `\n단계를 삭제하면 연결된 작업들의 단계 정보가 제거됩니다.`;
    }
    
    confirmMessage += `\n\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`;
    
    if (window.confirm(confirmMessage)) {
      onPhaseDelete(phase.id);
    }
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

  // 엑셀 양식 다운로드
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases/excel`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      if (!response.ok) {
        // 응답이 JSON인지 확인
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          alert(error.error || '엑셀 양식 다운로드에 실패했습니다.');
        } else {
          alert(`엑셀 양식 다운로드에 실패했습니다. (상태: ${response.status})`);
        }
        return;
      }

      const blob = await response.blob();
      
      // blob이 유효한지 확인
      if (blob.size === 0) {
        alert('다운로드된 파일이 비어있습니다.');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project_phases_template.xlsx';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // 정리
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (error) {
      console.error('엑셀 양식 다운로드 오류:', error);
      alert('엑셀 양식 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 파일 업로드
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('엑셀 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${projectId}/phases/excel`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || '엑셀 업로드에 실패했습니다.');
        if (result.details) {
          setUploadResult(result.details);
        }
        return;
      }

      setUploadResult(result);
      
      // 성공한 경우 데이터 새로고침
      if (result.success > 0) {
        onPhasesReload();
        alert(`${result.success}개의 단계가 성공적으로 등록되었습니다.${result.errors > 0 ? ` (${result.errors}개 오류)` : ''}`);
      }

    } catch (error) {
      console.error('엑셀 업로드 오류:', error);
      alert('엑셀 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      event.target.value = '';
    }
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
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '단계 추가 취소' : '새 단계 추가'}
          </Button>
          
          <Button
            onClick={handleDownloadTemplate}
            className="bg-green-500 hover:bg-green-600"
          >
            📥 엑셀 양식 다운로드
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              disabled={isUploading}
            >
              {isUploading ? '업로드 중...' : '📤 엑셀 업로드'}
            </Button>
          </div>
        </div>

        {/* 업로드 결과 표시 */}
        {uploadResult && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <h5 className="font-medium mb-2">업로드 결과</h5>
            <div className="text-sm space-y-1">
              <div className="text-green-600">✅ 성공: {uploadResult.success}개</div>
              {uploadResult.errors > 0 && (
                <div className="text-red-600">❌ 오류: {uploadResult.errors}개</div>
              )}
              {uploadResult.errorMessages.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium text-red-600 mb-1">오류 상세:</div>
                  <ul className="list-disc list-inside text-red-600 text-xs space-y-1">
                    {uploadResult.errorMessages.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button
              onClick={() => setUploadResult(null)}
              className="mt-2 text-xs bg-gray-400 hover:bg-gray-500"
            >
              닫기
            </Button>
          </div>
        )}

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
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 hover:border-blue-400 rounded-md transition-colors"
                      >
                        ✏️ 수정
                      </Button>
                      <Button
                        onClick={() => handleDeletePhase(phase)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 hover:border-red-400 rounded-md transition-colors"
                      >
                        🗑️ 삭제
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