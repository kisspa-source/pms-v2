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
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assignee_id');
    const priority = searchParams.get('priority');

    const where: any = {};

    if (projectId) {
      where.project_id = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (assigneeId) {
      where.assignee_id = assigneeId;
    }

    if (priority) {
      where.priority = priority;
    }

    const tasks = await prisma.task.findMany({
      where,
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
        parent_task: {
          select: {
            id: true,
            title: true,
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
        _count: {
          select: {
            comments: true,
            attachments: true,
            time_logs: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('작업 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '작업 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id,
      phase_id,
      parent_task_id,
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      assignee_id,
      start_date,
      due_date,
      estimated_hours,
    } = body;

    if (!project_id || !title) {
      return NextResponse.json(
        { error: '프로젝트 ID와 제목은 필수입니다' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        project_id,
        phase_id,
        parent_task_id,
        title,
        description,
        status,
        priority,
        assignee_id,
        reporter_id: session.user.id,
        start_date: start_date ? new Date(start_date) : null,
        due_date: due_date ? new Date(due_date) : null,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
      },
      include: {
        project: {
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
        _count: {
          select: {
            comments: true,
            attachments: true,
            time_logs: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('작업 생성 오류:', error);
    return NextResponse.json(
      { error: '작업을 생성하는데 실패했습니다' },
      { status: 500 }
    );
  }
}