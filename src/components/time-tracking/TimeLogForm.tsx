'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { input } from '@/components/ui/input';
import { label } from '@/components/ui/label';

interface TimeLogFormProps {
  projectId?: string;
  taskId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
}

export default function TimeLogForm({ projectId, taskId, onSuccess, onCancel }: TimeLogFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: projectId || '',
    taskId: taskId || '',
    description: '',
    hours: '',
    logDate: new Date().toISOString().split('T')[0],
    hourlyRate: ''
  });

  // 프로젝트 목록 조회
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('프로젝트 조회 오류:', error);
      }
    };

    fetchProjects();
  }, []);

  // 작업 목록 조회 (프로젝트가 선택된 경우)
  useEffect(() => {
    const fetchTasks = async () => {
      if (!formData.projectId) {
        setTasks([]);
        return;
      }

      try {
        const response = await fetch(`/api/projects/${formData.projectId}/tasks`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('작업 조회 오류:', error);
      }
    };

    fetchTasks();
  }, [formData.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: formData.projectId,
          taskId: formData.taskId || null,
          description: formData.description,
          hours: parseFloat(formData.hours),
          logDate: formData.logDate,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null
        }),
      });

      if (response.ok) {
        setFormData({
          projectId: projectId || '',
          taskId: taskId || '',
          description: '',
          hours: '',
          logDate: new Date().toISOString().split('T')[0],
          hourlyRate: ''
        });
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(error.error || '시간 로그 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('시간 로그 생성 오류:', error);
      alert('시간 로그 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">시간 로그 입력</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 프로젝트 선택 */}
        <div>
          <label htmlFor="projectId" className={label()}>
            프로젝트 *
          </label>
          <select
            id="projectId"
            value={formData.projectId}
            onChange={(e) => handleInputChange('projectId', e.target.value)}
            className={input()}
            required
          >
            <option value="">프로젝트를 선택하세요</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* 작업 선택 */}
        <div>
          <label htmlFor="taskId" className={label()}>
            작업 (선택사항)
          </label>
          <select
            id="taskId"
            value={formData.taskId}
            onChange={(e) => handleInputChange('taskId', e.target.value)}
            className={input()}
            disabled={!formData.projectId}
          >
            <option value="">작업을 선택하세요</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        {/* 날짜 선택 */}
        <div>
          <label htmlFor="logDate" className={label()}>
            날짜 *
          </label>
          <input
            type="date"
            id="logDate"
            value={formData.logDate}
            onChange={(e) => handleInputChange('logDate', e.target.value)}
            className={input()}
            required
          />
        </div>

        {/* 시간 입력 */}
        <div>
          <label htmlFor="hours" className={label()}>
            작업 시간 (시간) *
          </label>
          <input
            type="number"
            id="hours"
            value={formData.hours}
            onChange={(e) => handleInputChange('hours', e.target.value)}
            className={input()}
            step="0.5"
            min="0"
            max="24"
            required
            placeholder="예: 8.5"
          />
        </div>

        {/* 시급 입력 */}
        <div>
          <label htmlFor="hourlyRate" className={label()}>
            시급 (원/시간)
          </label>
          <input
            type="number"
            id="hourlyRate"
            value={formData.hourlyRate}
            onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
            className={input()}
            step="1000"
            min="0"
            placeholder="예: 50000"
          />
        </div>

        {/* 설명 입력 */}
        <div>
          <label htmlFor="description" className={label()}>
            작업 설명
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={input()}
            rows={3}
            placeholder="수행한 작업에 대한 간단한 설명을 입력하세요"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : '시간 로그 저장'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
} 