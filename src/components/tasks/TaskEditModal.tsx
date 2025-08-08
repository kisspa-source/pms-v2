'use client';

import React, { useState, useEffect } from 'react';
import { TaskListItem, TaskStatus, TaskPriority, UpdateTaskRequest } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAlert, useConfirm } from '@/components/ui/alert-dialog';

interface TaskEditModalProps {
  isOpen: boolean;
  task: TaskListItem | null;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function TaskEditModal({
  isOpen,
  task,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskEditModalProps) {
  const [formData, setFormData] = useState<UpdateTaskRequest>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee_id: '',
    start_date: '',
    due_date: '',
    estimated_hours: undefined,
    progress: 0,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert, AlertComponent } = useAlert();
  const { showConfirm, ConfirmComponent } = useConfirm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          })));
        } else if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      setUsers([]);
    }
  };

  // 모달이 열릴 때 데이터 로드 및 폼 초기화
  useEffect(() => {
    if (isOpen && task) {
      setIsLoading(true);
      
      // 폼 데이터 초기화
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        assignee_id: task.assignee?.id || '',
        start_date: task.start_date ? task.start_date.split('T')[0] : '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours || undefined,
        progress: task.progress || 0,
      });

      fetchUsers().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, task]);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task || !formData.title) {
      showAlert('제목은 필수입니다.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
          progress: Number(formData.progress),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '작업 수정에 실패했습니다');
      }

      showAlert('작업이 성공적으로 수정되었습니다.', 'success');
      handleClose();
      onTaskUpdated();
    } catch (error) {
      console.error('작업 수정 오류:', error);
      showAlert(error instanceof Error ? error.message : '작업 수정에 실패했습니다', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 작업 삭제 핸들러
  const handleDelete = async () => {
    if (!task) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '작업 삭제에 실패했습니다');
      }

      showAlert('작업이 성공적으로 삭제되었습니다.', 'success');
      handleClose();
      onTaskDeleted();
    } catch (error) {
      console.error('작업 삭제 오류:', error);
      showAlert(error instanceof Error ? error.message : '작업 삭제에 실패했습니다', 'error');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee_id: '',
      start_date: '',
      due_date: '',
      estimated_hours: undefined,
      progress: 0,
    });
    setShowDeleteConfirm(false);
    onClose();
  };

  // 입력 변경 핸들러
  const handleInputChange = (field: keyof UpdateTaskRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>작업 수정</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              삭제
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">데이터를 불러오는 중...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 프로젝트 정보 (읽기 전용) */}
              <div>
                <Label>프로젝트</Label>
                <div className="p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                  {task.project.name}
                </div>
              </div>

              {/* 작업 제목 */}
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="작업 제목을 입력하세요"
                  required
                />
              </div>

              {/* 작업 설명 */}
              <div>
                <Label htmlFor="description">설명</Label>
                <textarea
                  id="description"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="작업에 대한 상세 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 상태 */}
                <div>
                  <Label htmlFor="status">상태</Label>
                  <select
                    id="status"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as TaskStatus)}
                  >
                    <option value="TODO">할 일</option>
                    <option value="IN_PROGRESS">진행 중</option>
                    <option value="REVIEW">검토</option>
                    <option value="DONE">완료</option>
                    <option value="BLOCKED">차단됨</option>
                  </select>
                </div>

                {/* 우선순위 */}
                <div>
                  <Label htmlFor="priority">우선순위</Label>
                  <select
                    id="priority"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
                  >
                    <option value="LOW">낮음</option>
                    <option value="MEDIUM">보통</option>
                    <option value="HIGH">높음</option>
                    <option value="CRITICAL">긴급</option>
                  </select>
                </div>
              </div>

              {/* 담당자 */}
              <div>
                <Label htmlFor="assignee">담당자</Label>
                <select
                  id="assignee"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.assignee_id}
                  onChange={(e) => handleInputChange('assignee_id', e.target.value)}
                >
                  <option value="">담당자를 선택하세요</option>
                  {users && Array.isArray(users) && users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 시작일 */}
                <div>
                  <Label htmlFor="start_date">시작일</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>

                {/* 마감일 */}
                <div>
                  <Label htmlFor="due_date">마감일</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 예상 시간 */}
                <div>
                  <Label htmlFor="estimated_hours">예상 시간 (시간)</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimated_hours || ''}
                    onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                    placeholder="예상 소요 시간을 입력하세요"
                  />
                </div>

                {/* 진행률 */}
                <div>
                  <Label htmlFor="progress">진행률 (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => handleInputChange('progress', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '수정 중...' : '작업 수정'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">작업 삭제 확인</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                정말로 이 작업을 삭제하시겠습니까?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                <strong>"{task.title}"</strong>
                <br />
                이 작업과 관련된 모든 데이터가 영구적으로 삭제됩니다.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? '삭제 중...' : '삭제'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <AlertComponent />
      <ConfirmComponent />
    </div>
  );
}