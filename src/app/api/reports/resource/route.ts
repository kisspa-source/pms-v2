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
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 사용자별 리소스 활용률 데이터 조회
    const resourceData = await prisma.user.findMany({
      where: {
        ...(userId && { id: userId }),
      },
      include: {
        project_members: {
          include: {
            project: {
              include: {
                tasks: {
                  include: {
                    time_logs: {
                      where: {
                        ...(startDate && endDate && {
                          log_date: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                          },
                        }),
                      },
                    },
                  },
                },
              },
            },
          },
        },
        time_logs: {
          where: {
            ...(startDate && endDate && {
              log_date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
          },
          include: {
            task: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    // 리소스 활용률 분석
    const resourceReport = resourceData.map((user) => {
      // 총 작업 시간 계산
      const totalLoggedHours = user.time_logs.reduce((sum, log) => sum + Number(log.hours), 0);
      
      // 프로젝트별 작업 시간
      const projectHours = user.time_logs.reduce((acc, log) => {
        const projectId = log.task.project.id;
        if (!acc[projectId]) {
          acc[projectId] = {
            projectName: log.task.project.name,
            hours: 0,
            tasks: 0,
          };
        }
        acc[projectId].hours += Number(log.hours);
        acc[projectId].tasks += 1;
        return acc;
      }, {} as Record<string, { projectName: string; hours: number; tasks: number }>);

      // 스킬셋별 분석 (실제로는 사용자 테이블에 스킬 정보가 있어야 함)
      const skillUtilization = {
        development: user.time_logs.filter(log => 
          log.task.title.toLowerCase().includes('개발') || 
          log.task.title.toLowerCase().includes('코딩')
        ).reduce((sum, log) => sum + Number(log.hours), 0),
        design: user.time_logs.filter(log => 
          log.task.title.toLowerCase().includes('디자인') || 
          log.task.title.toLowerCase().includes('ui')
        ).reduce((sum, log) => sum + Number(log.hours), 0),
        planning: user.time_logs.filter(log => 
          log.task.title.toLowerCase().includes('기획') || 
          log.task.title.toLowerCase().includes('분석')
        ).reduce((sum, log) => sum + Number(log.hours), 0),
      };

      // 오버타임 분석 (주 40시간 기준)
      const weeklyHours = user.time_logs.reduce((acc, log) => {
        const week = new Date(log.log_date).toISOString().slice(0, 10);
        if (!acc[week]) acc[week] = 0;
        acc[week] += Number(log.hours);
        return acc;
      }, {} as Record<string, number>);

      const overtimeWeeks = Object.values(weeklyHours).filter(hours => hours > 40).length;
      const averageWeeklyHours = Object.values(weeklyHours).length > 0 
        ? Object.values(weeklyHours).reduce((sum, hours) => sum + hours, 0) / Object.values(weeklyHours).length 
        : 0;

      // 활용률 계산 (이론적 최대 시간 대비)
      const totalWeeks = Object.keys(weeklyHours).length;
      const theoreticalMaxHours = totalWeeks * 40; // 주 40시간 기준
      const utilizationRate = theoreticalMaxHours > 0 ? (totalLoggedHours / theoreticalMaxHours) * 100 : 0;

      return {
        userId: user.id,
        userName: user.name,
        email: user.email,
        role: user.role,
        totalLoggedHours,
        averageWeeklyHours: Math.round(averageWeeklyHours * 100) / 100,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        overtimeWeeks,
        projectHours,
        skillUtilization,
        totalProjects: user.project_members.length,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: resourceReport,
    });
  } catch (error) {
    console.error('Resource report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 