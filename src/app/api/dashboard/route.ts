import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectStatus, ClientStatus, TaskStatus } from '@/types/project'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 병렬로 모든 통계 데이터 조회
    const [
      projectStats,
      clientStats,
      userStats,
      taskStats,
      recentActivities
    ] = await Promise.all([
      // 프로젝트 통계
      prisma.project.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        where: {
          organization_id: session.user.organizationId
        }
      }),
      
      // 고객사 통계
      prisma.client.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        where: {
          organization_id: session.user.organizationId
        }
      }),
      
      // 사용자 통계 (organization_members를 통해 계산)
      prisma.organizationMember.count({
        where: {
          organization_id: session.user.organizationId
        }
      }),
      
      // 작업 통계
      prisma.task.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        where: {
          project: {
            organization_id: session.user.organizationId
          }
        }
      }),
      
      // 최근 활동 (프로젝트 생성, 완료 등)
      prisma.project.findMany({
        where: {
          organization_id: session.user.organizationId
        },
        select: {
          id: true,
          name: true,
          status: true,
          created_at: true,
          updated_at: true
        },
        orderBy: {
          updated_at: 'desc'
        },
        take: 10
      })
    ])

    // 프로젝트 통계 집계
    const totalProjects = projectStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const activeProjects = projectStats.find(stat => stat.status === ProjectStatus.IN_PROGRESS)?._count.id || 0
    const completedProjects = projectStats.find(stat => stat.status === ProjectStatus.COMPLETED)?._count.id || 0

    // 고객사 통계 집계
    const totalClients = clientStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const activeClients = clientStats.find(stat => stat.status === ClientStatus.ACTIVE)?._count.id || 0

    // 작업 통계 집계
    const pendingTasks = taskStats.find(stat => stat.status === TaskStatus.TODO)?._count.id || 0
    const inProgressTasks = taskStats.find(stat => stat.status === TaskStatus.IN_PROGRESS)?._count.id || 0
    
    // 지연된 작업 계산 (마감일이 지난 작업)
    const overdueTasks = await prisma.task.count({
      where: {
        project: {
          organization_id: session.user.organizationId
        },
        due_date: {
          lt: new Date()
        },
        status: {
          not: TaskStatus.COMPLETED
        }
      }
    })

    // 이번 달 매출 계산 (예산 기준)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const monthlyRevenue = await prisma.project.aggregate({
      _sum: {
        budget_amount: true
      },
      where: {
        organization_id: session.user.organizationId,
        status: ProjectStatus.COMPLETED,
        updated_at: {
          gte: currentMonth,
          lt: nextMonth
        }
      }
    })

    // 최근 활동 포맷팅
    const formattedActivities = recentActivities.map(project => {
      const timeDiff = Date.now() - new Date(project.updated_at).getTime()
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
      const daysAgo = Math.floor(hoursAgo / 24)
      
      let timeText = ''
      if (daysAgo > 0) {
        timeText = `${daysAgo}일 전`
      } else if (hoursAgo > 0) {
        timeText = `${hoursAgo}시간 전`
      } else {
        timeText = '방금 전'
      }

      let activityType = ''
      let description = ''
      
      if (project.status === ProjectStatus.COMPLETED) {
        activityType = '프로젝트 완료'
        description = `${project.name} 프로젝트가 완료되었습니다.`
      } else if (project.status === ProjectStatus.IN_PROGRESS) {
        activityType = '프로젝트 진행'
        description = `${project.name} 프로젝트가 진행 중입니다.`
      } else {
        activityType = '프로젝트 업데이트'
        description = `${project.name} 프로젝트가 업데이트되었습니다.`
      }

      return {
        id: project.id,
        type: activityType,
        description,
        timeText,
        timestamp: project.updated_at
      }
    })

    const dashboardStats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalUsers: userStats,
      totalClients,
      activeClients,
      monthlyRevenue: monthlyRevenue._sum.budget_amount || 0,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      recentActivities: formattedActivities
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '대시보드 통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}