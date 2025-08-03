import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, UserRole } from '@/lib/auth-guards'
import { UpdateProjectMemberRequest } from '@/types/project'

// PUT /api/projects/[id]/members/[memberId] - 프로젝트 멤버 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const memberId = params.memberId
    const body: UpdateProjectMemberRequest = await request.json()
    const { role, allocation_percentage, hourly_rate, left_at } = body

    // 프로젝트 멤버 존재 확인
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        project_id: projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: '프로젝트 멤버를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}

    if (role !== undefined) updateData.role = role
    if (allocation_percentage !== undefined) {
      if (allocation_percentage < 0 || allocation_percentage > 100) {
        return NextResponse.json(
          { error: '할당률은 0-100 사이의 값이어야 합니다.' },
          { status: 400 }
        )
      }
      updateData.allocation_percentage = allocation_percentage
    }
    if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate ? parseFloat(hourly_rate.toString()) : null
    if (left_at !== undefined) updateData.left_at = left_at ? new Date(left_at) : null

    // 프로젝트 멤버 정보 업데이트
    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: updateData,
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

    // 변경 이력 기록
    const changes = []
    if (role !== undefined && role !== existingMember.role) {
      changes.push(`역할: ${existingMember.role} → ${role}`)
    }
    if (allocation_percentage !== undefined && allocation_percentage !== existingMember.allocation_percentage) {
      changes.push(`할당률: ${existingMember.allocation_percentage}% → ${allocation_percentage}%`)
    }
    if (left_at !== undefined) {
      changes.push(`프로젝트 탈퇴: ${left_at}`)
    }

    if (changes.length > 0) {
      await prisma.comment.create({
        data: {
          project_id: projectId,
          user_id: session.user.id,
          content: `${existingMember.user.name}님의 정보가 변경되었습니다. (${changes.join(', ')})`,
        }
      })
    }

    return NextResponse.json(updatedMember)

  } catch (error) {
    console.error('프로젝트 멤버 수정 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 멤버를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/members/[memberId] - 프로젝트 멤버 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const memberId = params.memberId

    // 프로젝트 멤버 존재 확인
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        project_id: projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: '프로젝트 멤버를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 자신을 제거하려는 경우 방지
    if (existingMember.user_id === session.user.id) {
      return NextResponse.json(
        { error: '자신을 프로젝트에서 제거할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 할당된 작업이 있는지 확인
    const assignedTasks = await prisma.task.count({
      where: {
        project_id: projectId,
        assignee_id: existingMember.user_id,
        status: {
          in: ['TODO', 'IN_PROGRESS', 'REVIEW']
        }
      }
    })

    if (assignedTasks > 0) {
      return NextResponse.json(
        { error: `진행 중인 작업이 ${assignedTasks}개 있어 제거할 수 없습니다.` },
        { status: 400 }
      )
    }

    // 프로젝트 멤버 제거
    await prisma.projectMember.delete({
      where: { id: memberId }
    })

    // 제거 이력 기록
    await prisma.comment.create({
      data: {
        project_id: projectId,
        user_id: session.user.id,
        content: `${existingMember.user.name}님이 프로젝트에서 제거되었습니다.`,
      }
    })

    return NextResponse.json(
      { message: '프로젝트 멤버가 성공적으로 제거되었습니다.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('프로젝트 멤버 제거 오류:', error)
    return NextResponse.json(
      { error: '프로젝트 멤버를 제거하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}