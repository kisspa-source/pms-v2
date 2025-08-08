import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'
import { UserRole } from '@/lib/auth-guards'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 권한 확인 (PMO만 사용자 업로드 가능)
    if (session.user.role !== UserRole.PMO) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '파일이 선택되지 않았습니다.' }, { status: 400 })
    }

    // 파일 확장자 확인
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json({ error: '엑셀 파일만 업로드 가능합니다.' }, { status: 400 })
    }

    // 파일을 버퍼로 읽기
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    // 첫 번째 시트 읽기
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // JSON으로 변환
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (jsonData.length < 2) {
      return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 })
    }

    // 헤더 확인 (첫 번째 행)
    const headers = jsonData[0]
    const expectedHeaders = ['이름', '이메일', '비밀번호', '역할', '조직명']
    
    const headerCheck = expectedHeaders.every(header => headers.includes(header))
    if (!headerCheck) {
      return NextResponse.json({ 
        error: `헤더가 올바르지 않습니다. 필요한 헤더: ${expectedHeaders.join(', ')}` 
      }, { status: 400 })
    }

    // 조직 목록 가져오기
    const organizations = await prisma.organization.findMany()
    const orgMap = new Map(organizations.map(org => [org.name, org.id]))

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 데이터 처리 (두 번째 행부터)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      
      if (!row || row.length === 0 || !row.some(cell => cell)) {
        continue // 빈 행 건너뛰기
      }

      try {
        const nameIndex = headers.indexOf('이름')
        const emailIndex = headers.indexOf('이메일')
        const passwordIndex = headers.indexOf('비밀번호')
        const roleIndex = headers.indexOf('역할')
        const orgIndex = headers.indexOf('조직명')

        const name = row[nameIndex]?.toString().trim()
        const email = row[emailIndex]?.toString().trim()
        const password = row[passwordIndex]?.toString().trim()
        const role = row[roleIndex]?.toString().trim()
        const orgName = row[orgIndex]?.toString().trim()

        console.log(`행 ${i + 1} 데이터:`, { name, email, password: '***', role, orgName })
        console.log(`사용 가능한 역할:`, Object.values(Role))
        console.log(`사용 가능한 조직:`, Array.from(orgMap.keys()))

        // 필수 필드 검증
        if (!name || !email || !password || !role) {
          results.errors.push(`행 ${i + 1}: 필수 필드가 누락되었습니다.`)
          results.failed++
          continue
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          results.errors.push(`행 ${i + 1}: 올바르지 않은 이메일 형식입니다.`)
          results.failed++
          continue
        }

        // 역할 검증
        if (!Object.values(Role).includes(role as Role)) {
          results.errors.push(`행 ${i + 1}: 올바르지 않은 역할입니다. (${Object.values(Role).join(', ')})`)
          results.failed++
          continue
        }

        // 이미 존재하는 이메일 확인
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          results.errors.push(`행 ${i + 1}: 이미 존재하는 이메일입니다. (${email})`)
          results.failed++
          continue
        }

        // 조직 ID 찾기
        let organizationId = null
        if (orgName) {
          organizationId = orgMap.get(orgName)
          if (!organizationId) {
            // 조직이 존재하지 않으면 새로 생성
            try {
              const newOrg = await prisma.organization.create({
                data: {
                  name: orgName,
                  description: `엑셀 업로드로 자동 생성된 조직`
                }
              })
              organizationId = newOrg.id
              orgMap.set(orgName, organizationId) // 맵에 추가하여 다음 행에서 재사용
              console.log(`새 조직 생성: ${orgName} (ID: ${organizationId})`)
            } catch (orgError) {
              console.error(`조직 생성 오류:`, orgError)
              results.errors.push(`행 ${i + 1}: 조직 생성 중 오류가 발생했습니다. (${orgName})`)
              results.failed++
              continue
            }
          }
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 12)

        // 사용자 생성
        const newUser = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: role as Role
          }
        })

        // 조직이 있는 경우 조직 멤버로 추가
        if (organizationId) {
          await prisma.organizationMember.create({
            data: {
              organization_id: organizationId,
              user_id: newUser.id,
              role: 'MEMBER'
            }
          })
        }

        results.success++
      } catch (error) {
        console.error(`행 ${i + 1} 처리 중 오류:`, error)
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
        results.errors.push(`행 ${i + 1}: ${errorMessage}`)
        results.failed++
      }
    }

    return NextResponse.json({
      message: `업로드 완료: 성공 ${results.success}건, 실패 ${results.failed}건`,
      results
    })

  } catch (error) {
    console.error('엑셀 업로드 오류:', error)
    return NextResponse.json(
      { error: '엑셀 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}