import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const priority = searchParams.get('priority');
    const projectType = searchParams.get('projectType');
    const search = searchParams.get('search');
    const simple = searchParams.get('simple');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.client_id = clientId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (projectType) {
      where.project_type = projectType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 페이지네이션 정보 계산
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 전체 개수 조회
    const total = await prisma.project.count({ where });
    const totalPages = Math.ceil(total / limit);
    
    // 페이지네이션 적용하여 프로젝트 조회
    const skip = (page - 1) * limit;
    
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        project_type: true,
        start_date: true,
        end_date: true,
        progress: true,
        budget_amount: true,
        currency: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
      skip,
      take: limit,
    });

    // 단순 목록 요청인 경우 (작업 생성 모달 등에서 사용)
    if (simple === 'true') {
      const simpleProjects = await prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      return NextResponse.json(simpleProjects);
    }

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '프로젝트 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organization_id,
      client_id,
      name,
      description,
      project_type,
      priority = 'MEDIUM',
      start_date,
      end_date,
      estimated_hours,
      budget_amount,
      contract_amount,
      currency = 'KRW'
    } = body;

    // 필수 필드 검증
    if (!organization_id || !client_id || !name) {
      return NextResponse.json(
        { error: '조직, 고객사, 프로젝트명은 필수입니다' },
        { status: 400 }
      );
    }

    // 조직 존재 확인
    const organization = await prisma.organization.findUnique({
      where: { id: organization_id }
    });

    if (!organization) {
      return NextResponse.json(
        { error: '존재하지 않는 조직입니다' },
        { status: 404 }
      );
    }

    // 고객사 존재 확인
    const client = await prisma.client.findUnique({
      where: { id: client_id }
    });

    if (!client) {
      return NextResponse.json(
        { error: '존재하지 않는 고객사입니다' },
        { status: 404 }
      );
    }

    // 프로젝트 생성
    const project = await prisma.project.create({
      data: {
        organization_id,
        client_id,
        name,
        description,
        project_type,
        priority,
        status: 'PLANNING',
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        estimated_hours: estimated_hours ? parseInt(estimated_hours) : null,
        budget_amount: budget_amount ? parseFloat(budget_amount) : null,
        contract_amount: contract_amount ? parseFloat(contract_amount) : null,
        currency,
        progress: 0,
        actual_hours: 0,
        actual_cost: 0
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
            phases: true,
          }
        }
      }
    });

    // 프로젝트 생성자를 PM으로 자동 배정
    await prisma.projectMember.create({
      data: {
        project_id: project.id,
        user_id: session.user.id,
        role: 'PM',
        allocation_percentage: 100
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('프로젝트 생성 오류:', error);
    return NextResponse.json(
      { error: '프로젝트를 생성하는데 실패했습니다' },
      { status: 500 }
    );
  }
}