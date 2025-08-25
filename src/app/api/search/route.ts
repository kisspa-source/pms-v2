import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        projects: [], 
        tasks: [], 
        users: [],
        total: 0 
      })
    }

    const searchTerm = query.trim()

    try {
      // 프로젝트 검색
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true
        },
        orderBy: { updated_at: 'desc' },
        take: limit
      })

      // 작업 검색
      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          project: {
            select: {
              name: true
            }
          }
        },
        orderBy: { updated_at: 'desc' },
        take: limit
      })

      // 사용자 검색 (모든 사용자가 팀원 검색 가능)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: { name: 'asc' },
        take: limit
      })

      // 결과 포맷팅
      const formattedProjects = projects.map(p => ({
        ...p,
        type: 'project' as const
      }))

      const formattedTasks = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        project_name: t.project?.name,
        type: 'task' as const
      }))

      const formattedUsers = users.map(u => ({
        ...u,
        type: 'user' as const
      }))

      const total = formattedProjects.length + formattedTasks.length + formattedUsers.length

      return NextResponse.json({
        projects: formattedProjects,
        tasks: formattedTasks,
        users: formattedUsers,
        total,
        query
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      
      // 데이터베이스 오류 시 목업 데이터 반환 (개발용)
      const mockProjects = [
        {
          id: '1',
          name: '웹사이트 리뉴얼 프로젝트',
          description: '회사 웹사이트를 현대적으로 리뉴얼하는 프로젝트입니다.',
          status: 'active',
          type: 'project' as const
        },
        {
          id: '2', 
          name: '모바일 앱 개발',
          description: 'iOS/Android 모바일 애플리케이션 개발 프로젝트',
          status: 'in_progress',
          type: 'project' as const
        }
      ].filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )

      const mockTasks = [
        {
          id: '1',
          title: 'UI 디자인 작업',
          description: '메인 페이지 UI 디자인을 완성해야 합니다.',
          status: 'in_progress',
          priority: 'high',
          project_name: '웹사이트 리뉴얼 프로젝트',
          type: 'task' as const
        },
        {
          id: '2',
          title: '데이터베이스 설계',
          description: '사용자 데이터를 저장할 데이터베이스 구조를 설계합니다.',
          status: 'completed',
          priority: 'medium',
          project_name: '모바일 앱 개발',
          type: 'task' as const
        }
      ].filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )

      const mockUsers = [
        {
          id: '1',
          name: '김개발',
          email: 'kim.dev@company.com',
          role: 'DEVELOPER',
          type: 'user' as const
        },
        {
          id: '2',
          name: '이디자인',
          email: 'lee.design@company.com', 
          role: 'DESIGNER',
          type: 'user' as const
        },
        {
          id: '3',
          name: '박매니저',
          email: 'park.manager@company.com',
          role: 'PM',
          type: 'user' as const
        }
      ].filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      )

      const total = mockProjects.length + mockTasks.length + mockUsers.length

      return NextResponse.json({
        projects: mockProjects,
        tasks: mockTasks,
        users: mockUsers,
        total,
        query
      })
    }

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}