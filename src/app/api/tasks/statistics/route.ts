import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    const where: any = {};
    if (projectId) {
      where.project_id = projectId;
    }

    // 전체 작업 수
    const total = await prisma.task.count({ where });

    // 상태별 통계
    const statusStats = await prisma.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    // 우선순위별 통계
    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: {
        id: true,
      },
    });

    // 담당자별 통계
    const assigneeStats = await prisma.task.groupBy({
      by: ['assignee_id'],
      where: {
        ...where,
        assignee_id: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // 지연된 작업 수
    const overdue = await prisma.task.count({
      where: {
        ...where,
        due_date: { lt: new Date() },
        status: { not: 'DONE' },
      },
    });

    // 완료된 작업 수
    const completed = await prisma.task.count({
      where: {
        ...where,
        status: 'DONE',
      },
    });

    // 상태별 통계를 객체로 변환
    const by_status = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
      BLOCKED: 0,
    };

    statusStats.forEach((stat) => {
      by_status[stat.status as keyof typeof by_status] = stat._count.id;
    });

    // 우선순위별 통계를 객체로 변환
    const by_priority = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    priorityStats.forEach((stat) => {
      by_priority[stat.priority as keyof typeof by_priority] = stat._count.id;
    });

    // 담당자별 통계를 객체로 변환
    const by_assignee: Record<string, number> = {};
    assigneeStats.forEach((stat) => {
      if (stat.assignee_id) {
        by_assignee[stat.assignee_id] = stat._count.id;
      }
    });

    // 완료율 계산
    const completion_rate = total > 0 ? (completed / total) * 100 : 0;

    const statistics = {
      total,
      by_status,
      by_priority,
      by_assignee,
      overdue,
      completed,
      completion_rate,
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('작업 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}