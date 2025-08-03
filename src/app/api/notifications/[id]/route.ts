import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 알림 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!notification) {
      return NextResponse.json({ error: '알림을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 (자신의 알림만 조회 가능)
    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('알림 조회 오류:', error);
    return NextResponse.json({ error: '알림 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 알림 읽음 처리
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 기존 알림 조회
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!existingNotification) {
      return NextResponse.json({ error: '알림을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 (자신의 알림만 수정 가능)
    if (existingNotification.user_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 알림 읽음 처리
    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        read_at: new Date()
      }
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    return NextResponse.json({ error: '알림 읽음 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 알림 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 기존 알림 조회
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id }
    });

    if (!existingNotification) {
      return NextResponse.json({ error: '알림을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 검증 (자신의 알림만 삭제 가능)
    if (existingNotification.user_id !== user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // 알림 삭제
    await prisma.notification.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: '알림이 삭제되었습니다.' });
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    return NextResponse.json({ error: '알림 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 