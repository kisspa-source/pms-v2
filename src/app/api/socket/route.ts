import { NextRequest, NextResponse } from 'next/server';
import { initSocket, SocketWithIO } from '@/lib/socket';

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const io = initSocket(res as SocketWithIO);
    
    return NextResponse.json({
      success: true,
      message: 'Socket.io server initialized',
    });
  } catch (error) {
    console.error('Socket initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize socket' },
      { status: 500 }
    );
  }
} 