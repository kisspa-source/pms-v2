import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 시간 로그 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization_members: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 필터 조건 구성
    const where: any = {};
    
    if (projectId) {
      where.project_id = projectId;
    }
    
    if (taskId) {
      where.task_id = taskId;
    }
    
    if (userId) {
      where.user_id = userId;
    }
    
    if (startDate && endDate) {
      where.log_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // 권한에 따른 필터링
    if (user.role !== 'PMO') {
      // PMO가 아닌 경우 자신의 조직 내 프로젝트만 조회
      const userOrgIds = user.organization_members.map(member => member.organization_id);
      where.project = {
        organization_id: { in: userOrgIds }
      };
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
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
      },
      orderBy: { log_date: 'desc' }
    });

    return NextResponse.json(timeLogs);
  } catch (error) {
    console.error('시간 로그 조회 오류:', error);
    return NextResponse.json({ error: '시간 로그 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 시간 로그 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, taskId, description, hours, logDate, hourlyRate } = body;

    // 필수 필드 검증
    if (!projectId || !hours || !logDate) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 프로젝트 존재 여부 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 작업 존재 여부 확인 (작업이 지정된 경우)
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    // 시간 로그 생성
    const timeLog = await prisma.timeLog.create({
      data: {
        project_id: projectId,
        task_id: taskId || null,
        user_id: user.id,
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

    // 프로젝트의 실제 시간 업데이트
    await prisma.project.update({
      where: { id: projectId },
      data: {
        actual_hours: {
          increment: hours
        }
      }
    });

    // 작업의 실제 시간 업데이트 (작업이 지정된 경우)
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          actual_hours: {
            increment: hours
          }
        }
      });
    }

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    console.error('시간 로그 생성 오류:', error);
    return NextResponse.json({ error: '시간 로그 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 