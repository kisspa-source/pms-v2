import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 시간 로그 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const timeLog = await prisma.timeLog.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { id: true, name: true }
        },
        task: {
          select: { id: true, title: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!timeLog) {
      return NextResponse.json({ error: '시간 로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(timeLog);
  } catch (error) {
    console.error('시간 로그 조회 오류:', error);
    return NextResponse.json({ error: '시간 로그 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 시간 로그 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { description, hours, logDate, hourlyRate } = body;

    // 기존 시간 로그 조회
    const existingTimeLog = await prisma.timeLog.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        task: true
      }
    });

    if (!existingTimeLog) {
      return NextResponse.json({ error: '시간 로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 (자신의 시간 로그만 수정 가능, PMO는 모든 시간 로그 수정 가능)
    if (user.role !== 'PMO' && existingTimeLog.user_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 기존 시간을 프로젝트와 작업에서 차감
    await prisma.project.update({
      where: { id: existingTimeLog.project_id },
      data: {
        actual_hours: {
          decrement: existingTimeLog.hours
        }
      }
    });

    if (existingTimeLog.task_id) {
      await prisma.task.update({
        where: { id: existingTimeLog.task_id },
        data: {
          actual_hours: {
            decrement: existingTimeLog.hours
          }
        }
      });
    }

    // 시간 로그 수정
    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: params.id },
      data: {
        description: description || null,
        hours: hours,
        log_date: new Date(logDate),
        hourly_rate: hourlyRate || null
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        task: {
          select: { id: true, title: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // 새로운 시간을 프로젝트와 작업에 추가
    await prisma.project.update({
      where: { id: existingTimeLog.project_id },
      data: {
        actual_hours: {
          increment: hours
        }
      }
    });

    if (existingTimeLog.task_id) {
      await prisma.task.update({
        where: { id: existingTimeLog.task_id },
        data: {
          actual_hours: {
            increment: hours
          }
        }
      });
    }

    return NextResponse.json(updatedTimeLog);
  } catch (error) {
    console.error('시간 로그 수정 오류:', error);
    return NextResponse.json({ error: '시간 로그 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 시간 로그 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 기존 시간 로그 조회
    const existingTimeLog = await prisma.timeLog.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        task: true
      }
    });

    if (!existingTimeLog) {
      return NextResponse.json({ error: '시간 로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 (자신의 시간 로그만 삭제 가능, PMO는 모든 시간 로그 삭제 가능)
    if (user.role !== 'PMO' && existingTimeLog.user_id !== user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // 시간 로그 삭제
    await prisma.timeLog.delete({
      where: { id: params.id }
    });

    // 프로젝트와 작업에서 시간 차감
    await prisma.project.update({
      where: { id: existingTimeLog.project_id },
      data: {
        actual_hours: {
          decrement: existingTimeLog.hours
        }
      }
    });

    if (existingTimeLog.task_id) {
      await prisma.task.update({
        where: { id: existingTimeLog.task_id },
        data: {
          actual_hours: {
            decrement: existingTimeLog.hours
          }
        }
      });
    }

    return NextResponse.json({ message: '시간 로그가 삭제되었습니다.' });
  } catch (error) {
    console.error('시간 로그 삭제 오류:', error);
    return NextResponse.json({ error: '시간 로그 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 