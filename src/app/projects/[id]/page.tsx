'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Project, ProjectStatus, Priority } from '@/types/project'
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  FileText,
  MessageSquare,
  Paperclip,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface ProjectDetail extends Project {
  client: {
    id: string
    name: string
    contact_person: string
    email: string
    phone: string
    website: string
    status: string
  }
  organization: {
    id: string
    name: string
    description: string
  }
  members: Array<{
    id: string
    user_id: string
    role: string
    allocation_percentage: number
    hourly_rate: number
    joined_at: string
    left_at: string
    user: {
      id: string
      name: string
      email: string
      role: string
      department: string
      avatar_url: string
    }
  }>
  phases: Array<{
    id: string
    name: string
    description: string
    start_date: string
    end_date: string
    status: string
    order_index: number
    _count: {
      tasks: number
    }
  }>
  tasks: Array<{
    id: string
    title: string
    description: string
    status: string
    priority: string
    assignee_id: string
    start_date: string
    due_date: string
    progress: number
    assignee: {
      id: string
      name: string
      email: string
    }
    _count: {
      sub_tasks: number
      comments: number
      attachments: number
    }
  }>
  _count: {
    members: number
    tasks: number
    phases: number
    time_logs: number
    expenses: number
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const projectId = params.id as string

  // 프로젝트 상세 정보 조회
  const fetchProjectDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/projects')
          return
        }
        throw new Error('프로젝트 정보를 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error('프로젝트 상세 조회 오류:', error)
      alert('프로젝트 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 프로젝트 상태 변경
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!confirm(`프로젝트 상태를 ${newStatus}로 변경하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('상태 변경에 실패했습니다.')

      // 프로젝트 정보 새로고침
      fetchProjectDetail()
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  // 상태별 색상
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING: return 'bg-blue-100 text-blue-800'
      case ProjectStatus.IN_PROGRESS: return 'bg-green-100 text-green-800'
      case ProjectStatus.ON_HOLD: return 'bg-yellow-100 text-yellow-800'
      case ProjectStatus.COMPLETED: return 'bg-gray-100 text-gray-800'
      case ProjectStatus.CANCELLED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 우선순위별 색상
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW: return 'bg-gray-100 text-gray-800'
      case Priority.MEDIUM: return 'bg-blue-100 text-blue-800'
      case Priority.HIGH: return 'bg-orange-100 text-orange-800'
      case Priority.CRITICAL: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 진행률 색상
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    if (progress >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // 작업 상태별 개수 계산
  const getTaskStatusCount = () => {
    if (!project) return {}
    
    return project.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  useEffect(() => {
    if (projectId) {
      fetchProjectDetail()
    }
  }, [projectId])

  if (loading) return <Loading />

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">프로젝트를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">요청하신 프로젝트가 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              프로젝트 목록으로
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const taskStatusCount = getTaskStatusCount()

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          </Link>
        </div>
      </div>

      {/* 상태 및 기본 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              프로젝트 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">현재 상태</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">우선순위</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">진행률</span>
                <span className="text-sm font-bold">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              
              {/* 상태 변경 버튼 */}
              <div className="pt-2">
                <select
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                >
                  {Object.values(ProjectStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              일정 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  <strong>시작일:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString() : '미정'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  <strong>종료일:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString() : '미정'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  <strong>예상 시간:</strong> {project.estimated_hours || 0}시간
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm">
                  <strong>실제 시간:</strong> {project.actual_hours}시간
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              예산 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">예산</span>
                <span className="text-sm">
                  {project.budget_amount ? `${project.budget_amount.toLocaleString()} ${project.currency}` : '미정'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">계약 금액</span>
                <span className="text-sm">
                  {project.contract_amount ? `${project.contract_amount.toLocaleString()} ${project.currency}` : '미정'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">실제 비용</span>
                <span className="text-sm">
                  {project.actual_cost.toLocaleString()} {project.currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: '개요', icon: BarChart3 },
            { id: 'members', label: '팀원', icon: Users },
            { id: 'schedule', label: '일정', icon: Calendar },
            { id: 'phases', label: '단계', icon: FileText },
            { id: 'tasks', label: '작업', icon: CheckCircle },
            { id: 'comments', label: '댓글', icon: MessageSquare },
            { id: 'attachments', label: '첨부파일', icon: Paperclip }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mb-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 고객사 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>고객사 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <strong>고객사명:</strong> {project.client.name}
                  </div>
                  <div>
                    <strong>담당자:</strong> {project.client.contact_person}
                  </div>
                  <div>
                    <strong>이메일:</strong> {project.client.email}
                  </div>
                  <div>
                    <strong>전화번호:</strong> {project.client.phone}
                  </div>
                  {project.client.website && (
                    <div>
                      <strong>웹사이트:</strong> {project.client.website}
                    </div>
                  )}
                  <div>
                    <strong>상태:</strong> {project.client.status}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 조직 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>조직 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <strong>조직명:</strong> {project.organization.name}
                  </div>
                  <div>
                    <strong>설명:</strong> {project.organization.description}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 통계 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>프로젝트 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{project._count.members}</div>
                    <div className="text-sm text-gray-600">팀원</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{project._count.tasks}</div>
                    <div className="text-sm text-gray-600">작업</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{project._count.phases}</div>
                    <div className="text-sm text-gray-600">단계</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{project._count.time_logs}</div>
                    <div className="text-sm text-gray-600">시간 로그</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 작업 상태별 통계 */}
            <Card>
              <CardHeader>
                <CardTitle>작업 상태별 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(taskStatusCount).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm">{status}</span>
                      <span className="text-sm font-bold">{count}개</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>프로젝트 팀원 ({project._count.members}명)</CardTitle>
                <Button
                  onClick={() => router.push(`/projects/${project.id}/members`)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  팀원 관리
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.members.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {member.user.avatar_url ? (
                          <img src={member.user.avatar_url} alt={member.user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium">{member.user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-gray-600">{member.user.email}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><strong>역할:</strong> {member.role}</div>
                      <div><strong>할당률:</strong> {member.allocation_percentage}%</div>
                      {member.hourly_rate && (
                        <div><strong>시급:</strong> {member.hourly_rate.toLocaleString()}원</div>
                      )}
                      <div><strong>참여일:</strong> {new Date(member.joined_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'schedule' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>프로젝트 일정</CardTitle>
                <Button
                  onClick={() => router.push(`/projects/${project.id}/schedule`)}
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  상세 일정 관리
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{project._count.tasks}</div>
                    <div className="text-sm text-gray-600">총 작업</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {project.tasks.filter(task => task.status === 'DONE').length}
                    </div>
                    <div className="text-sm text-gray-600">완료된 작업</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {project.tasks.filter(task => task.status === 'IN_PROGRESS').length}
                    </div>
                    <div className="text-sm text-gray-600">진행 중인 작업</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">최근 작업 현황</h4>
                  <div className="space-y-2">
                    {project.tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="text-xs text-gray-500">
                            {task.assignee?.name && `담당: ${task.assignee.name}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status as any)}`}>
                            {task.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            {task.progress}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/projects/${project.id}/schedule`)}
                  >
                    간트 차트에서 전체 일정 보기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'phases' && (
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 단계 ({project._count.phases}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.phases.map((phase) => (
                  <div key={phase.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{phase.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(phase.status as ProjectStatus)}`}>
                        {phase.status}
                      </span>
                    </div>
                    {phase.description && (
                      <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>시작일:</strong> {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : '미정'}
                      </div>
                      <div>
                        <strong>종료일:</strong> {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : '미정'}
                      </div>
                      <div>
                        <strong>작업 수:</strong> {phase._count.tasks}개
                      </div>
                      <div>
                        <strong>순서:</strong> {phase.order_index}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 작업 ({project._count.tasks}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status as ProjectStatus)}`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority as Priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>담당자:</strong> {task.assignee?.name || '미배정'}
                      </div>
                      <div>
                        <strong>진행률:</strong> {task.progress}%
                      </div>
                      <div>
                        <strong>댓글:</strong> {task._count.comments}개
                      </div>
                      <div>
                        <strong>첨부파일:</strong> {task._count.attachments}개
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'comments' && (
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 댓글</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                댓글 기능은 추후 구현 예정입니다.
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'attachments' && (
          <Card>
            <CardHeader>
              <CardTitle>첨부파일</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                첨부파일 기능은 추후 구현 예정입니다.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 