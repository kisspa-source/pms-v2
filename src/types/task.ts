// 작업 상태 타입
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';

// 작업 우선순위 타입
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// 의존성 타입
export type DependencyType = 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';

// 작업 기본 정보
export interface Task {
  id: string;
  project_id: string;
  phase_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  reporter_id?: string;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

// 작업 상세 정보 (관계 포함)
export interface TaskDetail extends Task {
  project: {
    id: string;
    name: string;
    status: string;
  };
  phase?: {
    id: string;
    name: string;
    status: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  reporter?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  parent_task?: {
    id: string;
    title: string;
    status: string;
  };
  sub_tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    progress: number;
    assignee?: {
      id: string;
      name: string;
    };
  }>;
  predecessors: Array<{
    id: string;
    dependency_type: DependencyType;
    lag_days: number;
    predecessor: {
      id: string;
      title: string;
      status: TaskStatus;
      due_date?: string;
    };
  }>;
  successors: Array<{
    id: string;
    dependency_type: DependencyType;
    lag_days: number;
    successor: {
      id: string;
      title: string;
      status: TaskStatus;
      due_date?: string;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      name: string;
      avatar_url?: string;
    };
    replies: Array<{
      id: string;
      content: string;
      created_at: string;
      user: {
        id: string;
        name: string;
        avatar_url?: string;
      };
    }>;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    created_at: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  time_logs: Array<{
    id: string;
    description?: string;
    hours: number;
    log_date: string;
    hourly_rate?: number;
    created_at: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    comments: number;
    attachments: number;
    time_logs: number;
    sub_tasks: number;
  };
}

// 작업 목록 아이템
export interface TaskListItem extends Task {
  project: {
    id: string;
    name: string;
  };
  phase?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  parent_task?: {
    id: string;
    title: string;
  };
  sub_tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    progress: number;
  }>;
  _count: {
    comments: number;
    attachments: number;
    time_logs: number;
  };
}

// 작업 생성 요청
export interface CreateTaskRequest {
  project_id: string;
  phase_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  reporter_id?: string;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
}

// 작업 수정 요청
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  progress?: number;
}

// 작업 의존성 생성 요청
export interface CreateDependencyRequest {
  successor_id: string;
  dependency_type?: DependencyType;
  lag_days?: number;
}

// 작업 필터 옵션
export interface TaskFilterOptions {
  project_id?: string;
  status?: TaskStatus;
  assignee_id?: string;
  priority?: TaskPriority;
  phase_id?: string;
}

// 칸반 보드 컬럼
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskListItem[];
}

// 작업 통계
export interface TaskStatistics {
  total: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<TaskPriority, number>;
  by_assignee: Record<string, number>;
  overdue: number;
  completed: number;
  completion_rate: number;
}

// 작업 진행률 계산 결과
export interface TaskProgressResult {
  task_id: string;
  progress: number;
  is_overdue: boolean;
  estimated_completion?: string;
  actual_vs_estimated: number;
} 