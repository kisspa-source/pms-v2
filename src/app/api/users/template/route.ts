import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import { UserRole } from '@/lib/auth-guards'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 권한 확인 (PMO만 템플릿 다운로드 가능)
    if (session.user.role !== UserRole.PMO) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 조직 목록 가져오기
    const organizations = await prisma.organization.findMany({
      select: { name: true }
    })

    // 엑셀 워크북 생성
    const workbook = XLSX.utils.book_new()
    
    // 사용자 데이터 시트 - 각 역할별로 1명씩 샘플 추가
    const userData = [
      ['이름', '이메일', '비밀번호', '역할', '조직명'],
      ['김PMO', 'pmo@example.com', 'password123', 'PMO', organizations[0]?.name || ''],
      ['이PM', 'pm@example.com', 'password456', 'PM', organizations[0]?.name || ''],
      ['박PL', 'pl@example.com', 'password789', 'PL', organizations[0]?.name || ''],
      ['최개발', 'dev@example.com', 'password101', 'DEVELOPER', organizations[0]?.name || ''],
      ['정디자인', 'design@example.com', 'password202', 'DESIGNER', organizations[0]?.name || ''],
      ['한컨설턴트', 'consultant@example.com', 'password303', 'CONSULTANT', organizations[0]?.name || '']
    ]
    
    const userSheet = XLSX.utils.aoa_to_sheet(userData)
    
    // 컬럼 너비 설정
    userSheet['!cols'] = [
      { width: 15 }, // 이름
      { width: 25 }, // 이메일
      { width: 15 }, // 비밀번호
      { width: 20 }, // 역할
      { width: 20 }  // 조직명
    ]
    
    XLSX.utils.book_append_sheet(workbook, userSheet, '사용자')
    
    // 참조 데이터 시트 (역할 목록)
    const roleData = [
      ['사용 가능한 역할'],
      ...Object.values(Role).map(role => [role])
    ]
    
    const roleSheet = XLSX.utils.aoa_to_sheet(roleData)
    roleSheet['!cols'] = [{ width: 20 }]
    XLSX.utils.book_append_sheet(workbook, roleSheet, '역할목록')
    
    // 조직 목록 시트
    const orgData = [
      ['사용 가능한 조직'],
      ...organizations.map(org => [org.name])
    ]
    
    const orgSheet = XLSX.utils.aoa_to_sheet(orgData)
    orgSheet['!cols'] = [{ width: 20 }]
    XLSX.utils.book_append_sheet(workbook, orgSheet, '조직목록')
    
    // 엑셀 파일을 버퍼로 변환
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // 응답 헤더 설정
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', 'attachment; filename="user_upload_template.xlsx"')
    
    return new NextResponse(buffer, { headers })

  } catch (error) {
    console.error('템플릿 다운로드 오류:', error)
    return NextResponse.json(
      { error: '템플릿 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}