'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'
import { Project, ProjectStatus, Priority, ProjectType } from '@/types/project'
import { Plus, Search, Filter, Eye, Edit, Trash2, Users, Calendar, DollarSign, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useAlert, useConfirm } from '@/components/ui/alert-dialog'

interface ProjectListResponse {
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPermissionError, setHasPermissionError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    projectType: '',
    clientId: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState({
    statusDistribution: {} as Record<string, number>,
    averageProgress: 0,
    totalProjects: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const { showAlert, AlertComponent } = useAlert()
  const { showConfirm, ConfirmComponent } = useConfirm()

  // 프로젝트 목록 조회
  const fetchProjects = async (currentPage?: number) => {
    try {
      setLoading(true)
      setError(null)
      setHasPermissionError(false)
      
      const pageToUse = currentPage || pagination.page
      
      const params = new URLSearchParams({
        page: pageToUse.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        ...filters
      })

      const response = await fetch(`/api/projects?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 403) {
          setHasPermissionError(true)
          setError('프로젝트를 조회할 권한이 없습니다. 관리자에게 문의하세요.')
        } else if (response.status === 401) {
          setError('로그인이 필요합니다.')
        } else {
          setError(errorData.error || '프로젝트 목록을 불러오는데 실패했습니다.')
        }
        return
      }

      const data: ProjectListResponse = await response.json()
      
      // 데이터 유효성 검사
      if (!data || !data.projects || !Array.isArray(data.projects)) {
        throw new Error('잘못된 응답 형식입니다.')
      }
      
      setProjects(data.projects)
      
      if (data.pagination) {
        setPagination(data.pagination)
      }
      
      // 통계 계산
      const statusDistribution: Record<string, number> = {}
      let totalProgress = 0
      
      data.projects.forEach(project => {
        if (project && project.status) {
          statusDistribution[project.status] = (statusDistribution[project.status] || 0) + 1
          totalProgress += project.progress || 0
        }
      })
      
      setStats({
        statusDistribution,
        averageProgress: data.projects.length > 0 ? totalProgress / data.projects.length : 0,
        totalProjects: data.pagination?.total || data.projects.length
      })
    } catch (error) {
      console.error('프로젝트 목록 조회 오류:', error)
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 검색 및 필터 적용
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchProjects()
  }

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      projectType: '',
      clientId: ''
    })
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
    fetchProjects(page)
  }

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId: string) => {
    showConfirm(
      '정말로 이 프로젝트를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            const errorData = await response.json()
            if (response.status === 403) {
              showAlert('프로젝트를 삭제할 권한이 없습니다.', 'error')
            } else {
              showAlert(errorData.error || '프로젝트 삭제에 실패했습니다.', 'error')
            }
            return
          }

          // 목록 새로고침
          fetchProjects()
          showAlert('프로젝트가 성공적으로 삭제되었습니다.', 'success')
        } catch (error) {
          console.error('프로젝트 삭제 오류:', error)
          showAlert('프로젝트 삭제 중 오류가 발생했습니다.', 'error')
        }
      },
      {
        type: 'error',
        title: '프로젝트 삭제',
        confirmText: '삭제',
        cancelText: '취소'
      }
    )
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

  useEffect(() => {
    fetchProjects()
  }, [])

  if (loading) return (
    <MainLayout>
      <Loading />
    </MainLayout>
  )

  // 권한 오류 화면
  if (hasPermissionError) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">접근 권한이 없습니다</h3>
            <p className="text-gray-600 mb-8 text-lg">
              프로젝트를 조회할 권한이 없습니다.<br />
              관리자에게 권한 요청을 문의하세요.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="px-6"
              >
                새로고침
              </Button>
              <Link href="/dashboard">
                <Button className="px-6">
                  대시보드로 이동
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 일반 오류 화면
  if (error && !hasPermissionError) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">오류가 발생했습니다</h3>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => fetchProjects()} 
                className="px-6"
              >
                다시 시도
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="px-6">
                  대시보드로 이동
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
      {/* 헤더 - 컴팩트 버전 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-soft border border-blue-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">프로젝트 관리</h1>
          <p className="text-gray-600 text-sm">전체 {stats?.totalProjects || 0}개 프로젝트를 관리하고 있습니다 ✨</p>
        </div>
        <PermissionGuard permission="canManageProjects" fallback={null}>
          <Link href="/projects/new">
            <Button className="flex items-center gap-2 btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large transition-all duration-300 h-10 px-4 w-full sm:w-auto text-sm">
              <Plus className="w-4 h-4" />
              새 프로젝트
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* 통계 카드 - 매우 컴팩트 버전 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">전체</p>
                <p className="text-lg font-bold text-gray-800">{stats?.totalProjects || 0}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md">
                <Calendar className="w-3 h-3 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">진행중</p>
                <p className="text-lg font-bold text-gray-800">{stats?.statusDistribution?.[ProjectStatus.IN_PROGRESS] || 0}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-green-600 rounded-md">
                <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">평균진행율</p>
                <p className="text-lg font-bold text-gray-800">{Math.round(stats?.averageProgress || 0)}%</p>
              </div>
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-md">
                <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">완료</p>
                <p className="text-lg font-bold text-gray-800">{stats?.statusDistribution?.[ProjectStatus.COMPLETED] || 0}</p>
              </div>
              <div className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 rounded-md">
                <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 - 컴팩트 버전 */}
      <Card className="modern-card transition-all duration-300 shadow-sm hover:shadow-md border-0 mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="프로젝트명, 설명, 고객사로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-9 input-modern text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 hover-lift h-9 px-3 text-sm"
              >
                <Filter className="w-3 h-3" />
                필터
              </Button>
              <Button onClick={handleSearch} className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-9 px-3 text-sm">검색</Button>
              <Button variant="outline" onClick={clearFilters} className="hover-lift h-9 px-3 text-sm">초기화</Button>
            </div>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t">
              <div>
                <Label htmlFor="status" className="text-xs">상태</Label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm h-8"
                >
                  <option value="">전체</option>
                  {Object.values(ProjectStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-xs">우선순위</Label>
                <select
                  id="priority"
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm h-8"
                >
                  <option value="">전체</option>
                  {Object.values(Priority).map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="projectType" className="text-xs">프로젝트 타입</Label>
                <select
                  id="projectType"
                  value={filters.projectType}
                  onChange={(e) => setFilters(prev => ({ ...prev, projectType: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm h-8"
                >
                  <option value="">전체</option>
                  {Object.values(ProjectType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="clientId" className="text-xs">고객사</Label>
                <Input
                  id="clientId"
                  placeholder="고객사 ID"
                  value={filters.clientId}
                  onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 프로젝트 목록 - 향상된 카드 크기와 가시성 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <Card key={project.id} className="modern-card hover-lift hover-scale transition-all duration-300 border-0 shadow-lg hover:shadow-xl fade-in bg-white" style={{animationDelay: `${index * 50}ms`}}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold line-clamp-2 text-gray-800">
                  {project.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm" className="hover-scale bg-blue-50 hover:bg-blue-100 text-blue-600 h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <PermissionGuard permission="canManageProjects" fallback={null}>
                    <Link href={`/projects/${project.id}/edit`}>
                      <Button variant="ghost" size="sm" className="hover-scale bg-green-50 hover:bg-green-100 text-green-600 h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="hover-scale bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
                {project.description || '설명이 없습니다.'}
              </p>
              
              <div className="space-y-4">
                {/* 진행률 - 더 큰 크기 */}
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-gray-700">진행률</span>
                    <span className="text-gray-800 font-bold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* 프로젝트 정보 - 더 큰 아이콘과 텍스트 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">{project._count?.members || 0}명</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">{project._count?.tasks || 0}개 작업</span>
                  </div>
                </div>

                {/* 고객사 정보 */}
                {project.client && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>고객사:</strong> {project.client.name}
                    </div>
                  </div>
                )}

                {/* 일정 정보 */}
                {project.start_date && project.end_date && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span><strong>시작:</strong> {new Date(project.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span><strong>종료:</strong> {new Date(project.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                {/* 예산 정보 */}
                {project.budget_amount && (
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">예산: {project.budget_amount.toLocaleString()} {project.currency}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 - 컴팩트 버전 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="hover-lift h-8 px-3 text-sm"
            >
              이전
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === pagination.page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
                className={page === pagination.page ? "btn-modern bg-gradient-to-r from-blue-600 to-purple-600 h-8 px-3 text-sm" : "hover-lift h-8 px-3 text-sm"}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="hover-lift h-8 px-3 text-sm"
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 빈 상태 - 컴팩트 버전 */}
      {projects.length === 0 && !loading && (
        <div className="text-center py-12 fade-in">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-600 mb-6">새 프로젝트를 생성하여 시작하세요.</p>
          <Link href="/projects/new">
            <Button className="btn-modern bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-medium hover:shadow-large h-10 px-6 text-sm">
              <Plus className="w-4 h-4 mr-2" />
              새 프로젝트 생성
            </Button>
          </Link>
        </div>
      )}
      </div>
      
      {/* Alert/Confirm Components */}
      <AlertComponent />
      <ConfirmComponent />
    </MainLayout>
  )
} 