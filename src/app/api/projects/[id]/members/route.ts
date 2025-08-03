import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, UserRole } from '@/lib/auth-guards'
import { CreateProjectMemberRequest, UpdateProjectMemberRequest } from '@/types/project'

// GET /api/projects/[id]/members - 프로젝트 멤버 목록 조회
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

    // 프로젝트 멤버 목록 조회
    const members = await prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            avatar_url: true,
            hourly_rate: true,
          }
        }
      },
      orderBy: { joined_at: 'asc' }
    })

    // 멤버별 통계 정보 계산
    const memberStats = await Promise.all(
      members.map(async (member) => {
        const taskCount = await prisma.task.count({
          where: {
            project_id: projectId,
            assignee_id: member.user_id
          }
        })

        const timeLogs = await prisma.timeLog.findMany({
          where: {
            project_id: projectId,
            user_id: member.user_id
          },
          select: { hours: true }
        })

        const totalHours = timeLogs.reduce((sum, log) => sum + Number(log.hours), 0)

        return {
          ...member,
          stats: {
            taskCount,
            totalHours,
            averageHoursPerTask: taskCount > 0 ? totalHours / taskCount : 0
          }
        }
      })
    )

    return NextResponse.json({
      project,
      members: memberStats,
      totalMembers: members.length
    })

  } catch (error) {
    console.error('프로젝트 멤버 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 멤버 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/members - 프로젝트 멤버 추가
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
    const body: CreateProjectMemberRequest = await request.json()
    const { user_id, role, allocation_percentage = 100, hourly_rate } = body

    // 필수 필드 검증
    if (!user_id || !role) {
      return NextResponse.json(
        { error: '사용자 ID와 역할은 필수입니다.' },
        { status: 400 }
      )
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

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 400 }
      )
    }

    // 이미 프로젝트 멤버인지 확인
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: user_id,
        role: role
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 프로젝트 멤버로 등록된 사용자입니다.' },
        { status: 400 }
      )
    }

    // 할당률 검증
    if (allocation_percentage < 0 || allocation_percentage > 100) {
      return NextResponse.json(
        { error: '할당률은 0-100 사이의 값이어야 합니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 멤버 추가
    const newMember = await prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: user_id,
        role: role,
        allocation_percentage,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate.toString()) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            avatar_url: true,
            hourly_rate: true,
          }
        }
      }
    })

    // 멤버 추가 이력 기록
    await prisma.comment.create({
      data: {
        project_id: projectId,
        user_id: session.user.id,
        content: `${user.name}님이 프로젝트 멤버로 추가되었습니다. (역할: ${role}, 할당률: ${allocation_percentage}%)`,
      }
    })

    return NextResponse.json(newMember, { status: 201 })

  } catch (error) {
    console.error('프로젝트 멤버 추가 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 멤버를 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 