import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// xlsx를 동적으로 import
const XLSX = require('xlsx');

// 엑셀 양식 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const projectId = params.id;

    // 프로젝트 존재 확인 및 권한 검증
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          {
            members: {
              some: {
                user_id: session.user.id
              }
            }
          },
          {
            organization: {
              members: {
                some: {
                  user_id: session.user.id
                }
              }
            }
          }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 샘플 데이터 생성
    const sampleData = [
      {
        'Name': 'Planning Phase',
        'Description': 'Project planning and requirements analysis',
        'Start Date': '2024-01-01',
        'End Date': '2024-01-15',
        'Status': 'PENDING'
      },
      {
        'Name': 'Design Phase',
        'Description': 'System design and architecture definition',
        'Start Date': '2024-01-16',
        'End Date': '2024-02-15',
        'Status': 'PENDING'
      },
      {
        'Name': 'Development Phase',
        'Description': 'Actual development work',
        'Start Date': '2024-02-16',
        'End Date': '2024-04-30',
        'Status': 'PENDING'
      },
      {
        'Name': 'Testing Phase',
        'Description': 'Quality assurance and testing',
        'Start Date': '2024-05-01',
        'End Date': '2024-05-15',
        'Status': 'PENDING'
      },
      {
        'Name': 'Deployment Phase',
        'Description': 'Production deployment and launch',
        'Start Date': '2024-05-16',
        'End Date': '2024-05-31',
        'Status': 'PENDING'
      }
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    
    // 데이터 시트 생성
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // 시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Phases');

    // 가이드 시트 생성
    const guideData = [
      { 'Field': 'Name', 'Description': 'Phase name (Required)', 'Example': 'Planning Phase' },
      { 'Field': 'Description', 'Description': 'Phase description (Optional)', 'Example': 'Project planning and requirements analysis' },
      { 'Field': 'Start Date', 'Description': 'Phase start date (YYYY-MM-DD)', 'Example': '2024-01-01' },
      { 'Field': 'End Date', 'Description': 'Phase end date (YYYY-MM-DD)', 'Example': '2024-01-15' },
      { 'Field': 'Status', 'Description': 'PENDING, IN_PROGRESS, COMPLETED, DELAYED', 'Example': 'PENDING' }
    ];

    const guideWorksheet = XLSX.utils.json_to_sheet(guideData);
    XLSX.utils.book_append_sheet(workbook, guideWorksheet, 'Guide');

    // 엑셀 파일을 버퍼로 변환
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="project_phases_template.xlsx"');
    headers.set('Cache-Control', 'no-cache');

    return new NextResponse(excelBuffer, { headers });

  } catch (error) {
    console.error('엑셀 양식 다운로드 오류:', error);
    console.error('오류 스택:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { 
        error: '엑셀 양식 다운로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 엑셀 파일 업로드 및 단계 등록
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const projectId = params.id;

    // 프로젝트 존재 확인 및 권한 검증
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          {
            members: {
              some: {
                user_id: session.user.id,
                role: {
                  in: ['PMO', 'PM', 'PL']
                }
              }
            }
          },
          {
            organization: {
              members: {
                some: {
                  user_id: session.user.id,
                  user: {
                    role: {
                      in: ['PMO', 'PM']
                    }
                  }
                }
              }
            }
          }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없거나 권한이 없습니다.' }, { status: 404 });
    }

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 업로드되지 않았습니다.' }, { status: 400 });
    }

    // 파일 확장자 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: '엑셀 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일을 버퍼로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 엑셀 파일 읽기
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // JSON으로 변환
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: '엑셀 파일에 데이터가 없습니다.' }, { status: 400 });
    }

    // 현재 최대 순서 인덱스 조회
    const maxOrderIndex = await prisma.projectPhase.aggregate({
      where: {
        project_id: projectId
      },
      _max: {
        order_index: true
      }
    });

    let currentOrderIndex = (maxOrderIndex._max.order_index ?? -1) + 1;
    const createdPhases = [];
    const errors = [];

    // 각 행을 처리
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      const rowNumber = i + 2; // 엑셀 행 번호 (헤더 제외)

      try {
        // 필수 필드 검증 (영어 또는 한글 컬럼명 모두 지원)
        const name = row['Name'] || row['단계명'];
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          errors.push(`${rowNumber}행: 단계명은 필수입니다.`);
          continue;
        }

        // 상태 값 검증
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];
        const status = row['Status'] || row['상태'] || 'PENDING';
        if (!validStatuses.includes(status)) {
          errors.push(`${rowNumber}행: 상태는 ${validStatuses.join(', ')} 중 하나여야 합니다.`);
          continue;
        }

        // 날짜 변환
        let startDate = null;
        let endDate = null;

        const startDateValue = row['Start Date'] || row['시작일'];
        if (startDateValue) {
          try {
            startDate = new Date(startDateValue);
            if (isNaN(startDate.getTime())) {
              errors.push(`${rowNumber}행: 시작일 형식이 올바르지 않습니다. (YYYY-MM-DD 형식 사용)`);
              continue;
            }
          } catch (error) {
            errors.push(`${rowNumber}행: 시작일 형식이 올바르지 않습니다.`);
            continue;
          }
        }

        const endDateValue = row['End Date'] || row['종료일'];
        if (endDateValue) {
          try {
            endDate = new Date(endDateValue);
            if (isNaN(endDate.getTime())) {
              errors.push(`${rowNumber}행: 종료일 형식이 올바르지 않습니다. (YYYY-MM-DD 형식 사용)`);
              continue;
            }
          } catch (error) {
            errors.push(`${rowNumber}행: 종료일 형식이 올바르지 않습니다.`);
            continue;
          }
        }

        // 시작일과 종료일 검증
        if (startDate && endDate && startDate > endDate) {
          errors.push(`${rowNumber}행: 시작일이 종료일보다 늦을 수 없습니다.`);
          continue;
        }

        // 단계 생성
        const description = row['Description'] || row['설명'];
        const newPhase = await prisma.projectPhase.create({
          data: {
            project_id: projectId,
            name: name.trim(),
            description: description?.trim() || null,
            start_date: startDate,
            end_date: endDate,
            status: status,
            order_index: currentOrderIndex++
          }
        });

        createdPhases.push(newPhase);

      } catch (error) {
        console.error(`${rowNumber}행 처리 오류:`, error);
        errors.push(`${rowNumber}행: 데이터 처리 중 오류가 발생했습니다.`);
      }
    }

    // 결과 반환
    const result = {
      success: createdPhases.length,
      errors: errors.length,
      createdPhases,
      errorMessages: errors
    };

    if (errors.length > 0 && createdPhases.length === 0) {
      return NextResponse.json(
        { error: '모든 데이터 처리에 실패했습니다.', details: result },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('엑셀 업로드 오류:', error);
    return NextResponse.json(
      { error: '엑셀 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}