import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 시간 로그 리포트 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary'; // summary, user, project, task
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization_members: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 기본 필터 조건
    const baseWhere: any = {};
    
    if (startDate && endDate) {
      baseWhere.log_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    if (projectId) {
      baseWhere.project_id = projectId;
    }
    
    if (userId) {
      baseWhere.user_id = userId;
    }

    // 권한에 따른 필터링
    if (user.role !== 'PMO') {
      const userOrgIds = user.organization_members.map(member => member.organization_id);
      baseWhere.project = {
        organization_id: { in: userOrgIds }
      };
    }

    let reportData: any = {};

    switch (reportType) {
      case 'summary':
        // 전체 요약 리포트
        const summary = await prisma.timeLog.aggregate({
          where: baseWhere,
          _sum: {
            hours: true
          },
          _count: {
            id: true
          }
        });

        // 프로젝트별 요약
        const projectSummary = await prisma.timeLog.groupBy({
          by: ['project_id'],
          where: baseWhere,
          _sum: {
            hours: true
          },
          _count: {
            id: true
          }
        });

        // 사용자별 요약
        const userSummary = await prisma.timeLog.groupBy({
          by: ['user_id'],
          where: baseWhere,
          _sum: {
            hours: true
          },
          _count: {
            id: true
          }
        });

        reportData = {
          totalHours: summary._sum.hours || 0,
          totalLogs: summary._count.id,
          projectSummary,
          userSummary
        };
        break;

      case 'user':
        // 사용자별 상세 리포트
        const userReport = await prisma.timeLog.groupBy({
          by: ['user_id', 'project_id'],
          where: baseWhere,
          _sum: {
            hours: true
          },
          _count: {
            id: true
          }
        });

        // 사용자 정보 포함
        const userDetails = await prisma.user.findMany({
          where: {
            id: { in: [...new Set(userReport.map(item => item.user_id))] }
          },
          select: { id: true, name: true, email: true, role: true }
        });

        reportData = {
          userReport: userReport.map(item => ({
            ...item,
            user: userDetails.find(u => u.id === item.user_id)
          }))
        };
        break;

      case 'project':
        // 프로젝트별 상세 리포트
        const projectReport = await prisma.timeLog.groupBy({
          by: ['project_id', 'user_id'],
          where: baseWhere,
          _sum: {
            hours: true
          },
          _count: {
            id: true
          }
        });

        // 프로젝트 정보 포함
        const projectDetails = await prisma.project.findMany({
          where: {
            id: { in: [...new Set(projectReport.map(item => item.project_id))] }
          },
          select: { id: true, name: true, status: true }
        });

        reportData = {
          projectReport: projectReport.map(item => ({
            ...item,
            project: projectDetails.find(p => p.id === item.project_id)
          }))
        };
        break;

      case 'task':
        // 작업별 상세 리포트
        const taskReport = await prisma.timeLog.groupBy({
          by: ['task_id', 'user_id'],
          where: {
            ...baseWhere,
            task_id: { not: null }
          },
          _sum: {
            hours: true
          },
          _count: {
            id: true
          }
        });

        // 작업 정보 포함
        const taskDetails = await prisma.task.findMany({
          where: {
            id: { in: [...new Set(taskReport.map(item => item.task_id!))] }
          },
          select: { id: true, title: true, status: true, priority: true }
        });

        reportData = {
          taskReport: taskReport.map(item => ({
            ...item,
            task: taskDetails.find(t => t.id === item.task_id)
          }))
        };
        break;

      default:
        return NextResponse.json({ error: '지원하지 않는 리포트 타입입니다.' }, { status: 400 });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('시간 로그 리포트 조회 오류:', error);
    return NextResponse.json({ error: '시간 로그 리포트 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 