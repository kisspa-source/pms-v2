import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 프로젝트 작업 의존성 목록 조회
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

    // 의존성 목록 조회
    const dependencies = await prisma.taskDependency.findMany({
      where: {
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
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return NextResponse.json(dependencies);
  } catch (error) {
    console.error('작업 의존성 조회 오류:', error);
    return NextResponse.json(
      { error: '작업 의존성 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 작업 의존성 생성
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
    const { predecessor_id, successor_id, dependency_type, lag_days } = body;

    if (!predecessor_id || !successor_id) {
      return NextResponse.json({ error: '선행 작업과 후행 작업은 필수입니다.' }, { status: 400 });
    }

    if (predecessor_id === successor_id) {
      return NextResponse.json({ error: '같은 작업을 선행/후행으로 설정할 수 없습니다.' }, { status: 400 });
    }

    // 작업들이 같은 프로젝트에 속하는지 확인
    const tasks = await prisma.task.findMany({
      where: {
        id: {
          in: [predecessor_id, successor_id]
        },
        project_id: projectId
      },
      select: {
        id: true
      }
    });

    if (tasks.length !== 2) {
      return NextResponse.json({ error: '선행 작업 또는 후행 작업을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 기존 의존성 확인
    const existingDependency = await prisma.taskDependency.findFirst({
      where: {
        predecessor_id,
        successor_id
      }
    });

    if (existingDependency) {
      return NextResponse.json({ error: '이미 존재하는 의존성입니다.' }, { status: 400 });
    }

    // 순환 의존성 검사
    const hasCircularDependency = await checkCircularDependency(predecessor_id, successor_id, projectId);
    if (hasCircularDependency) {
      return NextResponse.json({ error: '순환 의존성이 감지되었습니다. 다른 의존성을 선택해주세요.' }, { status: 400 });
    }

    // 새 의존성 생성
    const newDependency = await prisma.taskDependency.create({
      data: {
        predecessor_id,
        successor_id,
        dependency_type: dependency_type || 'FINISH_TO_START',
        lag_days: lag_days || 0
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

    return NextResponse.json(newDependency, { status: 201 });
  } catch (error) {
    console.error('작업 의존성 생성 오류:', error);
    return NextResponse.json(
      { error: '작업 의존성 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 순환 의존성 검사 함수
async function checkCircularDependency(predecessorId: string, successorId: string, projectId: string): Promise<boolean> {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = async (taskId: string): Promise<boolean> => {
    if (recursionStack.has(taskId)) return true;
    if (visited.has(taskId)) return false;

    visited.add(taskId);
    recursionStack.add(taskId);

    // 현재 작업의 후행 작업들 조회
    const successors = await prisma.taskDependency.findMany({
      where: {
        predecessor_id: taskId,
        successor: {
          project_id: projectId
        }
      },
      select: {
        successor_id: true
      }
    });

    for (const dep of successors) {
      if (await hasCycle(dep.successor_id)) return true;
    }

    recursionStack.delete(taskId);
    return false;
  };

  // 임시로 의존성 추가 후 순환 검사
  const tempDependency = await prisma.taskDependency.create({
    data: {
      predecessor_id: predecessorId,
      successor_id: successorId,
      dependency_type: 'FINISH_TO_START',
      lag_days: 0
    }
  });

  const hasCircular = await hasCycle(successorId);

  // 임시 의존성 삭제
  await prisma.taskDependency.delete({
    where: {
      id: tempDependency.id
    }
  });

  return hasCircular;
} 