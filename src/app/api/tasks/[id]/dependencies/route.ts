import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// 의존성 생성 스키마
const createDependencySchema = z.object({
  successor_id: z.string().min(1, '후행 작업 ID는 필수입니다'),
  dependency_type: z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']).default('FINISH_TO_START'),
  lag_days: z.number().min(0).default(0),
});

// GET: 작업 의존성 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 작업 존재 확인
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        predecessors: {
          include: {
            predecessor: {
              select: {
                id: true,
                title: true,
                status: true,
                due_date: true,
              },
            },
          },
        },
        successors: {
          include: {
            successor: {
              select: {
                id: true,
                title: true,
                status: true,
                due_date: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: '작업을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      predecessors: task.predecessors,
      successors: task.successors,
    });
  } catch (error) {
    console.error('의존성 조회 오류:', error);
    return NextResponse.json(
      { error: '의존성을 조회하는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 의존성 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDependencySchema.parse(body);

    // 선행 작업 존재 확인
    const predecessorTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            members: {
              where: { user_id: session.user.id },
            },
          },
        },
      },
    });

    if (!predecessorTask) {
      return NextResponse.json({ error: '선행 작업을 찾을 수 없습니다' }, { status: 404 });
    }

    // 후행 작업 존재 확인
    const successorTask = await prisma.task.findUnique({
      where: { id: validatedData.successor_id },
      include: {
        project: true,
      },
    });

    if (!successorTask) {
      return NextResponse.json({ error: '후행 작업을 찾을 수 없습니다' }, { status: 404 });
    }

    // 권한 확인 (PMO, PM, PL만 의존성 관리 가능)
    const userRole = session.user.role;
    const isProjectMember = predecessorTask.project.members.some(member => member.user_id === session.user.id);
    
    if (!['PMO', 'PM', 'PL'].includes(userRole) && !isProjectMember) {
      return NextResponse.json({ error: '의존성을 관리할 권한이 없습니다' }, { status: 403 });
    }

    // 같은 프로젝트의 작업인지 확인
    if (predecessorTask.project_id !== successorTask.project_id) {
      return NextResponse.json({ error: '같은 프로젝트의 작업만 의존성을 설정할 수 있습니다' }, { status: 400 });
    }

    // 자기 자신과의 의존성 방지
    if (params.id === validatedData.successor_id) {
      return NextResponse.json({ error: '자기 자신과는 의존성을 설정할 수 없습니다' }, { status: 400 });
    }

    // 순환 의존성 검사
    const hasCircularDependency = await checkCircularDependency(
      validatedData.successor_id,
      params.id
    );

    if (hasCircularDependency) {
      return NextResponse.json({ error: '순환 의존성이 발생합니다' }, { status: 400 });
    }

    // 이미 존재하는 의존성인지 확인
    const existingDependency = await prisma.taskDependency.findUnique({
      where: {
        predecessor_id_successor_id: {
          predecessor_id: params.id,
          successor_id: validatedData.successor_id,
        },
      },
    });

    if (existingDependency) {
      return NextResponse.json({ error: '이미 존재하는 의존성입니다' }, { status: 400 });
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        predecessor_id: params.id,
        successor_id: validatedData.successor_id,
        dependency_type: validatedData.dependency_type,
        lag_days: validatedData.lag_days,
      },
      include: {
        predecessor: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        successor: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      );
    }

    console.error('의존성 추가 오류:', error);
    return NextResponse.json(
      { error: '의존성을 추가하는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 순환 의존성 검사 함수
async function checkCircularDependency(startTaskId: string, targetTaskId: string): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [startTaskId];

  while (queue.length > 0) {
    const currentTaskId = queue.shift()!;
    
    if (currentTaskId === targetTaskId) {
      return true; // 순환 의존성 발견
    }

    if (visited.has(currentTaskId)) {
      continue;
    }

    visited.add(currentTaskId);

    // 현재 작업의 후행 작업들을 큐에 추가
    const successors = await prisma.taskDependency.findMany({
      where: { predecessor_id: currentTaskId },
      select: { successor_id: true },
    });

    for (const successor of successors) {
      queue.push(successor.successor_id);
    }
  }

  return false;
} 