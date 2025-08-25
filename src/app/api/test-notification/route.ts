import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, message, type = 'info' } = await req.json();

    // 소켓 서버에 알림 전송 (실제로는 소켓을 통해 전송)
    // 여기서는 테스트용으로 성공 응답만 반환
    
    return NextResponse.json({
      success: true,
      notification: {
        id: `test_${Date.now()}`,
        title: title || '테스트 알림',
        message: message || '알림 기능이 정상적으로 작동합니다.',
        type,
        userId: session.user.id,
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}