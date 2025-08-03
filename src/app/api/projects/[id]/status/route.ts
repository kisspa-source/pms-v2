import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth-guards'
import { ProjectStatus } from '@/types/project'

// PUT /api/projects/[id]/status - 프로젝트 상태 변경
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
    if (!hasPermission(session.user.role, 'canManageProjects')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const projectId = params.id
    const body = await request.json()
    const { status, reason } = body

    // 상태값 검증
    if (!status || !Object.values(ProjectStatus).includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 프로젝트 상태입니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 존재 확인
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
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

    if (!existingProject) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 변경 검증 로직
    const currentStatus = existingProject.status
    const newStatus = status as ProjectStatus

    // 상태 변경 규칙 검증
    if (currentStatus === ProjectStatus.COMPLETED && newStatus !== ProjectStatus.COMPLETED) {
      return NextResponse.json(
        { error: '완료된 프로젝트의 상태를 변경할 수 없습니다.' },
        { status: 400 }
      )
    }

    if (currentStatus === ProjectStatus.CANCELLED && newStatus !== ProjectStatus.CANCELLED) {
      return NextResponse.json(
        { error: '취소된 프로젝트의 상태를 변경할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 진행률 자동 업데이트 로직
    let progress = existingProject.progress
    if (newStatus === ProjectStatus.COMPLETED) {
      progress = 100
    } else if (newStatus === ProjectStatus.IN_PROGRESS && progress === 0) {
      progress = 10 // 시작 시 기본 진행률
    }

    // 프로젝트 상태 업데이트
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: newStatus,
        progress,
        updated_at: new Date(),
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

    // 상태 변경 이력 기록 (선택사항)
    await prisma.comment.create({
      data: {
        project_id: projectId,
        user_id: session.user.id,
        content: `프로젝트 상태가 ${currentStatus}에서 ${newStatus}로 변경되었습니다.${reason ? ` 사유: ${reason}` : ''}`,
      }
    })

    return NextResponse.json({
      project: updatedProject,
      message: '프로젝트 상태가 성공적으로 변경되었습니다.',
      previousStatus: currentStatus,
      newStatus: newStatus
    })

  } catch (error) {
    console.error('프로젝트 상태 변경 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 상태를 변경하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/status - 프로젝트 상태 이력 조회
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
    if (!hasPermission(session.user.role, 'canViewAllProjects')) {
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

    // 프로젝트 존재 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        created_at: true,
        updated_at: true,
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 변경 이력 조회 (댓글에서 상태 변경 내용 추출)
    const statusHistory = await prisma.comment.findMany({
      where: {
        project_id: projectId,
        content: {
          contains: '프로젝트 상태가'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })

    return NextResponse.json({
      project,
      statusHistory
    })

  } catch (error) {
    console.error('프로젝트 상태 이력 조회 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 상태 이력을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 