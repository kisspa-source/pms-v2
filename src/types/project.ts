// 프로젝트 관련 타입 정의

export interface Project {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  description?: string;
  project_type?: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  start_date?: Date;
  end_date?: Date;
  estimated_hours?: number;
  actual_hours: number;
  budget_amount?: number;
  contract_amount?: number;
  actual_cost: number;
  currency: string;
  progress: number;
  created_at: Date;
  updated_at: Date;
  
  // Relations
  organization?: Organization;
  client?: Client;
  members?: ProjectMember[];
  phases?: ProjectPhase[];
  tasks?: Task[];
  
  // Count fields from Prisma
  _count?: {
    members?: number;
    tasks?: number;
    phases?: number;
  };
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: Role;
  allocation_percentage: number;
  hourly_rate?: number;
  joined_at: Date;
  left_at?: Date;
  
  // Relations
  project?: Project;
  user?: User;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  status: PhaseStatus;
  order_index: number;
  created_at: Date;
  
  // Relations
  project?: Project;
  tasks?: Task[];
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  company_type?: string;
  industry?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  status: ClientStatus;
  created_at: Date;
  updated_at: Date;
  
  // Relations
  organization?: Organization;
  projects?: Project[];
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  
  // Relations
  members?: OrganizationMember[];
  clients?: Client[];
  projects?: Project[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  hourly_rate?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  project_id: string;
  phase_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignee_id?: string;
  reporter_id?: string;
  start_date?: Date;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours: number;
  progress: number;
  created_at: Date;
  updated_at: Date;
}

// Enums
export enum ProjectType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  SYSTEM = 'SYSTEM',
  CONSULTING = 'CONSULTING',
  MAINTENANCE = 'MAINTENANCE'
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum Role {
  PMO = 'PMO',
  PM = 'PM',
  PL = 'PL',
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  CONSULTANT = 'CONSULTANT'
}

export enum PhaseStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED'
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROSPECT = 'PROSPECT'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED'
}

// API Request/Response 타입
export interface CreateProjectRequest {
  organization_id: string;
  client_id: string;
  name: string;
  description?: string;
  project_type?: ProjectType;
  priority?: Priority;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  budget_amount?: number;
  contract_amount?: number;
  currency?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  priority?: Priority;
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  budget_amount?: number;
  contract_amount?: number;
  currency?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: Priority[];
  project_type?: ProjectType[];
  client_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface CreateProjectMemberRequest {
  user_id: string;
  role: Role;
  allocation_percentage?: number;
  hourly_rate?: number;
}

export interface UpdateProjectMemberRequest {
  role?: Role;
  allocation_percentage?: number;
  hourly_rate?: number;
  left_at?: string;
} 