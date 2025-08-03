import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasPermission, UserRole } from '@/lib/auth-guards';

// PUT /api/projects/[id]/dependencies/[dependencyId] - 의존성 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; dependencyId: string } }
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
    const dependencyId = params.dependencyId;
    const body = await request.json();

    // 의존성 존재 확인
    const existingDependency = await prisma.taskDependency.findFirst({
      where: {
        id: dependencyId,
        OR: [
          {
            predecessor: {
              project_id: projectId
            }
          },
          {
            successor: {
              project_id: projectId
            }
          }
        ]
      }
    });

    if (!existingDependency) {
      return NextResponse.json(
        { error: '의존성을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 의존성 수정
    const updatedDependency = await prisma.taskDependency.update({
      where: { id: dependencyId },
      data: {
        dependency_type: body.dependency_type || existingDependency.dependency_type,
        lag_days: body.lag_days !== undefined ? body.lag_days : existingDependency.lag_days
      },
      include: {
        predecessor: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        successor: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(updatedDependency);
  } catch (error) {
    console.error('의존성 수정 오류:', error);
    return NextResponse.json(
      { error: '의존성 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/dependencies/[dependencyId] - 의존성 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; dependencyId: string } }
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
    const dependencyId = params.dependencyId;

    // 의존성 존재 확인
    const existingDependency = await prisma.taskDependency.findFirst({
      where: {
        id: dependencyId,
        OR: [
          {
            predecessor: {
              project_id: projectId
            }
          },
          {
            successor: {
              project_id: projectId
            }
          }
        ]
      }
    });

    if (!existingDependency) {
      return NextResponse.json(
        { error: '의존성을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 의존성 삭제
    await prisma.taskDependency.delete({
      where: { id: dependencyId }
    });

    return NextResponse.json(
      { message: '의존성이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('의존성 삭제 오류:', error);
    return NextResponse.json(
      { error: '의존성 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}