import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

      // 프로젝트별 진행률 데이터 조회
  const progressData = await prisma.project.findMany({
    where: {
      ...(projectId && { id: projectId }),
      ...(startDate && endDate && {
        start_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    },
    include: {
      tasks: {
        include: {
          time_logs: true,
        },
      },
      members: {
        include: {
          user: true,
        },
      },
    },
  });

    // 진행률 계산
    const progressReport = progressData.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((task) => task.status === 'DONE').length;
      const inProgressTasks = project.tasks.filter((task) => task.status === 'IN_PROGRESS').length;
      const overdueTasks = project.tasks.filter((task) => {
        if (task.due_date && task.status !== 'DONE') {
          return new Date(task.due_date) < new Date();
        }
        return false;
      }).length;

      const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // 시간 로그 분석
      const totalLoggedHours = project.tasks.reduce((sum, task) => {
        return sum + task.time_logs.reduce((taskSum, log) => taskSum + Number(log.hours), 0);
      }, 0);

      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        totalLoggedHours,
        startDate: project.start_date?.toISOString() || '',
        endDate: project.end_date?.toISOString() || '',
        status: project.status,
        teamSize: project.members.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: progressReport,
    });
  } catch (error) {
    console.error('Progress report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 