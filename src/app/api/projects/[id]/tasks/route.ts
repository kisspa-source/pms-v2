import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, UserRole } from '@/lib/auth-guards'

// GET /api/projects/[id]/tasks - 프로젝트 작업 목록 조회
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
      select: { id: true, name: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 작업 목록 조회
    const tasks = await prisma.task.findMany({
      where: { project_id: projectId },
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
        predecessors: {
          include: {
            predecessor: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        },
        successors: {
          include: {
            successor: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    })

    return NextResponse.json({
      project,
      tasks,
      totalTasks: tasks.length
    })

  } catch (error) {
    console.error('프로젝트 작업 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '작업 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/tasks - 새 작업 생성
export async function POST(
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
    const body = await request.json()
    const { 
      title, 
      description, 
      phase_id, 
      assignee_id, 
      start_date, 
      due_date, 
      estimated_hours, 
      priority = 'MEDIUM' 
    } = body

    // 필수 필드 검증
    if (!title) {
      return NextResponse.json(
        { error: '작업 제목은 필수입니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 존재 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 새 작업 생성
    const newTask = await prisma.task.create({
      data: {
        project_id: projectId,
        title,
        description,
        phase_id,
        assignee_id,
        reporter_id: session.user.id,
        start_date: start_date ? new Date(start_date) : null,
        due_date: due_date ? new Date(due_date) : null,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours.toString()) : null,
        priority,
        status: 'TODO'
      },
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
        }
      }
    })

    return NextResponse.json(newTask, { status: 201 })

  } catch (error) {
    console.error('작업 생성 오류:', error)
    return NextResponse.json(
      { error: '작업을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}