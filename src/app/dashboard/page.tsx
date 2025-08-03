'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { UserRole } from '@/lib/auth-guards'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  BarChart3, 
  Users, 
  Building2, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Plus,
  UserCheck,
  FileText,
  Activity
} from 'lucide-react'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalUsers: number
  totalClients: number
  monthlyRevenue: number
  pendingTasks: number
  overdueTasks: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const permissions = usePermissions()
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalUsers: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    pendingTasks: 0,
    overdueTasks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
    } else {
      fetchDashboardStats()
    }
  }, [session, status, router])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      // 실제로는 API에서 데이터를 가져와야 함
      // 현재는 더미 데이터 사용
      setStats({
        totalProjects: 25,
        activeProjects: 12,
        completedProjects: 8,
        totalUsers: 24,
        totalClients: 15,
        monthlyRevenue: 125000000,
        pendingTasks: 45,
        overdueTasks: 3
      })
    } catch (error) {
      console.error('대시보드 통계 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBasedGreeting = () => {
    if (!session?.user?.role) return '안녕하세요!'
    
    switch (session.user.role) {
      case UserRole.PMO:
        return 'PMO님, 안녕하세요!'
      case UserRole.PM:
        return '프로젝트 매니저님, 안녕하세요!'
      case UserRole.PL:
        return '프로젝트 리더님, 안녕하세요!'
      case UserRole.DEVELOPER:
        return '개발자님, 안녕하세요!'
      case UserRole.DESIGNER:
        return '디자이너님, 안녕하세요!'
      case UserRole.CONSULTANT:
        return '컨설턴트님, 안녕하세요!'
      default:
        return '안녕하세요!'
    }
  }

  const getRoleBasedStats = () => {
    const baseStats = [
      {
        title: '진행 중인 프로젝트',
        value: stats.activeProjects,
        change: '+12%',
        changeType: 'positive' as const,
        icon: BarChart3,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: '완료된 프로젝트',
        value: stats.completedProjects,
        change: '+8%',
        changeType: 'positive' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    ]

    // PMO, PM만 볼 수 있는 통계
    if (permissions?.can('canManageUsers')) {
      baseStats.push({
        title: '총 사용자',
        value: stats.totalUsers,
        change: '+3%',
        changeType: 'positive' as const,
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      })
    }

    if (permissions?.can('canManageClients')) {
      baseStats.push({
        title: '총 고객사',
        value: stats.totalClients,
        change: '+5%',
        changeType: 'positive' as const,
        icon: Building2,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      })
    }

    // PMO만 볼 수 있는 통계
    if (permissions?.can('canViewReports')) {
      baseStats.push({
        title: '이번 달 매출',
        value: `₩${(stats.monthlyRevenue / 1000000).toFixed(0)}M`,
        change: '+15%',
        changeType: 'positive' as const,
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
      })
    }

    return baseStats
  }

  const getRoleBasedActions = () => {
    const actions = []

    if (permissions?.can('canManageProjects')) {
      actions.push({
        label: '새 프로젝트 생성',
        href: '/projects',
        icon: Plus,
        variant: 'default' as const
      })
    }

    if (permissions?.can('canManageUsers')) {
      actions.push({
        label: '사용자 관리',
        href: '/users',
        icon: UserCheck,
        variant: 'secondary' as const
      })
    }

    if (permissions?.can('canManageClients')) {
      actions.push({
        label: '고객사 관리',
        href: '/clients',
        icon: Building2,
        variant: 'outline' as const
      })
    }

    if (permissions?.can('canViewReports')) {
      actions.push({
        label: '보고서 보기',
        href: '/reports',
        icon: FileText,
        variant: 'ghost' as const
      })
    }

    return actions
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* 환영 메시지 */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-soft border border-blue-100 fade-in">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{getRoleBasedGreeting()}</h1>
            <p className="text-gray-600 text-lg">오늘도 좋은 하루 되세요! ✨</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-white/80 backdrop-blur-sm shadow-soft">
              {session?.user?.role}
            </Badge>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-medium">
              <span className="text-white font-bold text-lg">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
        
        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getRoleBasedStats().map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="modern-card hover-lift hover-scale transition-all duration-300 border-0 shadow-medium hover:shadow-large fade-in" style={{animationDelay: `${index * 100}ms`}}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                      <p className="text-4xl font-bold text-gray-800">{stat.value}</p>
                      <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-semibold">{stat.change}</span>
                        <span className="text-xs text-gray-500">vs 지난달</span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-2xl ${stat.bgColor} shadow-soft hover-scale`}>
                      <IconComponent className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 최근 활동 */}
          <Card className="modern-card hover-lift transition-all duration-300 shadow-medium hover:shadow-large border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">최근 활동</CardTitle>
                  <CardDescription className="text-gray-600">시스템에서 발생한 최근 활동들입니다.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover-scale border border-blue-200">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 shadow-soft"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">새 프로젝트 생성</p>
                      <Badge variant="secondary" className="text-xs bg-white/80 shadow-soft">2시간 전</Badge>
                    </div>
                    <p className="text-sm text-gray-600">웹사이트 리뉴얼 프로젝트가 생성되었습니다.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover-scale border border-green-200">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 shadow-soft"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">프로젝트 완료</p>
                      <Badge variant="secondary" className="text-xs bg-white/80 shadow-soft">4시간 전</Badge>
                    </div>
                    <p className="text-sm text-gray-600">모바일 앱 개발 프로젝트가 완료되었습니다.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 hover-scale border border-yellow-200">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 shadow-soft"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">새 사용자 추가</p>
                      <Badge variant="secondary" className="text-xs bg-white/80 shadow-soft">1일 전</Badge>
                    </div>
                    <p className="text-sm text-gray-600">김철수님이 시스템에 추가되었습니다.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 hover-scale border border-purple-200">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 shadow-soft"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">고객사 정보 업데이트</p>
                      <Badge variant="secondary" className="text-xs bg-white/80 shadow-soft">2일 전</Badge>
                    </div>
                    <p className="text-sm text-gray-600">ABC 회사의 연락처 정보가 업데이트되었습니다.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 빠른 액션 */}
          <Card className="modern-card hover-lift transition-all duration-300 shadow-medium hover:shadow-large border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">빠른 액션</CardTitle>
                  <CardDescription className="text-gray-600">자주 사용하는 기능에 빠르게 접근하세요.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getRoleBasedActions().map((action, index) => {
                  const IconComponent = action.icon
                  return (
                    <Button
                      key={index}
                      variant={action.variant}
                      className="w-full justify-start h-14 text-left btn-modern bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 shadow-soft hover:shadow-medium transition-all duration-300"
                      onClick={() => router.push(action.href)}
                    >
                      <IconComponent className="mr-4 h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-800">{action.label}</span>
                    </Button>
                  )
                })}
                
                {getRoleBasedActions().length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">사용 가능한 액션이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 추가 정보 섹션 */}
        {permissions?.can('canViewReports') && (
          <Card className="modern-card hover-lift transition-all duration-300 shadow-medium hover:shadow-large border-0">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">프로젝트 현황</CardTitle>
                  <CardDescription className="text-gray-600">전체 프로젝트의 진행 상황을 확인하세요.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-8 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl border border-blue-300 shadow-soft hover-lift hover-scale transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-blue-700 mb-2">{stats.totalProjects}</p>
                  <p className="text-sm text-blue-800 font-semibold uppercase tracking-wide mb-4">총 프로젝트</p>
                  <Progress value={85} className="mt-4 h-3 bg-blue-200" />
                  <p className="text-sm text-blue-700 mt-2 font-medium">85% 활성화</p>
                </div>
                <div className="text-center p-8 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 rounded-2xl border border-yellow-300 shadow-soft hover-lift hover-scale transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-yellow-700 mb-2">{stats.pendingTasks}</p>
                  <p className="text-sm text-yellow-800 font-semibold uppercase tracking-wide mb-4">대기 중인 작업</p>
                  <Progress value={65} className="mt-4 h-3 bg-yellow-200" />
                  <p className="text-sm text-yellow-700 mt-2 font-medium">65% 진행률</p>
                </div>
                <div className="text-center p-8 bg-gradient-to-br from-red-50 via-red-100 to-red-200 rounded-2xl border border-red-300 shadow-soft hover-lift hover-scale transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-red-700 mb-2">{stats.overdueTasks}</p>
                  <p className="text-sm text-red-800 font-semibold uppercase tracking-wide mb-4">지연된 작업</p>
                  <Progress value={15} className="mt-4 h-3 bg-red-200" />
                  <p className="text-sm text-red-700 mt-2 font-medium">즉시 조치 필요</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
} 