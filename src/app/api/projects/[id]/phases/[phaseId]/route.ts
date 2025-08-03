import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasPermission, UserRole } from '@/lib/auth-guards';

// PUT /api/projects/[id]/phases/[phaseId] - 단계 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 프로젝트 관리 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canManageProjects')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const projectId = params.id;
    const phaseId = params.phaseId;
    const body = await request.json();

    // 단계 존재 확인
    const existingPhase = await prisma.projectPhase.findFirst({
      where: {
        id: phaseId,
        project_id: projectId
      }
    });

    if (!existingPhase) {
      return NextResponse.json(
        { error: '단계를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 단계 수정
    const updatedPhase = await prisma.projectPhase.update({
      where: { id: phaseId },
      data: {
        name: body.name || existingPhase.name,
        description: body.description !== undefined ? body.description : existingPhase.description,
        start_date: body.start_date ? new Date(body.start_date) : existingPhase.start_date,
        end_date: body.end_date ? new Date(body.end_date) : existingPhase.end_date,
        status: body.status || existingPhase.status,
        order_index: body.order_index !== undefined ? body.order_index : existingPhase.order_index
      }
    });

    return NextResponse.json(updatedPhase);
  } catch (error) {
    console.error('단계 수정 오류:', error);
    return NextResponse.json(
      { error: '단계 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/phases/[phaseId] - 단계 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; phaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 프로젝트 관리 권한 확인
    if (!hasPermission(session.user.role as UserRole, 'canManageProjects')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const projectId = params.id;
    const phaseId = params.phaseId;

    // 단계 존재 확인
    const existingPhase = await prisma.projectPhase.findFirst({
      where: {
        id: phaseId,
        project_id: projectId
      }
    });

    if (!existingPhase) {
      return NextResponse.json(
        { error: '단계를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 단계에 속한 작업이 있는지 확인
    const taskCount = await prisma.task.count({
      where: {
        phase_id: phaseId
      }
    });

    if (taskCount > 0) {
      return NextResponse.json(
        { error: `이 단계에 ${taskCount}개의 작업이 있어 삭제할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 단계 삭제
    await prisma.projectPhase.delete({
      where: { id: phaseId }
    });

    return NextResponse.json(
      { message: '단계가 성공적으로 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('단계 삭제 오류:', error);
    return NextResponse.json(
      { error: '단계 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}