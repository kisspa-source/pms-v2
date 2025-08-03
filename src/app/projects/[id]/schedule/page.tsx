'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GanttChart } from '@/components/schedule/GanttChart';
import { TimelineView } from '@/components/schedule/TimelineView';
import { TaskDependencyManager } from '@/components/schedule/TaskDependencyManager';
import { ProjectPhaseManager } from '@/components/schedule/ProjectPhaseManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Users, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';

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
  priority: string;
  phase?: {
    id: string;
    name: string;
  };
}

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

interface TaskDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  lag_days: number;
}

interface Milestone {
  id: string;
  title: string;
  date: Date;
  type: 'milestone' | 'deadline' | 'review';
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: Date;
  end_date?: Date;
  progress: number;
  client: {
    id: string;
    name: string;
  };
  _count: {
    members: number;
    tasks: number;
    phases: number;
  };
}

export default function ProjectSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'gantt' | 'timeline' | 'dependencies' | 'phases'>('gantt');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  // 탭 옵션
  const tabs = [
    { id: 'gantt', label: '간트 차트', icon: '📊' },
    { id: 'timeline', label: '타임라인', icon: '📅' },
    { id: 'dependencies', label: '의존성 관리', icon: '🔗' },
    { id: 'phases', label: '단계 관리', icon: '📋' }
  ];

  // 데이터 로드
  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출
      const [projectRes, tasksRes, phasesRes, dependenciesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
        fetch(`/api/projects/${projectId}/phases`),
        fetch(`/api/projects/${projectId}/dependencies`)
      ]);

      if (!projectRes.ok) {
        throw new Error('프로젝트 정보를 불러올 수 없습니다.');
      }

      const projectData = await projectRes.json();
      setProject(projectData);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const formattedTasks = tasksData.tasks.map((task: any) => ({
          ...task,
          start_date: task.start_date ? new Date(task.start_date) : null,
          due_date: task.due_date ? new Date(task.due_date) : null,
        }));
        setTasks(formattedTasks);
      }

      if (phasesRes.ok) {
        const phasesData = await phasesRes.json();
        const formattedPhases = phasesData.map((phase: any) => ({
          ...phase,
          start_date: phase.start_date ? new Date(phase.start_date) : null,
          end_date: phase.end_date ? new Date(phase.end_date) : null,
        }));
        setPhases(formattedPhases);
      }

      if (dependenciesRes.ok) {
        const dependenciesData = await dependenciesRes.json();
        setDependencies(dependenciesData);
      }

      // 마일스톤은 단계의 종료일을 기준으로 생성
      const generatedMilestones: Milestone[] = [];
      if (phasesRes.ok) {
        const phasesData = await phasesRes.json();
        phasesData.forEach((phase: any) => {
          if (phase.end_date) {
            generatedMilestones.push({
              id: `phase-${phase.id}`,
              title: `${phase.name} 완료`,
              date: new Date(phase.end_date),
              type: 'milestone'
            });
          }
        });
      }
      setMilestones(generatedMilestones);
      
    } catch (error) {
      console.error('프로젝트 데이터 로드 실패:', error);
      toast.error('프로젝트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 의존성 관리 핸들러
  const handleDependencyAdd = async (dependency: Omit<TaskDependency, 'id'>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dependency)
      });
      
      if (response.ok) {
        const newDependency = await response.json();
        setDependencies(prev => [...prev, newDependency]);
        toast.success('의존성이 추가되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '의존성 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('의존성 추가 실패:', error);
      toast.error('의존성 추가에 실패했습니다.');
    }
  };

  const handleDependencyRemove = async (dependencyId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/dependencies/${dependencyId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setDependencies(prev => prev.filter(d => d.id !== dependencyId));
        toast.success('의존성이 삭제되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '의존성 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('의존성 삭제 실패:', error);
      toast.error('의존성 삭제에 실패했습니다.');
    }
  };

  const handleDependencyUpdate = async (dependencyId: string, updates: Partial<TaskDependency>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/dependencies/${dependencyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedDependency = await response.json();
        setDependencies(prev => 
          prev.map(d => d.id === dependencyId ? updatedDependency : d)
        );
        toast.success('의존성이 수정되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '의존성 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('의존성 수정 실패:', error);
      toast.error('의존성 수정에 실패했습니다.');
    }
  };

  // 단계 관리 핸들러
  const handlePhaseAdd = async (phase: Omit<ProjectPhase, 'id' | 'task_count' | 'completed_task_count'>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phase)
      });
      
      if (response.ok) {
        const newPhase = await response.json();
        const formattedPhase = {
          ...newPhase,
          start_date: newPhase.start_date ? new Date(newPhase.start_date) : null,
          end_date: newPhase.end_date ? new Date(newPhase.end_date) : null,
          task_count: 0,
          completed_task_count: 0
        };
        setPhases(prev => [...prev, formattedPhase]);
        toast.success('단계가 추가되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '단계 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('단계 추가 실패:', error);
      toast.error('단계 추가에 실패했습니다.');
    }
  };

  const handlePhaseUpdate = async (phaseId: string, updates: Partial<ProjectPhase>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedPhase = await response.json();
        const formattedPhase = {
          ...updatedPhase,
          start_date: updatedPhase.start_date ? new Date(updatedPhase.start_date) : null,
          end_date: updatedPhase.end_date ? new Date(updatedPhase.end_date) : null,
        };
        setPhases(prev => 
          prev.map(p => p.id === phaseId ? { ...p, ...formattedPhase } : p)
        );
        toast.success('단계가 수정되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '단계 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('단계 수정 실패:', error);
      toast.error('단계 수정에 실패했습니다.');
    }
  };

  const handlePhaseDelete = async (phaseId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPhases(prev => prev.filter(p => p.id !== phaseId));
        toast.success('단계가 삭제되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '단계 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('단계 삭제 실패:', error);
      toast.error('단계 삭제에 실패했습니다.');
    }
  };

  const handlePhaseReorder = async (phaseId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_index: newOrder })
      });
      
      if (response.ok) {
        setPhases(prev => 
          prev.map(p => p.id === phaseId ? { ...p, order_index: newOrder } : p)
        );
        toast.success('단계 순서가 변경되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '단계 순서 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('단계 순서 변경 실패:', error);
      toast.error('단계 순서 변경에 실패했습니다.');
    }
  };

  // 작업 클릭 핸들러
  const handleTaskClick = (taskId: string) => {
    // 작업 상세 페이지로 이동 또는 모달 열기
    console.log('작업 클릭:', taskId);
  };

  // 마일스톤 클릭 핸들러
  const handleMilestoneClick = (milestoneId: string) => {
    // 마일스톤 상세 정보 표시
    console.log('마일스톤 클릭:', milestoneId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            프로젝트로 돌아가기
          </Button>
          <h1 className="text-2xl font-bold">프로젝트 일정 관리</h1>
        </div>
      </div>

      {/* 프로젝트 개요 */}
      {project && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {project.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{project._count.members}</div>
                  <div className="text-sm text-gray-600">팀원</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{project._count.phases}</div>
                  <div className="text-sm text-gray-600">단계</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{project._count.tasks}</div>
                  <div className="text-sm text-gray-600">작업</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Target className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{project.progress}%</div>
                  <div className="text-sm text-gray-600">진행률</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">고객사:</span>
                <span className="ml-2">{project.client.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">상태:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">우선순위:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  project.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  project.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  project.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.priority}
                </span>
              </div>
            </div>

            {project.description && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">프로젝트 설명:</span>
                <p className="mt-1 text-gray-600">{project.description}</p>
              </div>
            )}

            {(project.start_date || project.end_date) && (
              <div className="mt-4 flex gap-4 text-sm">
                {project.start_date && (
                  <div>
                    <span className="font-medium text-gray-700">시작일:</span>
                    <span className="ml-2">{new Date(project.start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <span className="font-medium text-gray-700">종료일:</span>
                    <span className="ml-2">{new Date(project.end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="space-y-6">
        {activeTab === 'gantt' && (
          <GanttChart
            tasks={tasks}
            phases={phases}
            onTaskClick={handleTaskClick}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            tasks={tasks}
            milestones={milestones}
            onTaskClick={handleTaskClick}
            onMilestoneClick={handleMilestoneClick}
          />
        )}

        {activeTab === 'dependencies' && (
          <TaskDependencyManager
            tasks={tasks}
            dependencies={dependencies}
            onDependencyAdd={handleDependencyAdd}
            onDependencyRemove={handleDependencyRemove}
            onDependencyUpdate={handleDependencyUpdate}
          />
        )}

        {activeTab === 'phases' && (
          <ProjectPhaseManager
            phases={phases}
            onPhaseAdd={handlePhaseAdd}
            onPhaseUpdate={handlePhaseUpdate}
            onPhaseDelete={handlePhaseDelete}
            onPhaseReorder={handlePhaseReorder}
          />
        )}
      </div>

      {/* 요약 정보 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
          <div className="text-sm text-gray-600">총 작업</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(t => t.status === 'DONE').length}
          </div>
          <div className="text-sm text-gray-600">완료된 작업</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{phases.length}</div>
          <div className="text-sm text-gray-600">프로젝트 단계</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{dependencies.length}</div>
          <div className="text-sm text-gray-600">작업 의존성</div>
        </Card>
      </div>
    </div>
  );
} 