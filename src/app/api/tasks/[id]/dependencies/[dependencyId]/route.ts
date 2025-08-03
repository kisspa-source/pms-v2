import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE: 의존성 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; dependencyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 의존성 존재 확인
    const dependency = await prisma.taskDependency.findUnique({
      where: { id: params.dependencyId },
      include: {
        predecessor: {
          include: {
            project: {
              include: {
                members: {
                  where: { user_id: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!dependency) {
      return NextResponse.json({ error: '의존성을 찾을 수 없습니다' }, { status: 404 });
    }

    // 권한 확인 (PMO, PM, PL만 의존성 관리 가능)
    const userRole = session.user.role;
    const isProjectMember = dependency.predecessor.project.members.some(member => member.user_id === session.user.id);
    
    if (!['PMO', 'PM', 'PL'].includes(userRole) && !isProjectMember) {
      return NextResponse.json({ error: '의존성을 관리할 권한이 없습니다' }, { status: 403 });
    }

    await prisma.taskDependency.delete({
      where: { id: params.dependencyId },
    });

    return NextResponse.json({ message: '의존성이 삭제되었습니다' });
  } catch (error) {
    console.error('의존성 삭제 오류:', error);
    return NextResponse.json(
      { error: '의존성을 삭제하는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 