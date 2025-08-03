import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, organizationId } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 이메일 중복 확인 (자신 제외)
    const emailCheck = await prisma.user.findFirst({
      where: {
        email,
        id: { not: params.id },
      },
    });

    if (emailCheck) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다' },
        { status: 400 }
      );
    }

    // 업데이트 데이터 준비
    const updateData: any = {
      name,
      email,
      role,
      updated_at: new Date(),
    };

    // 비밀번호가 제공된 경우에만 업데이트
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // 사용자 정보 업데이트
    await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // 기존 조직 멤버십 삭제
    await prisma.organizationMember.deleteMany({
      where: { user_id: params.id },
    });

    // 새 조직 멤버십 생성 (조직이 선택된 경우)
    if (organizationId) {
      await prisma.organizationMember.create({
        data: {
          organization_id: organizationId,
          user_id: params.id,
          role: role === 'PMO' ? 'ADMIN' : 'MEMBER',
        },
      });
    }

    return NextResponse.json({ message: '사용자 정보가 성공적으로 수정되었습니다' });
  } catch (error) {
    console.error('사용자 수정 오류:', error);
    return NextResponse.json(
      { error: '사용자 정보를 수정하는데 실패했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 자기 자신은 삭제할 수 없음
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다' },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 관련 데이터 삭제 (Cascade로 처리되지만 명시적으로)
    await prisma.organizationMember.deleteMany({
      where: { user_id: params.id },
    });

    // 사용자 삭제
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: '사용자가 성공적으로 삭제되었습니다' });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    return NextResponse.json(
      { error: '사용자를 삭제하는데 실패했습니다' },
      { status: 500 }
    );
  }
}