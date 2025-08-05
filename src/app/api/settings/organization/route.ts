import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth-guards'

// GET /api/settings/organization - 조직 설정 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 조직 관리 권한 확인
    if (!hasPermission(session.user.role, 'canManageOrganizations')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 사용자의 조직 정보 조회
    const userOrganization = await prisma.organizationMember.findFirst({
      where: { user_id: session.user.id },
      include: { organization: true }
    })

    if (!userOrganization) {
      return NextResponse.json({ error: '소속 조직을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 조직 설정 조회 (없으면 기본값 반환)
    const orgSettings = await prisma.organizationSettings.findUnique({
      where: { organization_id: userOrganization.organization_id }
    })

    const settings = {
      default_currency: orgSettings?.default_currency || 'KRW',
      default_timezone: orgSettings?.default_timezone || 'Asia/Seoul',
      working_days: orgSettings?.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      project_code_format: orgSettings?.project_code_format || 'PRJ-{YYYY}-{###}',
      auto_assign_tasks: orgSettings?.auto_assign_tasks || false,
      require_time_tracking: orgSettings?.require_time_tracking || true,
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('조직 설정 조회 오류:', error)
    return NextResponse.json(
      { error: '조직 설정을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/organization - 조직 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 조직 관리 권한 확인
    if (!hasPermission(session.user.role, 'canManageOrganizations')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      default_currency, 
      default_timezone, 
      working_days, 
      project_code_format, 
      auto_assign_tasks, 
      require_time_tracking 
    } = body

    // 사용자의 조직 정보 조회
    const userOrganization = await prisma.organizationMember.findFirst({
      where: { user_id: session.user.id },
      include: { organization: true }
    })

    if (!userOrganization) {
      return NextResponse.json({ error: '소속 조직을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 조직 설정 업데이트 또는 생성
    const updatedSettings = await prisma.organizationSettings.upsert({
      where: { organization_id: userOrganization.organization_id },
      update: {
        default_currency: default_currency || undefined,
        default_timezone: default_timezone || undefined,
        working_days: working_days || undefined,
        project_code_format: project_code_format || undefined,
        auto_assign_tasks: auto_assign_tasks !== undefined ? auto_assign_tasks : undefined,
        require_time_tracking: require_time_tracking !== undefined ? require_time_tracking : undefined,
      },
      create: {
        organization_id: userOrganization.organization_id,
        default_currency: default_currency || 'KRW',
        default_timezone: default_timezone || 'Asia/Seoul',
        working_days: working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        project_code_format: project_code_format || 'PRJ-{YYYY}-{###}',
        auto_assign_tasks: auto_assign_tasks || false,
        require_time_tracking: require_time_tracking !== undefined ? require_time_tracking : true,
      }
    })

    return NextResponse.json({ 
      message: '조직 설정이 성공적으로 업데이트되었습니다.',
      settings: updatedSettings 
    })

  } catch (error) {
    console.error('조직 설정 업데이트 오류:', error)
    return NextResponse.json(
      { error: '조직 설정을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}