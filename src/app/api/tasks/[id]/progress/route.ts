import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// 진행률 업데이트 스키마
const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100, '진행률은 0-100 사이여야 합니다'),
  actual_hours: z.number().min(0).optional(),
});

// GET: 작업 진행률 계산
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        sub_tasks: {
          select: {
            id: true,
            progress: true,
            estimated_hours: true,
            actual_hours: true,
            due_date: true,
            status: true,
          },
        },
        time_logs: {
          select: {
            hours: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: '작업을 찾을 수 없습니다' }, { status: 404 });
    }

    // 진행률 계산
    const progressResult = calculateTaskProgress(task);

    return NextResponse.json(progressResult);
  } catch (error) {
    console.error('진행률 계산 오류:', error);
    return NextResponse.json(
      { error: '진행률을 계산하는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PATCH: 진행률 수동 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);

    // 작업 존재 확인 및 권한 확인
    const existingTask = await prisma.task.findUnique({
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

    if (!existingTask) {
      return NextResponse.json({ error: '작업을 찾을 수 없습니다' }, { status: 404 });
    }

    // 권한 확인 (담당자, 보고자, PMO, PM, PL만 수정 가능)
    const userRole = session.user.role;
    const isProjectMember = existingTask.project.members.some(member => member.user_id === session.user.id);
    const isAssignee = existingTask.assignee_id === session.user.id;
    const isReporter = existingTask.reporter_id === session.user.id;
    
    if (!['PMO', 'PM', 'PL'].includes(userRole) && !isAssignee && !isReporter && !isProjectMember) {
      return NextResponse.json({ error: '진행률을 수정할 권한이 없습니다' }, { status: 403 });
    }

    // 진행률이 100%일 때 상태를 DONE으로 자동 변경
    let status = existingTask.status;
    if (validatedData.progress === 100 && existingTask.status !== 'DONE') {
      status = 'DONE';
    }

    // 상태가 DONE일 때 진행률을 100%로 자동 설정
    let progress = validatedData.progress;
    if (status === 'DONE' && progress !== 100) {
      progress = 100;
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        progress,
        status,
        actual_hours: validatedData.actual_hours,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sub_tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      );
    }

    console.error('진행률 업데이트 오류:', error);
    return NextResponse.json(
      { error: '진행률을 업데이트하는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 진행률 계산 함수
function calculateTaskProgress(task: any) {
  const now = new Date();
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  
  // 하위 작업이 있는 경우 하위 작업의 평균 진행률로 계산
  if (task.sub_tasks.length > 0) {
    const totalProgress = task.sub_tasks.reduce((sum: number, subTask: any) => {
      return sum + subTask.progress;
    }, 0);
    const averageProgress = Math.round(totalProgress / task.sub_tasks.length);
    
    return {
      task_id: task.id,
      progress: averageProgress,
      is_overdue: dueDate ? now > dueDate && averageProgress < 100 : false,
      estimated_completion: calculateEstimatedCompletion(task, averageProgress),
      actual_vs_estimated: calculateActualVsEstimated(task),
      sub_tasks_progress: task.sub_tasks.map((subTask: any) => ({
        id: subTask.id,
        progress: subTask.progress,
        is_overdue: subTask.due_date ? now > new Date(subTask.due_date) && subTask.progress < 100 : false,
      })),
    };
  }

  // 하위 작업이 없는 경우 시간 기반으로 계산
  const timeBasedProgress = calculateTimeBasedProgress(task);
  
  return {
    task_id: task.id,
    progress: timeBasedProgress,
    is_overdue: dueDate ? now > dueDate && timeBasedProgress < 100 : false,
    estimated_completion: calculateEstimatedCompletion(task, timeBasedProgress),
    actual_vs_estimated: calculateActualVsEstimated(task),
  };
}

// 시간 기반 진행률 계산
function calculateTimeBasedProgress(task: any) {
  if (!task.estimated_hours || task.estimated_hours === 0) {
    return task.progress; // 기존 진행률 유지
  }

  const actualHours = task.actual_hours || 0;
  const estimatedHours = task.estimated_hours;
  
  const timeBasedProgress = Math.round((actualHours / estimatedHours) * 100);
  
  // 100%를 넘지 않도록 제한
  return Math.min(timeBasedProgress, 100);
}

// 예상 완료일 계산
function calculateEstimatedCompletion(task: any, currentProgress: number) {
  if (currentProgress >= 100) {
    return new Date().toISOString();
  }

  if (!task.estimated_hours || !task.start_date) {
    return null;
  }

  const startDate = new Date(task.start_date);
  const now = new Date();
  const elapsedHours = task.actual_hours || 0;
  
  if (elapsedHours === 0 || currentProgress === 0) {
    return null;
  }

  // 시간당 진행률 계산
  const hoursPerProgress = elapsedHours / currentProgress;
  const remainingProgress = 100 - currentProgress;
  const estimatedRemainingHours = hoursPerProgress * remainingProgress;
  
  // 예상 완료일 계산 (8시간/일 기준)
  const estimatedRemainingDays = estimatedRemainingHours / 8;
  const estimatedCompletionDate = new Date(now.getTime() + estimatedRemainingDays * 24 * 60 * 60 * 1000);
  
  return estimatedCompletionDate.toISOString();
}

// 실제 vs 예상 시간 계산
function calculateActualVsEstimated(task: any) {
  if (!task.estimated_hours || task.estimated_hours === 0) {
    return 0;
  }

  const actualHours = task.actual_hours || 0;
  const estimatedHours = task.estimated_hours;
  
  return Math.round(((actualHours - estimatedHours) / estimatedHours) * 100);
} 