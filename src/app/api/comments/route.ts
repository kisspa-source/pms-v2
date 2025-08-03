import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 댓글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    const parentCommentId = searchParams.get('parentCommentId');

    // 필수 파라미터 검증
    if (!projectId && !taskId) {
      return NextResponse.json({ error: '프로젝트 ID 또는 작업 ID가 필요합니다.' }, { status: 400 });
    }

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
    
    if (parentCommentId) {
      where.parent_comment_id = parentCommentId;
    } else {
      where.parent_comment_id = null; // 최상위 댓글만 조회
    }

    // 권한에 따른 필터링
    if (user.role !== 'PMO') {
      const userOrgIds = user.organization_members.map(member => member.organization_id);
      if (projectId) {
        // 프로젝트가 지정된 경우 해당 프로젝트의 조직 확인
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { organization_id: true }
        });
        
        if (!project || !userOrgIds.includes(project.organization_id)) {
          return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
        }
      } else if (taskId) {
        // 작업이 지정된 경우 해당 작업의 프로젝트 조직 확인
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { project: { select: { organization_id: true } } }
        });
        
        if (!task || !userOrgIds.includes(task.project.organization_id)) {
          return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
        }
      }
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true }
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar_url: true }
            }
          },
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    return NextResponse.json({ error: '댓글 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 댓글 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, taskId, content, parentCommentId } = body;

    // 필수 필드 검증
    if (!content || (!projectId && !taskId)) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 프로젝트 또는 작업 존재 여부 확인
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    // 부모 댓글 존재 여부 확인 (답글이 아닌 경우)
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId }
      });

      if (!parentComment) {
        return NextResponse.json({ error: '부모 댓글을 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    // 댓글 생성
    const comment = await prisma.comment.create({
      data: {
        project_id: projectId || null,
        task_id: taskId || null,
        user_id: user.id,
        content: content,
        parent_comment_id: parentCommentId || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true }
        }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('댓글 생성 오류:', error);
    return NextResponse.json({ error: '댓글 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 