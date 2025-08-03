import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 댓글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
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
      }
    });

    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    return NextResponse.json({ error: '댓글 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    // 필수 필드 검증
    if (!content) {
      return NextResponse.json({ error: '댓글 내용이 필요합니다.' }, { status: 400 });
    }

    // 기존 댓글 조회
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.id }
    });

    if (!existingComment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 (자신의 댓글만 수정 가능, PMO는 모든 댓글 수정 가능)
    if (user.role !== 'PMO' && existingComment.user_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 댓글 수정
    const updatedComment = await prisma.comment.update({
      where: { id: params.id },
      data: {
        content: content
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar_url: true }
        }
      }
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    return NextResponse.json({ error: '댓글 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 기존 댓글 조회
    const existingComment = await prisma.comment.findUnique({
      where: { id: params.id },
      include: {
        replies: true
      }
    });

    if (!existingComment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 (자신의 댓글만 삭제 가능, PMO는 모든 댓글 삭제 가능)
    if (user.role !== 'PMO' && existingComment.user_id !== user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // 댓글과 답글들 모두 삭제 (Cascade)
    await prisma.comment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return NextResponse.json({ error: '댓글 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 