import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasPermission } from '@/lib/auth-guards';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // 검색 조건
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    // 총 개수 조회
    const total = await prisma.organization.count({ where });

    // 조직 목록 조회
    const organizations = await prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        description: org.description,
        address: org.address,
        phone: org.phone,
        email: org.email,
        website: org.website,
        createdAt: org.created_at.toISOString(),
        updatedAt: org.updated_at.toISOString(),
        _count: {
          users: org._count.members,
          projects: org._count.projects,
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('조직 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '조직 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - 조직 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 조직 관리 권한 확인
    if (!hasPermission(session.user.role, 'canManageOrganizations')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, address, phone, email, website } = body;

    // 필수 필드 검증
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '조직명은 필수입니다.' },
        { status: 400 }
      );
    }

    // 조직명 중복 확인
    const existingOrganization = await prisma.organization.findFirst({
      where: { name: name.trim() }
    });

    if (existingOrganization) {
      return NextResponse.json(
        { error: '이미 존재하는 조직명입니다.' },
        { status: 400 }
      );
    }

    // 조직 생성
    const newOrganization = await prisma.organization.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
      },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          }
        }
      }
    });

    return NextResponse.json({
      id: newOrganization.id,
      name: newOrganization.name,
      description: newOrganization.description,
      address: newOrganization.address,
      phone: newOrganization.phone,
      email: newOrganization.email,
      website: newOrganization.website,
      createdAt: newOrganization.created_at.toISOString(),
      updatedAt: newOrganization.updated_at.toISOString(),
      _count: {
        users: newOrganization._count.members,
        projects: newOrganization._count.projects,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('조직 생성 오류:', error);
    return NextResponse.json(
      { error: '조직을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}