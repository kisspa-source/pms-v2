import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testUserSearch() {
  console.log('=== 사용자 검색 테스트 ===')
  
  // 모든 사용자 조회
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })
  
  console.log('\n전체 사용자 목록:')
  allUsers.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - ${user.role}`)
  })
  
  // 다양한 검색어로 테스트
  const searchTerms = ['김', '개발', 'admin', 'pm', 'designer']
  
  for (const searchTerm of searchTerms) {
    console.log(`\n"${searchTerm}" 검색 결과:`)
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' },
      take: 10
    })
    
    if (users.length === 0) {
      console.log('  검색 결과 없음')
    } else {
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
      })
    }
  }
}

testUserSearch()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })