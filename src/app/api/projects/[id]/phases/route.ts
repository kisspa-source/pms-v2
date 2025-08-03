import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 프로젝트 단계 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const projectId = params.id;

    // 프로젝트 존재 확인 및 권한 검증
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          members: {
            some: {
              user_id: session.user.id
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 단계 목록 조회 (작업 수 포함)
    const phases = await prisma.projectPhase.findMany({
      where: {
        project_id: projectId
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        },
        tasks: {
          where: {
            status: 'DONE'
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        order_index: 'asc'
      }
    });

    // 응답 데이터 변환
    const phasesWithTaskCounts = phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      description: phase.description,
      start_date: phase.start_date,
      end_date: phase.end_date,
      status: phase.status,
      order_index: phase.order_index,
      task_count: phase._count.tasks,
      completed_task_count: phase.tasks.length
    }));

    return NextResponse.json(phasesWithTaskCounts);
  } catch (error) {
    console.error('프로젝트 단계 조회 오류:', error);
    return NextResponse.json(
      { error: '프로젝트 단계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 프로젝트 단계 생성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();

    // 프로젝트 존재 확인 및 권한 검증
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organization: {
          members: {
            some: {
              user_id: session.user.id,
              role: {
                in: ['PMO', 'PM', 'PL']
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없거나 권한이 없습니다.' }, { status: 404 });
    }

    // 입력 데이터 검증
    const { name, description, start_date, end_date, status } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '단계명은 필수입니다.' }, { status: 400 });
    }

    // 현재 최대 순서 인덱스 조회
    const maxOrderIndex = await prisma.projectPhase.aggregate({
      where: {
        project_id: projectId
      },
      _max: {
        order_index: true
      }
    });

    const newOrderIndex = (maxOrderIndex._max.order_index ?? -1) + 1;

    // 새 단계 생성
    const newPhase = await prisma.projectPhase.create({
      data: {
        project_id: projectId,
        name: name.trim(),
        description: description?.trim() || null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status: status || 'PENDING',
        order_index: newOrderIndex
      }
    });

    return NextResponse.json(newPhase, { status: 201 });
  } catch (error) {
    console.error('프로젝트 단계 생성 오류:', error);
    return NextResponse.json(
      { error: '프로젝트 단계 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 