'use client';

import React, { useState, useEffect } from 'react';
import { TaskStatus, TaskPriority, CreateTaskRequest } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function TaskCreateModal({
  isOpen,
  onClose,
  onTaskCreated,
}: TaskCreateModalProps) {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    project_id: '',
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee_id: '',
    start_date: '',
    due_date: '',
    estimated_hours: undefined,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로젝트 목록 조회
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects?simple=true');
      if (response.ok) {
        const data = await response.json();
        // 페이지네이션 응답인 경우 projects 배열 추출
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error('예상하지 못한 응답 형식:', data);
          setProjects([]);
        }
      }
    } catch (error) {
      console.error('프로젝트 목록 조회 오류:', error);
      setProjects([]);
    }
  };

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // 페이지네이션 응답인 경우 users 배열 추출
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          })));
        } else if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('예상하지 못한 사용자 응답 형식:', data);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      setUsers([]);
    }
  };

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.all([fetchProjects(), fetchUsers()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.title) {
      alert('프로젝트와 제목은 필수입니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '작업 생성에 실패했습니다');
      }

      alert('작업이 성공적으로 생성되었습니다.');
      handleClose();
      onTaskCreated();
    } catch (error) {
      console.error('작업 생성 오류:', error);
      alert(error instanceof Error ? error.message : '작업 생성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      project_id: '',
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee_id: '',
      start_date: '',
      due_date: '',
      estimated_hours: undefined,
    });
    onClose();
  };

  // 입력 변경 핸들러
  const handleInputChange = (field: keyof CreateTaskRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>새 작업 추가</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">데이터를 불러오는 중...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">프로젝트가 없습니다.</p>
              <p className="text-sm text-gray-500">작업을 생성하려면 먼저 프로젝트를 생성해주세요.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 프로젝트 선택 */}
              <div>
                <Label htmlFor="project">프로젝트 *</Label>
                <select
                  id="project"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.project_id}
                  onChange={(e) => handleInputChange('project_id', e.target.value)}
                  required
                >
                  <option value="">프로젝트를 선택하세요</option>
                  {projects && Array.isArray(projects) && projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
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

              {/* 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '생성 중...' : '작업 생성'}
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
    </div>
  );
}