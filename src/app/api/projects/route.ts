import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, UserRole } from '@/lib/auth-guards'
import { ProjectFilters, CreateProjectRequest } from '@/types/project'

// GET /api/projects - 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 프로젝트 조회 권한 확인 - 모든 사용자가 자신이 속한 프로젝트는 볼 수 있도록 수정
    const canViewAllProjects = hasPermission(session.user.role as UserRole, 'canViewAllProjects')

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

    const skip = (page - 1) * limit

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (projectType) {
      where.project_type = projectType
    }

    if (clientId) {
      where.client_id = clientId
    }

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

    // 역할에 따른 프로젝트 필터링
    if (!canViewAllProjects) {
      // 자신이 속한 프로젝트만 조회
      where.members = {
        some: {
          user_id: session.user.id
        }
      }
    }

    // 프로젝트 목록 조회
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
          _count: {
            select: {
              members: true,
              tasks: true,
              phases: true,
            }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects - 새 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 프로젝트 관리 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canManageProjects')) {
      return NextResponse.json({ error: '프로젝트를 생성할 권한이 없습니다.' }, { status: 403 })
    }

    const body: CreateProjectRequest = await request.json()
    const { 
      organization_id,
      client_id,
      name, 
      description, 
      project_type,
      priority = 'MEDIUM',
      start_date, 
      end_date, 
      estimated_hours,
      budget_amount,
      contract_amount,
      currency = 'KRW'
    } = body

    // 필수 필드 검증
    if (!name || !client_id || !organization_id) {
      return NextResponse.json(
        { error: '프로젝트명, 고객사, 조직은 필수입니다.' },
        { status: 400 }
      )
    }

    // 고객사 존재 확인
    const client = await prisma.client.findUnique({
      where: { id: client_id }
    })

    if (!client) {
      return NextResponse.json(
        { error: '존재하지 않는 고객사입니다.' },
        { status: 400 }
      )
    }

    // 조직 존재 확인
    const organization = await prisma.organization.findUnique({
      where: { id: organization_id }
    })

    if (!organization) {
      return NextResponse.json(
        { error: '존재하지 않는 조직입니다.' },
        { status: 400 }
      )
    }

    // 새 프로젝트 생성
    const newProject = await prisma.project.create({
      data: {
        organization_id,
        client_id,
        name,
        description,
        project_type,
        priority,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        estimated_hours,
        budget_amount: budget_amount ? parseFloat(budget_amount.toString()) : null,
        contract_amount: contract_amount ? parseFloat(contract_amount.toString()) : null,
        currency,
        status: 'PLANNING',
        progress: 0,
        actual_hours: 0,
        actual_cost: 0,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contact_person: true,
            email: true,
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
        _count: {
          select: {
            members: true,
            tasks: true,
            phases: true,
          }
        }
      }
    })

    return NextResponse.json(newProject, { status: 201 })

  } catch (error) {
    console.error('프로젝트 생성 오류:', error)
    return NextResponse.json(
      { error: '프로젝트를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 