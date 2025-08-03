import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

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
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    // 전체 개수 조회
    const total = await prisma.user.count({ where });

    // 사용자 목록 조회
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar_url: true,
        created_at: true,
        updated_at: true,
        organization_members: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    // 응답 데이터 변환
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_members[0]?.organization.id || null,
      organization: user.organization_members[0]?.organization || null,
      createdAt: user.created_at.toISOString(),
      updatedAt: user.updated_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다' },
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
    const { name, email, password, role, organizationId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    // 조직 멤버십 생성 (조직이 선택된 경우)
    if (organizationId) {
      await prisma.organizationMember.create({
        data: {
          organization_id: organizationId,
          user_id: user.id,
          role: role === 'PMO' ? 'ADMIN' : 'MEMBER',
        },
      });
    }

    return NextResponse.json(
      { message: '사용자가 성공적으로 생성되었습니다', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return NextResponse.json(
      { error: '사용자를 생성하는데 실패했습니다' },
      { status: 500 }
    );
  }
}