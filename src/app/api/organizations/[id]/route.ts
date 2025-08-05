import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth-guards'

// GET /api/organizations/[id] - 특정 조직 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 조직 관리 권한 확인
    if (!hasPermission(session.user.role, 'canManageOrganizations')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const organizationId = params.id

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
              }
            }
          },
          orderBy: { joined_at: 'desc' }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: {
            members: true,
            projects: true,
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: '조직을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)

  } catch (error) {
    console.error('조직 조회 오류:', error)
    return NextResponse.json(
      { error: '조직을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/organizations/[id] - 조직 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 조직 관리 권한 확인
    if (!hasPermission(session.user.role, 'canManageOrganizations')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const organizationId = params.id
    const body = await request.json()
    const { name, description, address, phone, email, website } = body

    // 조직 존재 확인
    const existingOrganization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!existingOrganization) {
      return NextResponse.json(
        { error: '조직을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조직명 중복 확인 (다른 조직과 중복되지 않는지)
    if (name && name !== existingOrganization.name) {
      const nameExists = await prisma.organization.findFirst({
        where: { name }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: '이미 존재하는 조직명입니다.' },
          { status: 400 }
        )
      }
    }

    // 조직 정보 업데이트
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: name || existingOrganization.name,
        description: description !== undefined ? description : existingOrganization.description,
        address: address !== undefined ? address : existingOrganization.address,
        phone: phone !== undefined ? phone : existingOrganization.phone,
        email: email !== undefined ? email : existingOrganization.email,
        website: website !== undefined ? website : existingOrganization.website,
      },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      description: updatedOrganization.description,
      address: updatedOrganization.address,
      phone: updatedOrganization.phone,
      email: updatedOrganization.email,
      website: updatedOrganization.website,
      createdAt: updatedOrganization.created_at.toISOString(),
      updatedAt: updatedOrganization.updated_at.toISOString(),
      _count: {
        users: updatedOrganization._count.members,
        projects: updatedOrganization._count.projects,
      }
    })



  } catch (error) {
    console.error('조직 수정 오류:', error)
    return NextResponse.json(
      { error: '조직 정보를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations/[id] - 조직 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 조직 관리 권한 확인
    if (!hasPermission(session.user.role, 'canManageOrganizations')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const organizationId = params.id

    // 조직 존재 확인
    const existingOrganization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          }
        }
      }
    })

    if (!existingOrganization) {
      return NextResponse.json(
        { error: '조직을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조직에 속한 사용자나 프로젝트가 있는지 확인
    if (existingOrganization._count.members > 0 || existingOrganization._count.projects > 0) {
      return NextResponse.json(
        { error: '사용자나 프로젝트가 속한 조직은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 조직 삭제
    await prisma.organization.delete({
      where: { id: organizationId }
    })

    return NextResponse.json(
      { message: '조직이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('조직 삭제 오류:', error)
    return NextResponse.json(
      { error: '조직을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 