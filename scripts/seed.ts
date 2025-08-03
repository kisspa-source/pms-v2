import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 초기 조직 생성
  const organization = await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'PMS 시스템',
      description: '프로젝트 관리 시스템'
    }
  })

  // 초기 사용자 생성
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pms.com' },
    update: {},
    create: {
      email: 'admin@pms.com',
      name: '관리자',
      password: hashedPassword,
      role: 'PMO',
      department: 'IT',
      hourly_rate: 50000
    }
  })

  // 조직 멤버로 관리자 추가
  await prisma.organizationMember.upsert({
    where: { 
      organization_id_user_id: {
        organization_id: organization.id,
        user_id: adminUser.id
      }
    },
    update: {},
    create: {
      organization_id: organization.id,
      user_id: adminUser.id,
      role: 'ADMIN'
    }
  })

  // 샘플 고객사 생성
  const client = await prisma.client.create({
    data: {
      organization_id: organization.id,
      name: '샘플 고객사',
      company_type: '중소기업',
      industry: 'IT',
      contact_person: '김담당',
      email: 'contact@sample.com',
      phone: '02-1234-5678',
      address: '서울시 강남구',
      website: 'https://sample.com',
      notes: '샘플 고객사입니다.',
      status: 'ACTIVE'
    }
  })

  // 샘플 프로젝트 생성
  await prisma.project.create({
    data: {
      organization_id: organization.id,
      client_id: client.id,
      name: '샘플 프로젝트',
      description: '샘플 프로젝트 설명입니다.',
      project_type: 'WEB',
      status: 'PLANNING',
      priority: 'MEDIUM',
      budget_amount: 10000000,
      contract_amount: 10000000,
      estimated_hours: 200
    }
  })

  console.log('초기 데이터 생성 완료!')
  console.log('관리자 계정: admin@pms.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 