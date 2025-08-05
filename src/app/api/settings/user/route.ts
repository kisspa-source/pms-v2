import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/settings/user - 사용자 설정 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        avatar_url: true,
        timezone: true,
        language: true,
        theme: true,
        notifications: true,
        work_preferences: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 기본값 설정
    const settings = {
      ...user,
      timezone: user.timezone || 'Asia/Seoul',
      language: user.language || 'ko',
      theme: user.theme || 'system',
      notifications: user.notifications || {
        email_notifications: true,
        push_notifications: true,
        project_updates: true,
        task_assignments: true,
        comments: true,
        deadlines: true,
        weekly_reports: false
      },
      work_preferences: user.work_preferences || {
        default_work_hours: 8,
        start_time: '09:00',
        end_time: '18:00',
        break_duration: 60
      }
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('사용자 설정 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 설정을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/user - 사용자 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      department, 
      avatar_url, 
      timezone, 
      language, 
      theme, 
      notifications, 
      work_preferences 
    } = body

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        department: department || undefined,
        avatar_url: avatar_url || undefined,
        timezone: timezone || undefined,
        language: language || undefined,
        theme: theme || undefined,
        notifications: notifications || undefined,
        work_preferences: work_preferences || undefined,
      }
    })

    return NextResponse.json({ 
      message: '설정이 성공적으로 업데이트되었습니다.',
      user: updatedUser 
    })

  } catch (error) {
    console.error('사용자 설정 업데이트 오류:', error)
    return NextResponse.json(
      { error: '사용자 설정을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}