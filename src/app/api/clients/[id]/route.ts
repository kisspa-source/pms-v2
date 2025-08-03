import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, UserRole } from '@/lib/auth-guards'

// GET /api/clients/[id] - 클라이언트 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 클라이언트 조회 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canViewClients')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
          },
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: {
            projects: true,
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(client)

  } catch (error) {
    console.error('클라이언트 조회 오류:', error)
    return NextResponse.json(
      { error: '클라이언트를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - 클라이언트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 클라이언트 수정 권한 확인
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
      status 
    } = body

    // 클라이언트 존재 확인
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id }
    })

    if (!existingClient) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 클라이언트명 중복 확인 (자신 제외)
    if (name && name !== existingClient.name) {
      const duplicateClient = await prisma.client.findFirst({
        where: { 
          name,
          organization_id: existingClient.organization_id,
          id: { not: params.id }
        }
      })

      if (duplicateClient) {
        return NextResponse.json(
          { error: '이미 존재하는 클라이언트명입니다.' },
          { status: 400 }
        )
      }
    }

    // 클라이언트 수정
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
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
        status,
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

    return NextResponse.json(updatedClient)

  } catch (error) {
    console.error('클라이언트 수정 오류:', error)
    return NextResponse.json(
      { error: '클라이언트를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - 클라이언트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 클라이언트 삭제 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canManageClients')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 클라이언트 존재 확인
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            projects: true,
          }
        }
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: '클라이언트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 연관된 프로젝트가 있는지 확인
    if (existingClient._count.projects > 0) {
      return NextResponse.json(
        { error: '연관된 프로젝트가 있어 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 클라이언트 삭제
    await prisma.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '클라이언트가 성공적으로 삭제되었습니다.' })

  } catch (error) {
    console.error('클라이언트 삭제 오류:', error)
    return NextResponse.json(
      { error: '클라이언트를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}