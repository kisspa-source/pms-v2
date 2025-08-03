import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, UserRole } from '@/lib/auth-guards'
import { UpdateProjectRequest } from '@/types/project'

// GET /api/projects/[id] - 프로젝트 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const projectId = params.id

    // 프로젝트 조회 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canViewAllProjects')) {
      // 자신이 속한 프로젝트만 조회 가능한지 확인
      const isMember = await prisma.projectMember.findFirst({
        where: {
          project_id: projectId,
          user_id: session.user.id
        }
      })

      if (!isMember) {
        return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
      }
    }

    // 프로젝트 상세 정보 조회
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contact_person: true,
            email: true,
            phone: true,
            website: true,
            status: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
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
                department: true,
                avatar_url: true,
              }
            }
          },
          orderBy: { joined_at: 'asc' }
        },
        phases: {
          orderBy: { order_index: 'asc' },
          include: {
            _count: {
              select: { tasks: true }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            phase: {
              select: {
                id: true,
                name: true,
              }
            },
            _count: {
              select: {
                sub_tasks: true,
                comments: true,
                attachments: true,
              }
            }
          },
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
            phases: true,
            time_logs: true,
            expenses: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)

  } catch (error) {
    console.error('프로젝트 상세 조회 오류:', error)
    return NextResponse.json(
      { error: '프로젝트를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - 프로젝트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 프로젝트 관리 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canManageProjects')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const projectId = params.id
    const body: UpdateProjectRequest = await request.json()

    // 프로젝트 존재 확인
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.project_type !== undefined) updateData.project_type = body.project_type
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.client_id !== undefined) updateData.client_id = body.client_id
    if (body.start_date !== undefined) updateData.start_date = body.start_date ? new Date(body.start_date) : null
    if (body.end_date !== undefined) updateData.end_date = body.end_date ? new Date(body.end_date) : null
    if (body.estimated_hours !== undefined) updateData.estimated_hours = body.estimated_hours
    if (body.budget_amount !== undefined) updateData.budget_amount = body.budget_amount ? parseFloat(body.budget_amount.toString()) : null
    if (body.contract_amount !== undefined) updateData.contract_amount = body.contract_amount ? parseFloat(body.contract_amount.toString()) : null
    if (body.currency !== undefined) updateData.currency = body.currency

    // 프로젝트 업데이트
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
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

    return NextResponse.json(updatedProject)

  } catch (error) {
    console.error('프로젝트 수정 오류:', error)
    return NextResponse.json(
      { error: '프로젝트를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - 프로젝트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 프로젝트 삭제 권한 확인 (PMO만 가능)
    if (!hasPermission(session.user.role as UserRole, 'canDeleteProjects')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const projectId = params.id

    // 프로젝트 존재 확인
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 프로젝트 삭제 (Cascade로 관련 데이터도 함께 삭제됨)
    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json(
      { message: '프로젝트가 성공적으로 삭제되었습니다.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('프로젝트 삭제 오류:', error)
    return NextResponse.json(
      { error: '프로젝트를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 