import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 기본 통계 조회
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalUsers,
      totalClients,
      activeClients,
      pendingTasks,
      inProgressTasks,
      overdueTasks
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({
        where: { status: 'IN_PROGRESS' }
      }),
      prisma.project.count({
        where: { status: 'COMPLETED' }
      }),
      prisma.user.count(),
      prisma.client.count(),
      prisma.client.count({
        where: { status: 'ACTIVE' }
      }),
      // 작업 통계
      prisma.task.count({
        where: { status: 'TODO' }
      }),
      prisma.task.count({
        where: { status: 'IN_PROGRESS' }
      }),
      prisma.task.count({
        where: { 
          status: { notIn: ['DONE'] },
          due_date: { lt: new Date() }
        }
      })
    ])

    // 최근 활동 조회 (예시 데이터)
    const recentActivities = [
      {
        id: '1',
        type: 'project_created',
        description: '새 프로젝트가 생성되었습니다',
        timeText: '방금 전',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'task_completed',
        description: '작업이 완료되었습니다',
        timeText: '1시간 전',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        type: 'user_joined',
        description: '새 팀원이 합류했습니다',
        timeText: '2시간 전',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ]

    const dashboardStats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalUsers,
      totalClients,
      activeClients,
      monthlyRevenue: 0, // 실제 구현 시 계산 필요
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      recentActivities
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '대시보드 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}