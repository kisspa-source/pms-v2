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

      // 프로젝트별 재무 데이터 조회
  const financialData = await prisma.project.findMany({
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
          time_logs: {
            include: {
              user: true,
            },
          },
        },
      },
      client: true,
    },
  });

    // 재무 분석 계산
    const financialReport = financialData.map((project) => {
      // 총 인건비 계산 (시간당 비용 기준)
      const totalLaborCost = project.tasks.reduce((sum, task) => {
        return sum + task.time_logs.reduce((taskSum, log) => {
          // 사용자별 시간당 비용 (실제로는 사용자 테이블에 저장되어야 함)
          const hourlyRate = 50000; // 기본 시간당 비용 (원)
          return taskSum + (Number(log.hours) * hourlyRate);
        }, 0);
      }, 0);

      // 예산 대비 실적 계산
      const budget = Number(project.budget_amount) || 0;
      const actualCost = totalLaborCost;
      const costVariance = budget - actualCost;
      const costVariancePercentage = budget > 0 ? (costVariance / budget) * 100 : 0;

      // 수익성 분석
      const revenue = Number(project.contract_amount) || 0;
      const profit = revenue - actualCost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const roi = actualCost > 0 ? (profit / actualCost) * 100 : 0;

      // 월별/분기별 분석을 위한 데이터
      const monthlyData = project.tasks.reduce((acc, task) => {
        task.time_logs.forEach((log) => {
          const month = new Date(log.log_date).toISOString().slice(0, 7); // YYYY-MM
          if (!acc[month]) {
            acc[month] = { hours: 0, cost: 0 };
          }
          const hourlyRate = 50000;
          acc[month].hours += Number(log.hours);
          acc[month].cost += Number(log.hours) * hourlyRate;
        });
        return acc;
      }, {} as Record<string, { hours: number; cost: number }>);

      return {
        projectId: project.id,
        projectName: project.name,
        clientName: project.client?.name || 'N/A',
        budget,
        actualCost,
        costVariance,
        costVariancePercentage: Math.round(costVariancePercentage * 100) / 100,
        revenue,
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        startDate: project.start_date?.toISOString() || '',
        endDate: project.end_date?.toISOString() || '',
        status: project.status,
        monthlyData,
      };
    });

    return NextResponse.json({
      success: true,
      data: financialReport,
    });
  } catch (error) {
    console.error('Financial report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 