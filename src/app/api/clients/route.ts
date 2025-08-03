import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, UserRole } from '@/lib/auth-guards'

// GET /api/clients - 클라이언트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 클라이언트 조회 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canViewClients')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contact_person: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 클라이언트 목록 조회
    const [clients, total, allClients] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              projects: true,
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.client.count({ where }),
      prisma.client.findMany({
        select: {
          status: true,
        }
      })
    ])

    // 상태별 통계 계산
    const statusDistribution = allClients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        statusDistribution,
        totalClients: allClients.length
      }
    })

  } catch (error) {
    console.error('클라이언트 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '클라이언트 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/clients - 새 클라이언트 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 클라이언트 생성 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canManageClients')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      company_type,
      industry,
      contact_person, 
      email, 
      phone, 
      address, 
      website, 
      notes,
      status,
      organization_id 
    } = body

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: '클라이언트명은 필수입니다.' },
        { status: 400 }
      )
    }

    // 클라이언트명 중복 확인
    const existingClient = await prisma.client.findFirst({
      where: { 
        name,
        organization_id: organization_id || session.user.organizationId
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: '이미 존재하는 클라이언트명입니다.' },
        { status: 400 }
      )
    }

    // 새 클라이언트 생성
    const newClient = await prisma.client.create({
      data: {
        name,
        company_type,
        industry,
        contact_person,
        email,
        phone,
        address,
        website,
        notes,
        status: status || 'PROSPECT',
        organization_id: organization_id || session.user.organizationId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            projects: true,
          }
        }
      }
    })

    return NextResponse.json(newClient, { status: 201 })

  } catch (error) {
    console.error('클라이언트 생성 오류:', error)
    return NextResponse.json(
      { error: '클라이언트를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}