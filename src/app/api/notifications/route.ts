import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const read = searchParams.get('read'); // true, false, 또는 null (모두)
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 필터 조건 구성
    const where: any = {
      user_id: user.id
    };

    if (read !== null) {
      where.read_at = read === 'true' ? { not: null } : null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    });

    // 읽지 않은 알림 개수 조회
    const unreadCount = await prisma.notification.count({
      where: {
        user_id: user.id,
        read_at: null
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('알림 조회 오류:', error);
    return NextResponse.json({ error: '알림 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 알림 생성 (내부용)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, data } = body;

    // 필수 필드 검증
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 사용자 존재 여부 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: '대상 사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 알림 생성
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        data: data || null
      }
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('알림 생성 오류:', error);
    return NextResponse.json({ error: '알림 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 