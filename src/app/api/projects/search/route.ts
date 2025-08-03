import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth-guards'
import { ProjectFilters } from '@/types/project'

// GET /api/projects/search - 프로젝트 검색 및 고급 필터링
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 프로젝트 조회 권한 확인
    if (!hasPermission(session.user.role, 'canViewAllProjects')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const projectType = searchParams.get('projectType') || ''
    const clientId = searchParams.get('clientId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const minProgress = searchParams.get('minProgress') || ''
    const maxProgress = searchParams.get('maxProgress') || ''
    const minBudget = searchParams.get('minBudget') || ''
    const maxBudget = searchParams.get('maxBudget') || ''
    const memberId = searchParams.get('memberId') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // 검색 조건 구성
    const where: any = {}
    
    // 텍스트 검색
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { organization: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // 상태 필터
    if (status) {
      const statusArray = status.split(',')
      where.status = { in: statusArray }
    }

    // 우선순위 필터
    if (priority) {
      const priorityArray = priority.split(',')
      where.priority = { in: priorityArray }
    }

    // 프로젝트 타입 필터
    if (projectType) {
      const typeArray = projectType.split(',')
      where.project_type = { in: typeArray }
    }

    // 고객사 필터
    if (clientId) {
      where.client_id = clientId
    }

    // 날짜 범위 필터
    if (startDate) {
      where.start_date = {
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      where.end_date = {
        lte: new Date(endDate)
      }
    }

    // 진행률 범위 필터
    if (minProgress || maxProgress) {
      where.progress = {}
      if (minProgress) where.progress.gte = parseInt(minProgress)
      if (maxProgress) where.progress.lte = parseInt(maxProgress)
    }

    // 예산 범위 필터
    if (minBudget || maxBudget) {
      where.budget_amount = {}
      if (minBudget) where.budget_amount.gte = parseFloat(minBudget)
      if (maxBudget) where.budget_amount.lte = parseFloat(maxBudget)
    }

    // 멤버 필터
    if (memberId) {
      where.members = {
        some: {
          user_id: memberId
        }
      }
    }

    // 역할에 따른 프로젝트 필터링
    if (!hasPermission(session.user.role, 'canViewAllProjects')) {
      // 자신이 속한 프로젝트만 조회
      where.members = {
        some: {
          user_id: session.user.id
        }
      }
    }

    // 정렬 조건 구성
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 프로젝트 검색 실행
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              contact_person: true,
              email: true,
              status: true,
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                }
              }
            }
          },
          phases: {
            select: {
              id: true,
              name: true,
              status: true,
            }
          },
          _count: {
            select: {
              members: true,
              tasks: true,
              phases: true,
              time_logs: true,
            }
          }
        },
        orderBy
      }),
      prisma.project.count({ where })
    ])

    // 통계 정보 계산
    const stats = await prisma.project.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    })

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    // 평균 진행률 계산
    const avgProgress = await prisma.project.aggregate({
      where,
      _avg: {
        progress: true
      }
    })

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        status,
        priority,
        projectType,
        clientId,
        startDate,
        endDate,
        minProgress,
        maxProgress,
        minBudget,
        maxBudget,
        memberId,
        sortBy,
        sortOrder
      },
      stats: {
        statusDistribution: statusStats,
        averageProgress: avgProgress._avg.progress || 0,
        totalProjects: total
      }
    })

  } catch (error) {
    console.error('프로젝트 검색 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 