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
  activeClients: number
  monthlyRevenue: number
  pendingTasks: number
  inProgressTasks: number
  overdueTasks: number
  recentActivities: Array<{
    id: string
    type: string
    description: string
    timeText: string
    timestamp: string
  }>
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
    activeClients: 0,
    monthlyRevenue: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    recentActivities: []
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
      const response = await fetch('/api/dashboard')
      
      if (!response.ok) {
        throw new Error('대시보드 데이터를 불러오는데 실패했습니다.')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('대시보드 통계 조회 오류:', error)
      // 오류 발생 시 기본값 유지
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

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">대시보드를 불러오는 중...</div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* 환영 메시지 - 컴팩트 버전 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-soft border border-blue-100 fade-in mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{getRoleBasedGreeting()}</h1>
            <p className="text-gray-600 text-sm">오늘도 좋은 하루 되세요! ✨</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs px-3 py-1 bg-white/80 backdrop-blur-sm shadow-soft">
              {session?.user?.role}
            </Badge>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-medium">
              <span className="text-white font-bold text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
        
        {/* 통계 카드들 - 컴팩트 버전 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {getRoleBasedStats().map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="modern-card hover-lift transition-all duration-300 border-0 shadow-sm hover:shadow-md fade-in" style={{animationDelay: `${index * 100}ms`}}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{stat.title}</p>
                      <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor} shadow-sm`}>
                      <IconComponent className={`h-4 w-4 ${stat.color}`} />
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
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.slice(0, 4).map((activity, index) => {
                    const colors = [
                      { bg: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200', border: 'border-blue-200', dot: 'bg-blue-500' },
                      { bg: 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200', border: 'border-green-200', dot: 'bg-green-500' },
                      { bg: 'from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200', border: 'border-yellow-200', dot: 'bg-yellow-500' },
                      { bg: 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200', border: 'border-purple-200', dot: 'bg-purple-500' }
                    ]
                    const color = colors[index % colors.length]
                    
                    return (
                      <div key={activity.id} className={`flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r ${color.bg} transition-all duration-300 hover-scale border ${color.border}`}>
                        <div className={`w-3 h-3 ${color.dot} rounded-full mt-2 shadow-soft`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-800">{activity.type}</p>
                            <Badge variant="secondary" className="text-xs bg-white/80 shadow-soft">{activity.timeText}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>최근 활동이 없습니다.</p>
                  </div>
                )}
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