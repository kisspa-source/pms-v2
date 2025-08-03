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
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 고객사별 만족도 데이터 조회
    const satisfactionData = await prisma.client.findMany({
      where: {
        ...(clientId && { id: clientId }),
      },
      include: {
        projects: {
          where: {
            ...(startDate && endDate && {
              start_date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
          },
          include: {
            // 실제로는 만족도 테이블이 있어야 함
            // 여기서는 임시 데이터를 생성
          },
        },
      },
    });

    // 임시 만족도 데이터 생성 (실제로는 데이터베이스에서 조회)
    const satisfactionReport = satisfactionData.map((client) => {
      // 임시 만족도 히스토리 생성
      const satisfactionHistory = [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          score: 4.2 + Math.random() * 0.6,
          feedback: '전반적으로 만족스러운 프로젝트였습니다.',
        },
        {
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          score: 4.0 + Math.random() * 0.8,
          feedback: '일정 준수와 품질 모두 우수했습니다.',
        },
        {
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          score: 3.8 + Math.random() * 0.9,
          feedback: '개선이 필요한 부분이 있었지만 전반적으로 만족합니다.',
        },
      ];

      // 프로젝트별 만족도 생성
      const projectSatisfaction = client.projects.map((project) => ({
        projectName: project.name,
        score: 3.5 + Math.random() * 1.5,
        feedback: `${project.name} 프로젝트에 대한 피드백입니다.`,
      }));

      // 평균 만족도 계산
      const allScores = [
        ...satisfactionHistory.map(item => item.score),
        ...projectSatisfaction.map(item => item.score),
      ];
      const averageSatisfaction = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

      // 응답률 계산 (임시)
      const responseRate = 75 + Math.random() * 20; // 75-95%

      return {
        clientId: client.id,
        clientName: client.name,
        projectCount: client.projects.length,
        averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
        satisfactionHistory,
        projectSatisfaction,
        responseRate: Math.round(responseRate * 100) / 100,
        lastSurveyDate: satisfactionHistory[0]?.date || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: satisfactionReport,
    });
  } catch (error) {
    console.error('Satisfaction report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 