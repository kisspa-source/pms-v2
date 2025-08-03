import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        parent_task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        sub_tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar_url: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        attachments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        time_logs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { log_date: 'desc' },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            time_logs: true,
            sub_tasks: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: '작업을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('작업 조회 오류:', error);
    return NextResponse.json(
      { error: '작업을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

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
    const {
      title,
      description,
      status,
      priority,
      assignee_id,
      start_date,
      due_date,
      estimated_hours,
      progress,
    } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignee_id !== undefined) updateData.assignee_id = assignee_id;
    if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : null;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours ? parseFloat(estimated_hours) : null;
    if (progress !== undefined) updateData.progress = parseInt(progress);

    updateData.updated_at = new Date();

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(task);
  } catch (error) {
    console.error('작업 수정 오류:', error);
    return NextResponse.json(
      { error: '작업을 수정하는데 실패했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: '작업이 삭제되었습니다' });
  } catch (error) {
    console.error('작업 삭제 오류:', error);
    return NextResponse.json(
      { error: '작업을 삭제하는데 실패했습니다' },
      { status: 500 }
    );
  }
}