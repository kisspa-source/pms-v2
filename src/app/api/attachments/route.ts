import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 파일 업로드
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const taskId = formData.get('taskId') as string;

    // 필수 필드 검증
    if (!file || (!projectId && !taskId)) {
      return NextResponse.json({ error: '파일과 프로젝트 ID 또는 작업 ID가 필요합니다.' }, { status: 400 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 });
    }

    // 허용된 파일 타입 검증
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 });
    }

    // 프로젝트 또는 작업 존재 여부 확인
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        return NextResponse.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    // 파일 저장 디렉토리 생성
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadDir, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 데이터베이스에 파일 정보 저장
    const attachment = await prisma.attachment.create({
      data: {
        project_id: projectId || null,
        task_id: taskId || null,
        user_id: user.id,
        filename: originalName,
        file_path: `/uploads/${fileName}`,
        file_size: BigInt(file.size),
        mime_type: file.type
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 첨부파일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');

    // 필수 파라미터 검증
    if (!projectId && !taskId) {
      return NextResponse.json({ error: '프로젝트 ID 또는 작업 ID가 필요합니다.' }, { status: 400 });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization_members: true }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 필터 조건 구성
    const where: any = {};
    
    if (projectId) {
      where.project_id = projectId;
    }
    
    if (taskId) {
      where.task_id = taskId;
    }

    // 권한에 따른 필터링
    if (user.role !== 'PMO') {
      const userOrgIds = user.organization_members.map(member => member.organization_id);
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { organization_id: true }
        });
        
        if (!project || !userOrgIds.includes(project.organization_id)) {
          return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
        }
      } else if (taskId) {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { project: { select: { organization_id: true } } }
        });
        
        if (!task || !userOrgIds.includes(task.project.organization_id)) {
          return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
        }
      }
    }

    const attachments = await prisma.attachment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('첨부파일 조회 오류:', error);
    return NextResponse.json({ error: '첨부파일 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 