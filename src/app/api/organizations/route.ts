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

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
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
    });

    return NextResponse.json({
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        description: org.description,
        createdAt: org.created_at.toISOString(),
        memberCount: org._count.members,
        projectCount: org._count.projects,
      })),
    });
  } catch (error) {
    console.error('조직 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '조직 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}