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
  Plus,
  Target
} from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'

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

  if (loading) return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">프로젝트 정보를 불러오는 중...</h3>
            <p className="text-gray-600">잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )

  if (!project) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">프로젝트를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-8 text-lg">요청하신 프로젝트가 존재하지 않거나 삭제되었습니다.</p>
            <Link href="/projects">
              <Button className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로젝트 목록으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const taskStatusCount = getTaskStatusCount()

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-soft border border-blue-100">
          <div className="flex items-start gap-4 flex-1">
            <Link href="/projects">
              <Button variant="outline" size="sm" className="hover-lift">
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로젝트 목록
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{project.name}</h1>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-lg mb-4">{project.description || '프로젝트 설명이 없습니다.'}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{project.client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span>
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : '시작일 미정'} ~ 
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : '종료일 미정'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>진행률 {project.progress}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/projects/${projectId}/edit`}>
              <Button className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-12 px-6">
                <Edit className="w-4 h-4 mr-2" />
                프로젝트 수정
              </Button>
            </Link>
          </div>
        </div>        {/*
 컴팩트한 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {/* 상태 */}
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 mb-1">상태</div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 진행률 */}
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 mb-1">진행률</div>
                  <div className="text-sm font-bold text-gray-800">{project.progress}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 팀원 수 */}
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 mb-1">팀원</div>
                  <div className="text-sm font-bold text-gray-800">{project._count.members}명</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 작업 수 */}
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 mb-1">작업</div>
                  <div className="text-sm font-bold text-gray-800">{project._count.tasks}개</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 예산 */}
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 mb-1">예산</div>
                  <div className="text-xs font-bold text-gray-800 truncate">
                    {project.budget_amount ? `${(project.budget_amount / 1000000).toFixed(0)}M` : '미정'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 일정 */}
          <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 mb-1">기간</div>
                  <div className="text-xs font-bold text-gray-800">
                    {project.start_date && project.end_date 
                      ? `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))}일`
                      : '미정'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상태 변경 및 상세 정보 (접을 수 있는 섹션) */}
        <Card className="modern-card border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  상세 정보 및 설정
                </span>
                <span className="text-xs text-gray-500 group-open:hidden">펼치기</span>
                <span className="text-xs text-gray-500 hidden group-open:inline">접기</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 상태 변경 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상태 변경</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={project.status}
                      onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                    >
                      {Object.values(ProjectStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* 일정 정보 */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">일정 정보</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>시작: {project.start_date ? new Date(project.start_date).toLocaleDateString() : '미정'}</div>
                      <div>종료: {project.end_date ? new Date(project.end_date).toLocaleDateString() : '미정'}</div>
                      <div>예상: {project.estimated_hours || 0}h / 실제: {project.actual_hours}h</div>
                    </div>
                  </div>

                  {/* 예산 정보 */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">예산 정보</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>예산: {project.budget_amount ? `${project.budget_amount.toLocaleString()} ${project.currency}` : '미정'}</div>
                      <div>계약: {project.contract_amount ? `${project.contract_amount.toLocaleString()} ${project.currency}` : '미정'}</div>
                      <div>실제: {project.actual_cost.toLocaleString()} {project.currency}</div>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* 탭 네비게이션 */}
        <Card className="modern-card border-0 shadow-medium mb-8">
          <CardContent className="p-0">
            <nav className="flex flex-wrap bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-2">
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
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover-scale ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-medium'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>      
  {/* 탭 컨텐츠 */}
        <div className="mb-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 고객사 및 조직 정보 - 컴팩트하게 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="modern-card border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      고객사 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">고객사명:</span>
                        <span className="font-medium">{project.client.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">담당자:</span>
                        <span className="font-medium">{project.client.contact_person}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">이메일:</span>
                        <span className="font-medium text-blue-600">{project.client.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">전화번호:</span>
                        <span className="font-medium">{project.client.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="modern-card border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      조직 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">조직명:</span>
                        <span className="font-medium">{project.organization.name}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600 text-xs">설명:</span>
                        <p className="text-sm mt-1 text-gray-800">{project.organization.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 작업 상태별 통계 - 더 시각적으로 */}
              <Card className="modern-card border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    작업 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(taskStatusCount).map(([status, count]) => (
                      <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-800">{count}</div>
                        <div className="text-xs text-gray-600">{status}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 프로젝트 설명 */}
              {project.description && (
                <Card className="modern-card border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      프로젝트 설명
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed">{project.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* 팀원 관리 헤더 - 컴팩트 버전 */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">프로젝트 팀원</h3>
                  <p className="text-sm text-gray-600">총 {project._count.members}명의 팀원이 참여하고 있습니다</p>
                </div>
                <Button
                  onClick={() => router.push(`/projects/${project.id}/members`)}
                  className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow-md px-4 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  팀원 관리
                </Button>
              </div>

              {/* 팀원 통계 - 컴팩트 버전 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">{project._count.members}</div>
                  <div className="text-xs text-gray-600">총 팀원</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {project.members.filter(m => m.role === 'PM' || m.role === 'MANAGER').length}
                  </div>
                  <div className="text-xs text-gray-600">관리자</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(project.members.reduce((sum, m) => sum + m.allocation_percentage, 0) / project.members.length)}%
                  </div>
                  <div className="text-xs text-gray-600">평균 할당률</div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {project.members.filter(m => !m.left_at).length}
                  </div>
                  <div className="text-xs text-gray-600">활성 팀원</div>
                </div>
              </div>  
            {/* 팀원 목록 */}
              <Card className="modern-card border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-700" />
                    팀원 목록
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {project.members.map((member, index) => (
                      <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          {/* 아바타 - 더 작게 */}
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              {member.user.avatar_url ? (
                                <img 
                                  src={member.user.avatar_url} 
                                  alt={member.user.name} 
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white" 
                                />
                              ) : (
                                <span className="text-sm font-bold text-white">
                                  {member.user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {!member.left_at && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>

                          {/* 기본 정보 - 컴팩트하게 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-800 truncate">{member.user.name}</h4>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {member.role}
                              </span>
                              {member.left_at && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  퇴사
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                {member.user.email}
                              </span>
                              {member.user.department && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                  {member.user.department}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 우측 정보 - 컴팩트하게 */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>할당률: {member.allocation_percentage}%</span>
                            {member.hourly_rate && (
                              <span>시급: {member.hourly_rate.toLocaleString()}원</span>
                            )}
                            <span>참여일: {new Date(member.joined_at).toLocaleDateString()}</span>
                            {member.left_at && (
                              <span className="text-red-600">
                                ~ {new Date(member.left_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 빈 상태 - 컴팩트 버전 */}
              {project.members.length === 0 && (
                <Card className="modern-card border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">팀원이 없습니다</h3>
                    <p className="text-gray-600 mb-4 text-sm">프로젝트에 참여할 팀원을 추가해보세요.</p>
                    <Button
                      onClick={() => router.push(`/projects/${project.id}/members`)}
                      className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow-md px-6 py-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      팀원 추가하기
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {/* 일정 헤더 - 컴팩트 버전 */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">프로젝트 일정</h3>
                <Button
                  onClick={() => router.push(`/projects/${project.id}/schedule`)}
                  className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow-md px-4 py-2"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  상세 일정 관리
                </Button>
              </div>

              <Card className="modern-card border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">시작일</div>
                        <div className="text-lg font-bold text-gray-800">
                          {project.start_date ? new Date(project.start_date).toLocaleDateString() : '미정'}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">종료일</div>
                        <div className="text-lg font-bold text-gray-800">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString() : '미정'}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">진행률</div>
                        <div className="text-lg font-bold text-gray-800">{project.progress}%</div>
                      </div>
                    </div>
                    
                    {/* 진행률 바 */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>전체 진행률</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}        
  {activeTab === 'phases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">프로젝트 단계 ({project._count.phases}개)</h3>
              </div>
              
              <Card className="modern-card border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {project.phases.map((phase) => (
                      <div key={phase.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800">{phase.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(phase.status as ProjectStatus)}`}>
                            {phase.status}
                          </span>
                        </div>
                        {phase.description && (
                          <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">시작일:</span> {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : '미정'}
                          </div>
                          <div>
                            <span className="font-medium">종료일:</span> {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : '미정'}
                          </div>
                          <div>
                            <span className="font-medium">작업 수:</span> {phase._count.tasks}개
                          </div>
                          <div>
                            <span className="font-medium">순서:</span> {phase.order_index}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">프로젝트 작업 ({project._count.tasks}개)</h3>
              </div>
              
              <Card className="modern-card border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800">{task.title}</h4>
                          <div className="flex gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status as ProjectStatus)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority as Priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">담당자:</span> {task.assignee?.name || '미배정'}
                          </div>
                          <div>
                            <span className="font-medium">진행률:</span> {task.progress}%
                          </div>
                          <div>
                            <span className="font-medium">댓글:</span> {task._count.comments}개
                          </div>
                          <div>
                            <span className="font-medium">첨부파일:</span> {task._count.attachments}개
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">프로젝트 댓글</h3>
              
              <Card className="modern-card border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">댓글 기능 준비 중</h4>
                  <p className="text-gray-600 text-sm">댓글 기능은 추후 구현 예정입니다.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">첨부파일</h3>
              
              <Card className="modern-card border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Paperclip className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">첨부파일 기능 준비 중</h4>
                  <p className="text-gray-600 text-sm">첨부파일 기능은 추후 구현 예정입니다.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}