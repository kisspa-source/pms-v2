# PMS System - 시작하기

## 🚀 빠른 시작 (5분 완료)

### 1. 자동 설정
```bash
git clone <repository-url>
cd pms-system
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### 2. 접속 및 로그인
- **URL**: http://localhost:3000
- **기본 계정**:
  - PMO: admin@techsolution.com / password123
  - PM: pm@techsolution.com / password123
  - Developer: dev@techsolution.com / password123

---

## 📋 시스템 개요

### 목표
IT 회사의 프로젝트 관리를 위한 종합적인 솔루션으로, 고객사 관리부터 팀원 배정, 일정 관리, 예산 추적까지 모든 프로젝트 라이프사이클을 관리

### 핵심 특징
- **역할 기반 관리**: PMO, PM, PL, 개발자, 디자이너, 컨설턴트별 권한 및 뷰
- **고객사 중심**: 고객사별 프로젝트 그룹핑 및 관리
- **예산 추적**: 프로젝트별 수익성 분석 및 비용 관리
- **실시간 협업**: 팀원 간 실시간 소통 및 진행상황 공유

---

## 🛠️ 개발 환경 요구사항

### 필수 도구
- **Node.js** 18+ 
- **PostgreSQL** 14+ (로컬 설치 또는 원격 서버)
- **Git**

### 환경 확인
```bash
# 환경 상태 검증
npm run check:dev
```

---

## 📚 문서 가이드

### 개발자용
- [빠른 시작 가이드](./quick-start.md) - 5분 만에 로컬 실행
- [문제 해결 가이드](./troubleshooting.md) - 일반적인 문제 해결
- [API 문서](./api.md) - API 엔드포인트 상세 정보

### 운영자용
- [배포 가이드](./deployment.md) - 프로덕션 배포 방법
- [데이터베이스 스키마](./database.md) - 데이터 모델 이해

---

## 🎯 주요 기능

### 대시보드 (역할별)
- **PMO**: 전체 포트폴리오, 수익성 분석, 리소스 활용률
- **PM**: 담당 프로젝트 현황, 팀원 관리, 일정 관리(등록/수정/삭제) 및 추적
- **PL/팀원**: 할당 작업, 시간 로그, 팀 커뮤니케이션

### 프로젝트 뷰
- **칸반 보드**: 드래그 앤 드롭 작업 관리
- **간트 차트**: 일정 및 의존성 시각화
- **리스트 뷰**: 테이블 형태 작업 목록
- **캘린더**: 팀원별 일정 관리

### 협업 도구
- **실시간 댓글**: Socket.io 기반 실시간 소통
- **파일 첨부**: 프로젝트/작업별 파일 관리
- **알림 시스템**: 중요 이벤트 실시간 알림

## 2. 기술 스택

### Frontend
```
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui (UI 컴포넌트)
- React Hook Form
- Zustand (상태 관리)
- React Query (서버 상태)
- Recharts (차트 라이브러리)
```

### Backend & Database
```
- PostgreSQL (로컬 또는 원격 데이터베이스)
- Prisma ORM (데이터베이스 관리)
- NextAuth.js (인증 시스템)
- Node.js API Routes (Next.js)
- Socket.io (실시간 통신)
```

### 개발 도구
```
- TypeScript
- ESLint + Prettier
```

## 3. 데이터베이스 설계 (PostgreSQL + Prisma)

### 3.1 Prisma 스키마 설정
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 사용자 관리
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String
  avatar_url    String?
  role          Role
  department    String?
  hourly_rate   Decimal?  @db.Decimal(10, 2)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  // Relations
  organization_members OrganizationMember[]
  project_members     ProjectMember[]
  assigned_tasks      Task[]           @relation("TaskAssignee")
  reported_tasks      Task[]           @relation("TaskReporter")
  time_logs          TimeLog[]
  comments           Comment[]
  attachments        Attachment[]
  notifications      Notification[]
  created_expenses   ProjectExpense[]

  @@map("users")
}

enum Role {
  PMO
  PM
  PL
  DEVELOPER
  DESIGNER
  CONSULTANT
}

// 회사/조직 관리
model Organization {
  id          String   @id @default(cuid())
  name        String
  description String?
  created_at  DateTime @default(now())

  // Relations
  members  OrganizationMember[]
  clients  Client[]
  projects Project[]

  @@map("organizations")
}

// 조직 멤버십
model OrganizationMember {
  id              String       @id @default(cuid())
  organization_id String
  user_id         String
  role            String       @default("MEMBER")
  joined_at       DateTime     @default(now())

  // Relations
  organization Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([organization_id, user_id])
  @@map("organization_members")
}
```

### 3.2 고객사 및 프로젝트 관리 (계속)
```prisma
// 고객사 관리
model Client {
  id              String       @id @default(cuid())
  organization_id String
  name            String
  company_type    String?
  industry        String?
  contact_person  String?
  email           String?
  phone           String?
  address         String?
  website         String?
  notes           String?
  status          ClientStatus @default(ACTIVE)
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  // Relations
  organization Organization @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  projects     Project[]

  @@unique([organization_id, name])
  @@map("clients")
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  PROSPECT
}

// 프로젝트 관리
model Project {
  id               String        @id @default(cuid())
  organization_id  String
  client_id        String
  name             String
  description      String?
  project_type     ProjectType?
  status           ProjectStatus @default(PLANNING)
  priority         Priority      @default(MEDIUM)
  
  // 일정 관리
  start_date       DateTime?
  end_date         DateTime?
  estimated_hours  Int?
  actual_hours     Int           @default(0)
  
  // 예산 관리
  budget_amount    Decimal?      @db.Decimal(12, 2)
  contract_amount  Decimal?      @db.Decimal(12, 2)
  actual_cost      Decimal       @default(0) @db.Decimal(12, 2)
  currency         String        @default("KRW")
  
  // 진행률
  progress         Int           @default(0)
  
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt

  // Relations
  organization Organization     @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  client       Client          @relation(fields: [client_id], references: [id], onDelete: Cascade)
  members      ProjectMember[]
  phases       ProjectPhase[]
  tasks        Task[]
  time_logs    TimeLog[]
  expenses     ProjectExpense[]
  comments     Comment[]
  attachments  Attachment[]

  @@map("projects")
}

enum ProjectType {
  WEB
  MOBILE
  SYSTEM
  CONSULTING
  MAINTENANCE
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// 프로젝트 팀원 배정
model ProjectMember {
  id                    String   @id @default(cuid())
  project_id            String
  user_id               String
  role                  Role
  allocation_percentage Int      @default(100)
  hourly_rate           Decimal? @db.Decimal(10, 2)
  joined_at             DateTime @default(now())
  left_at               DateTime?

  // Relations
  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([project_id, user_id, role])
  @@map("project_members")
}
```

### 3.3 작업 및 일정 관리 (계속)
```prisma
// 프로젝트 단계/마일스톤
model ProjectPhase {
  id          String      @id @default(cuid())
  project_id  String
  name        String
  description String?
  start_date  DateTime?
  end_date    DateTime?
  status      PhaseStatus @default(PENDING)
  order_index Int
  created_at  DateTime    @default(now())

  // Relations
  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@map("project_phases")
}

enum PhaseStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  DELAYED
}

// 작업 관리
model Task {
  id              String     @id @default(cuid())
  project_id      String
  phase_id        String?
  parent_task_id  String?
  title           String
  description     String?
  status          TaskStatus @default(TODO)
  priority        Priority   @default(MEDIUM)
  assignee_id     String?
  reporter_id     String?
  start_date      DateTime?
  due_date        DateTime?
  estimated_hours Decimal?   @db.Decimal(5, 2)
  actual_hours    Decimal    @default(0) @db.Decimal(5, 2)
  progress        Int        @default(0)
  created_at      DateTime   @default(now())
  updated_at      DateTime   @updatedAt

  // Relations
  project         Project           @relation(fields: [project_id], references: [id], onDelete: Cascade)
  phase           ProjectPhase?     @relation(fields: [phase_id], references: [id], onDelete: SetNull)
  parent_task     Task?             @relation("TaskHierarchy", fields: [parent_task_id], references: [id], onDelete: Cascade)
  sub_tasks       Task[]            @relation("TaskHierarchy")
  assignee        User?             @relation("TaskAssignee", fields: [assignee_id], references: [id])
  reporter        User?             @relation("TaskReporter", fields: [reporter_id], references: [id])
  predecessors    TaskDependency[]  @relation("PredecessorTask")
  successors      TaskDependency[]  @relation("SuccessorTask")
  time_logs       TimeLog[]
  comments        Comment[]
  attachments     Attachment[]

  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  BLOCKED
}

// 작업 의존성
model TaskDependency {
  id              String         @id @default(cuid())
  predecessor_id  String
  successor_id    String
  dependency_type DependencyType @default(FINISH_TO_START)
  lag_days        Int            @default(0)

  // Relations
  predecessor Task @relation("PredecessorTask", fields: [predecessor_id], references: [id], onDelete: Cascade)
  successor   Task @relation("SuccessorTask", fields: [successor_id], references: [id], onDelete: Cascade)

  @@unique([predecessor_id, successor_id])
  @@map("task_dependencies")
}

enum DependencyType {
  FINISH_TO_START
  START_TO_START
  FINISH_TO_FINISH
  START_TO_FINISH
}
```

### 3.4 시간 추적 및 비용 관리 (계속)
```prisma
// 시간 로그
model TimeLog {
  id          String   @id @default(cuid())
  project_id  String
  task_id     String?
  user_id     String
  description String?
  hours       Decimal  @db.Decimal(5, 2)
  log_date    DateTime @db.Date
  hourly_rate Decimal? @db.Decimal(10, 2)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  // Relations
  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  task    Task?   @relation(fields: [task_id], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("time_logs")
}

// 프로젝트 비용
model ProjectExpense {
  id           String   @id @default(cuid())
  project_id   String
  category     String
  description  String
  amount       Decimal  @db.Decimal(10, 2)
  expense_date DateTime @db.Date
  receipt_url  String?
  created_by   String?
  created_at   DateTime @default(now())

  // Relations
  project    Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  created_by_user User? @relation(fields: [created_by], references: [id])

  @@map("project_expenses")
}
```

### 3.5 협업 및 커뮤니케이션 (계속)
```prisma
// 댓글 시스템
model Comment {
  id                String   @id @default(cuid())
  project_id        String?
  task_id           String?
  user_id           String
  content           String
  parent_comment_id String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // Relations
  project        Project?  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  task           Task?     @relation(fields: [task_id], references: [id], onDelete: Cascade)
  user           User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  parent_comment Comment?  @relation("CommentReplies", fields: [parent_comment_id], references: [id], onDelete: Cascade)
  replies        Comment[] @relation("CommentReplies")

  @@map("comments")
}

// 파일 첨부
model Attachment {
  id         String   @id @default(cuid())
  project_id String?
  task_id    String?
  user_id    String
  filename   String
  file_path  String
  file_size  BigInt?
  mime_type  String?
  created_at DateTime @default(now())

  // Relations
  project Project? @relation(fields: [project_id], references: [id], onDelete: Cascade)
  task    Task?    @relation(fields: [task_id], references: [id], onDelete: SetNull)
  user    User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("attachments")
}

// 알림 시스템
model Notification {
  id         String    @id @default(cuid())
  user_id    String
  type       String
  title      String
  message    String
  data       Json?
  read_at    DateTime?
  created_at DateTime  @default(now())

  // Relations
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("notifications")
}
```

## 4. 주요 기능 설계

### 4.1 대시보드 (역할별)
```
PMO 대시보드:
- 전체 프로젝트 포트폴리오 현황
- 수익성 분석 및 예산 대비 실적
- 리소스 활용률 분석
- 고객사별 프로젝트 현황

PM 대시보드:
- 담당 프로젝트 진행 현황
- 프로젝트 일정 등록/수정/삭제
- 팀원 작업 배정 및 진행률
- 일정 지연 위험 알림
- 예산 사용 현황

PL/개발자/디자이너/컨설턴트 대시보드:
- 할당된 작업 목록
- 개인 일정 및 데드라인
- 시간 로그 입력
- 팀 커뮤니케이션
```

### 4.2 프로젝트 뷰 시스템
```
1. 칸반 보드
   - 작업 상태별 카드 뷰
   - 드래그 앤 드롭으로 상태 변경
   - 담당자별 필터링

2. 갠트 차트
   - 프로젝트 전체 일정 시각화
   - 작업 간 의존성 표시
   - 크리티컬 패스 하이라이트
   - 마일스톤 및 데드라인 표시
   - 리소스 할당 현황

3. 리스트 뷰
   - 작업 목록 테이블 형태
   - 정렬 및 필터링 기능
   - 일괄 편집 기능

4. 캘린더 뷰
   - 월/주/일 단위 일정 보기
   - 팀원별 일정 확인
   - 회의 및 마일스톤 표시

5. 타임라인 뷰
   - 프로젝트 단계별 진행 현황
   - 지연 위험 구간 하이라이트
```

### 4.3 보고서 및 분석
```
프로젝트 보고서:
- 진행률 및 일정 준수율
- 예산 대비 실적 분석
- 팀원별 생산성 분석
- 고객 만족도 추적

재무 보고서:
- 프로젝트별 수익성 분석
- 월별/분기별 매출 현황
- 비용 구조 분석
- ROI 계산

리소스 보고서:
- 팀원별 활용률
- 스킬셋별 배정 현황
- 오버타임 분석
```

## 5. 프로젝트 구조

```
pms-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # 대시보드 페이지
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── clients/
│   │   ├── tasks/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/                      # API 라우트
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── clients/
│   │   ├── time-logs/
│   │   └── uploads/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # 재사용 가능한 컴포넌트
│   ├── ui/                      # shadcn/ui 컴포넌트
│   ├── forms/                   # 폼 컴포넌트
│   ├── charts/                  # 차트 컴포넌트
│   ├── kanban/                  # 칸반 보드 컴포넌트
│   ├── gantt/                   # 간트 차트 컴포넌트
│   └── layout/                  # 레이아웃 컴포넌트
├── lib/                         # 유틸리티 및 설정
│   ├── auth.ts                  # NextAuth 설정
│   ├── db.ts                    # Prisma 클라이언트
│   ├── utils.ts                 # 유틸리티 함수
│   └── validations.ts           # Zod 스키마
├── hooks/                       # 커스텀 훅
│   ├── use-projects.ts
│   ├── use-tasks.ts
│   └── use-time-logs.ts
├── stores/                      # Zustand 스토어
│   ├── auth-store.ts
│   ├── project-store.ts
│   └── ui-store.ts
├── types/                       # TypeScript 타입 정의
│   ├── auth.ts
│   ├── project.ts
│   └── task.ts
├── prisma/                      # 데이터베이스 스키마
│   ├── schema.prisma
│   └── migrations/
├── public/                      # 정적 파일
│   ├── images/
│   └── uploads/
├── docs/                        # 문서
├── tests/                       # 테스트 파일
├── .env.example                 # 환경변수 예시
├── .env.local                   # 로컬 환경변수
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## 6. 구현 단계별 계획

### Phase 1: 기본 인프라 (2주)
```
Week 1:
- Next.js 프로젝트 설정
- PostgreSQL 데이터베이스 설정
- Prisma 스키마 생성 및 마이그레이션
- NextAuth.js 인증 시스템 구현
- 기본 UI 컴포넌트 구축 (shadcn/ui)

Week 2:
- 라우팅 및 레이아웃 설정
- 기본 CRUD 작업 구현
- 사용자 권한 시스템
- 기본 대시보드 구현
```

### Phase 2: 핵심 기능 (3주)
```
Week 3:
- 프로젝트 관리 기능
- 고객사 관리 시스템
- 팀원 배정 시스템
- 프로젝트 멤버십 관리

Week 4:
- 작업 관리 시스템
- 칸반 보드 구현
- 작업 상태 관리
- 작업 할당 및 진행률 추적

Week 5:
- 시간 추적 기능
- 댓글 및 첨부파일 시스템
- 파일 업로드 기능
- 기본 알림 시스템
```

### Phase 3: 고급 기능 (3주)
```
Week 6:
- 간트 차트 구현
- 프로젝트 단계 관리
- 작업 의존성 관리
- 일정 관리 및 추적

Week 7:
- 프로젝트 보고서 시스템
- 재무 분석 기능
- 리소스 활용률 분석
- 고급 알림 시스템

Week 8:
- 실시간 협업 기능 (Socket.io)
- 실시간 댓글 및 알림
- 팀 커뮤니케이션 도구
- 모바일 반응형 최적화
```

### Phase 4: 최적화 및 배포 (2주)
```
Week 9:
- 성능 최적화
- 코드 스플리팅
- 이미지 최적화
- 테스트 작성 및 실행

Week 10:
- 프로덕션 배포 설정
- 모니터링 및 로깅 설정
- 문서화 완성
- 사용자 가이드 작성
```

## 7. 로컬 개발 환경 설정

### 7.1 필수 요구사항
```
- Node.js 18+
- PostgreSQL 14+ (로컬 설치 또는 원격 서버)
- Git
```

### 7.2 PostgreSQL 설치 및 설정

#### macOS (Homebrew 사용)
```bash
# PostgreSQL 설치
brew install postgresql@14

# PostgreSQL 서비스 시작
brew services start postgresql@14

# 데이터베이스 생성
createdb pms_system
```

#### Windows
```bash
# PostgreSQL 공식 사이트에서 다운로드
# https://www.postgresql.org/download/windows/

# 설치 후 데이터베이스 생성
psql -U postgres
CREATE DATABASE pms_system;
```

#### Linux (Ubuntu/Debian)
```bash
# PostgreSQL 설치
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 생성
sudo -u postgres createdb pms_system
```

### 7.3 프로젝트 설치 및 실행
```bash
# 저장소 클론
git clone <repository-url>
cd pms-system

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local

# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:migrate

# 시드 데이터 생성 (기본 테스트 계정 포함)
npm run db:seed

# 개발 서버 실행
npm run dev
```

### 7.4 환경변수 설정
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pms_system"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# File Upload (선택사항)
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760" # 10MB

# Email (선택사항)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Socket.io (실시간 기능용)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### 7.5 package.json 스크립트 설정
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset && npm run db:seed",
    "db:studio": "prisma studio",
    "db:status": "prisma migrate status",
    "check:dev": "node -v && npm -v && prisma --version"
  }
}
```

### 7.6 데이터베이스 연결 확인
```bash
# Prisma Studio 실행 (데이터베이스 GUI)
npm run db:studio

# 데이터베이스 상태 확인
npm run db:status

# 마이그레이션 상태 확인
npm run db:migrate:status
```

### 7.7 시드 데이터 설정 (기본 테스트 계정)

#### package.json 스크립트 추가
```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset && npm run db:seed"
  }
}
```

#### prisma/seed.ts 파일 생성
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 생성 시작...')

  // 기본 조직 생성
  const organization = await prisma.organization.upsert({
    where: { id: 'org_default' },
    update: {},
    create: {
      id: 'org_default',
      name: '테크솔루션',
      description: 'IT 솔루션 전문 회사'
    }
  })

  // 기본 사용자들 생성
  const users = [
    {
      id: 'user_admin',
      email: 'admin@techsolution.com',
      name: '관리자',
      password: 'password123',
      role: 'PMO',
      department: '경영진',
      hourly_rate: 100000
    },
    {
      id: 'user_pm',
      email: 'pm@techsolution.com',
      name: '프로젝트 매니저',
      password: 'password123',
      role: 'PM',
      department: '프로젝트팀',
      hourly_rate: 80000
    },
    {
      id: 'user_pl',
      email: 'pl@techsolution.com',
      name: '프로젝트 리드',
      password: 'password123',
      role: 'PL',
      department: '개발팀',
      hourly_rate: 70000
    },
    {
      id: 'user_dev',
      email: 'dev@techsolution.com',
      name: '개발자',
      password: 'password123',
      role: 'DEVELOPER',
      department: '개발팀',
      hourly_rate: 60000
    },
    {
      id: 'user_designer',
      email: 'designer@techsolution.com',
      name: '디자이너',
      password: 'password123',
      role: 'DESIGNER',
      department: '디자인팀',
      hourly_rate: 55000
    },
    {
      id: 'user_consultant',
      email: 'consultant@techsolution.com',
      name: '컨설턴트',
      password: 'password123',
      role: 'CONSULTANT',
      department: '컨설팅팀',
      hourly_rate: 90000
    }
  ]

  // 사용자 생성 및 조직 멤버십 설정
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role as any,
        department: userData.department,
        hourly_rate: userData.hourly_rate
      }
    })

    // 조직 멤버십 생성
    await prisma.organizationMember.upsert({
      where: {
        organization_id_user_id: {
          organization_id: organization.id,
          user_id: user.id
        }
      },
      update: {},
      create: {
        organization_id: organization.id,
        user_id: user.id,
        role: userData.role === 'PMO' ? 'ADMIN' : 'MEMBER'
      }
    })
  }

  // 기본 고객사 생성
  const clients = [
    {
      name: 'ABC 기업',
      company_type: 'IT',
      industry: '소프트웨어',
      contact_person: '김철수',
      email: 'kim@abc.com',
      phone: '02-1234-5678',
      status: 'ACTIVE'
    },
    {
      name: 'XYZ 스타트업',
      company_type: '스타트업',
      industry: '핀테크',
      contact_person: '이영희',
      email: 'lee@xyz.com',
      phone: '02-9876-5432',
      status: 'ACTIVE'
    },
    {
      name: 'DEF 대기업',
      company_type: '대기업',
      industry: '제조업',
      contact_person: '박민수',
      email: 'park@def.com',
      phone: '02-5555-1234',
      status: 'PROSPECT'
    }
  ]

  for (const clientData of clients) {
    await prisma.client.upsert({
      where: { 
        name: clientData.name,
        organization_id: organization.id
      },
      update: {},
      create: {
        organization_id: organization.id,
        ...clientData
      }
    })
  }

  // 기본 프로젝트 생성
  const projects = [
    {
      name: '웹사이트 리뉴얼 프로젝트',
      description: 'ABC 기업의 기존 웹사이트를 현대적으로 리뉴얼하는 프로젝트',
      project_type: 'WEB',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-06-30'),
      estimated_hours: 800,
      budget_amount: 50000000,
      contract_amount: 45000000,
      progress: 35
    },
    {
      name: '모바일 앱 개발',
      description: 'XYZ 스타트업의 핀테크 모바일 애플리케이션 개발',
      project_type: 'MOBILE',
      status: 'PLANNING',
      priority: 'MEDIUM',
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-09-30'),
      estimated_hours: 1200,
      budget_amount: 80000000,
      contract_amount: 75000000,
      progress: 0
    }
  ]

  const createdProjects = []
  for (const projectData of projects) {
    const client = await prisma.client.findFirst({
      where: { organization_id: organization.id }
    })

    if (client) {
      const project = await prisma.project.create({
        data: {
          organization_id: organization.id,
          client_id: client.id,
          ...projectData
        }
      })
      createdProjects.push(project)
    }
  }

  // 프로젝트 팀원 배정
  if (createdProjects.length > 0) {
    const project = createdProjects[0] // 첫 번째 프로젝트에 팀원 배정
    
    const teamMembers = [
      { user_id: 'user_pm', role: 'PM', allocation_percentage: 100 },
      { user_id: 'user_pl', role: 'PL', allocation_percentage: 80 },
      { user_id: 'user_dev', role: 'DEVELOPER', allocation_percentage: 100 },
      { user_id: 'user_designer', role: 'DESIGNER', allocation_percentage: 60 }
    ]

    for (const memberData of teamMembers) {
      await prisma.projectMember.upsert({
        where: {
          project_id_user_id_role: {
            project_id: project.id,
            user_id: memberData.user_id,
            role: memberData.role as any
          }
        },
        update: {},
        create: {
          project_id: project.id,
          ...memberData
        }
      })
    }

    // 프로젝트 단계 생성
    const phases = [
      { name: '기획 및 설계', order_index: 1, status: 'COMPLETED' },
      { name: 'UI/UX 디자인', order_index: 2, status: 'IN_PROGRESS' },
      { name: '프론트엔드 개발', order_index: 3, status: 'PENDING' },
      { name: '백엔드 개발', order_index: 4, status: 'PENDING' },
      { name: '테스트 및 배포', order_index: 5, status: 'PENDING' }
    ]

    for (const phaseData of phases) {
      await prisma.projectPhase.create({
        data: {
          project_id: project.id,
          ...phaseData
        }
      })
    }

    // 기본 작업 생성
    const tasks = [
      {
        title: '요구사항 분석',
        description: '고객 요구사항을 상세히 분석하고 문서화',
        status: 'DONE',
        priority: 'HIGH',
        assignee_id: 'user_pm',
        reporter_id: 'user_pm',
        estimated_hours: 40,
        actual_hours: 35,
        progress: 100
      },
      {
        title: 'UI 디자인 작업',
        description: '메인 페이지 및 서브 페이지 UI 디자인',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignee_id: 'user_designer',
        reporter_id: 'user_pm',
        estimated_hours: 80,
        actual_hours: 45,
        progress: 56
      },
      {
        title: '데이터베이스 설계',
        description: '프로젝트에 필요한 데이터베이스 스키마 설계',
        status: 'REVIEW',
        priority: 'MEDIUM',
        assignee_id: 'user_pl',
        reporter_id: 'user_pm',
        estimated_hours: 24,
        actual_hours: 20,
        progress: 83
      }
    ]

    for (const taskData of tasks) {
      await prisma.task.create({
        data: {
          project_id: project.id,
          ...taskData
        }
      })
    }
  }

  console.log('✅ 시드 데이터 생성 완료!')
  console.log('📧 기본 테스트 계정:')
  console.log('  - PMO: admin@techsolution.com / password123')
  console.log('  - PM: pm@techsolution.com / password123')
  console.log('  - PL: pl@techsolution.com / password123')
  console.log('  - Developer: dev@techsolution.com / password123')
  console.log('  - Designer: designer@techsolution.com / password123')
  console.log('  - Consultant: consultant@techsolution.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

#### 필요한 의존성 설치
```bash
# 필수 의존성
npm install bcryptjs tsx @next-auth/prisma-adapter

# 개발 의존성
npm install -D @types/bcryptjs
```

## 8. 보안 및 권한 관리

### 8.1 데이터베이스 보안
```sql
-- 사용자 생성 및 권한 설정
CREATE USER pms_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE pms_system TO pms_user;
GRANT USAGE ON SCHEMA public TO pms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pms_user;
```

### 8.2 애플리케이션 레벨 보안
```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}
```

### 8.3 역할별 권한 매트릭스
```
기능                PMO  PM   PL   DEV  DES  CON
프로젝트 생성        ✓    ✓    -    -    -    -
프로젝트 수정        ✓    ✓    -    -    -    -
팀원 배정           ✓    ✓    ✓    -    -    -
작업 생성           ✓    ✓    ✓    ✓    ✓    ✓
작업 할당           ✓    ✓    ✓    -    -    -
시간 로그           ✓    ✓    ✓    ✓    ✓    ✓
예산 관리           ✓    ✓    -    -    -    -
보고서 조회         ✓    ✓    ✓    ✓    ✓    ✓
고객사 관리         ✓    ✓    -    -    -    -
```

## 9. 성능 최적화

### 9.1 데이터베이스 최적화
```sql
-- 인덱스 생성
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_time_logs_project_user ON time_logs(project_id, user_id);
CREATE INDEX idx_time_logs_date ON time_logs(log_date);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);

-- 파티셔닝 (대용량 데이터용)
CREATE TABLE time_logs_2024 PARTITION OF time_logs
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 9.2 프론트엔드 최적화
```typescript
// React Query 설정
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// 가상화된 테이블 (react-window)
import { FixedSizeList as List } from 'react-window'

// 이미지 최적화
import Image from 'next/image'

// 코드 스플리팅
import dynamic from 'next/dynamic'

const GanttChart = dynamic(() => import('@/components/charts/GanttChart'), {
  loading: () => <div>Loading...</div>,
  ssr: false
})
```

### 9.3 API 최적화
```typescript
// API 응답 캐싱
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  const tasks = await prisma.task.findMany({
    where: { project_id: projectId },
    include: {
      assignee: true,
      phase: true,
    },
    orderBy: { created_at: 'desc' }
  })

  return Response.json(tasks, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

## 10. 테스트 전략

### 10.1 테스트 설정
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### 10.2 단위 테스트 예시
```typescript
// __tests__/components/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '@/components/ProjectCard'

describe('ProjectCard', () => {
  it('renders project information correctly', () => {
    const project = {
      id: '1',
      name: 'Test Project',
      status: 'IN_PROGRESS',
      progress: 50,
      client: { name: 'Test Client' }
    }

    render(<ProjectCard project={project} />)
    
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Test Client')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
```

### 10.3 E2E 테스트 예시
```typescript
// tests/project-management.spec.ts
import { test, expect } from '@playwright/test'

test('create new project', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email"]', 'pm@techsolution.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="login-button"]')
  
  await page.waitForURL('/dashboard')
  await page.click('[data-testid="new-project-button"]')
  
  await page.fill('[data-testid="project-name"]', 'New Test Project')
  await page.fill('[data-testid="project-description"]', 'Test Description')
  await page.click('[data-testid="save-project"]')
  
  await expect(page.locator('text=New Test Project')).toBeVisible()
})
```

### 10.4 테스트 커버리지 목표
```
- 비즈니스 로직: 90% 이상
- UI 컴포넌트: 80% 이상
- API 엔드포인트: 95% 이상
- E2E 테스트: 주요 사용자 플로우 100%
```

## 11. 배포 가이드

### 11.1 프로덕션 환경 설정
```bash
# 환경변수 설정
DATABASE_URL="postgresql://username:password@your-db-server:5432/pms_system"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="http://your-server-ip:3000"

# Prisma 클라이언트 생성
npm run db:generate

# 빌드 및 배포
npm run build
npm start
```

### 11.2 PM2를 사용한 프로세스 관리
```bash
# PM2 설치
npm install -g pm2

# 애플리케이션 시작
pm2 start npm --name "pms-system" -- start

# 로그 확인
pm2 logs pms-system

# 상태 확인
pm2 status

# 애플리케이션 재시작
pm2 restart pms-system

# 애플리케이션 중지
pm2 stop pms-system
```

### 11.3 방화벽 설정 (포트 3000 개방)
```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 접속 확인
curl http://localhost:3000
```

## 12. UI/UX 청사진 (Blueprint)

제공된 이미지들을 기반으로 PMS 시스템의 주요 UI/UX 구성 요소와 기능을 정의합니다. 이는 개발 과정에서 디자인 및 기능 구현의 기준점이 됩니다.

### 12.1 전체 시스템 개요

PMS 시스템은 프로젝트 관리의 핵심 기능을 통합하여 제공하는 사용자 친화적인 인터랙티브 시스템입니다. 주요 섹션은 다음과 같습니다.

- **프로젝트 대시보드**: 프로젝트의 전반적인 상태를 한눈에 파악할 수 있는 요약 정보 제공
- **칸반 보드**: 작업 흐름을 시각적으로 관리하고 태스크의 진행 상황을 추적
- **일정 관리**: 프로젝트 마일스톤 및 태스크 일정을 타임라인 또는 캘린더 형태로 관리
- **팀 협업**: 팀원 간의 실시간 소통, 파일 공유, 의사결정 이력 관리

### 12.2 프로젝트 대시보드 (`pms_board.png`, `pms_main.png` 참고)

프로젝트의 핵심 지표와 최근 활동을 시각적으로 보여주는 페이지입니다.

#### 주요 구성 요소:
- **진행률 (Progress Rate)**: 프로젝트의 전체 진행률을 백분율(예: 72%)과 시각적인 그래프(물결선)로 표시
- **진행 상황 (Progress Status)**: 프로젝트 내 태스크의 완료, 진행 중, 대기, 지연 상태를 도넛 차트(예: 45%)로 시각화
- **마일스톤 (Milestones)**: 다가오는 주요 마일스톤 목록과 예정일(예: 디자인 수정 - 4월 25일, 테스트 계획 수립 - 5월 2일, 출시 준비 - 5월 10일)을 표시
- **최근 활동 (Recent Activities)**: 시스템 내에서 발생한 최신 활동(예: 새 작업 추가, 마일스톤 완료, 기능 적용)을 시간순으로 표시하며, 관련 사용자 아바타와 타임스탬프 포함
- **팀 멤버 (Team Members)**: 현재 프로젝트에 참여하고 있는 팀 멤버 목록과 아바타

#### 기능:
- 프로젝트 상태의 실시간 모니터링
- 주요 일정 및 기한 추적
- 팀 활동 내역 확인

### 12.3 칸반 보드 (`pms_board.png` 참고)

태스크의 흐름을 시각적으로 관리하는 도구입니다.

#### 주요 구성 요소:
- **컬럼**: "할 일 (To Do)", "진행 중 (In Progress)", "검토 (Review)" 등 태스크 상태별 컬럼. 각 컬럼에는 해당 상태의 태스크 수 표시(예: 할 일 4/4)
- **태스크 카드**: 각 태스크는 카드 형태로 표시되며, 다음 정보를 포함:
  - 태스크 제목 (예: 태스크 1, 태스크 3, 태스크 5)
  - 완료 체크박스
  - 마감일 (예: 4월 30일)
  - 우선순위 또는 상태를 나타내는 작은 색상 원
  - 담당자 아바타
  - 진행률 표시 (파란색 점, 가로 막대)

#### 기능:
- 태스크 카드 드래그 앤 드롭으로 상태 변경
- 태스크 카드 클릭 시 상세 정보 확인 및 편집
- 태스크 생성 및 할당

### 12.4 일정 관리 (`pms_schedule.png` 참고)

프로젝트의 시간 계획을 시각적으로 관리합니다.

#### 주요 구성 요소:
- **뷰 전환**: "캘린더 (Calendar)"와 "타임라인 (Timeline)" 탭으로 뷰 전환 가능. (타임라인 뷰가 기본으로 보임)
- **프로젝트 단계 드롭다운**: 특정 프로젝트 단계별로 일정을 필터링
- **기간 뷰**: "주간 보기 (Weekly View)"와 "월간 보기 (Monthly View)" 옵션
- **타임라인/간트 차트**:
  - 좌측에 "마일스톤", "프로젝트 계획", "설계 & 디자인", "개발 작업", "출시" 등 주요 항목 목록
  - 각 항목의 "기간"을 나타내는 작은 아이콘
  - 요일(월, 화, 수, 목, 금, 토, 일)을 기준으로 각 항목의 시작일과 종료일을 나타내는 가로 막대 그래프

#### 기능:
- 프로젝트 단계별 일정 시각화
- 주간/월간 단위로 일정 확인
- 마일스톤 및 태스크의 기간 및 종속성 파악

### 12.5 팀 협업 (`pms_team_collaboration.png` 참고)

팀원 간의 소통과 의사결정을 지원하는 기능입니다.

#### 주요 구성 요소:
- **탭 전환**: "댓글 (Comments)"과 "파일 (Files)" 탭으로 전환 가능. (댓글 탭이 기본으로 보임)
- **댓글 섹션**:
  - 사용자 아바타, 이름, 댓글 내용, 타임스탬프를 포함한 대화 스레드
  - 다른 사용자 멘션 기능(예: @김현우)
  - 파일 첨부 기능(예: 계획안.pdf)
  - 새 댓글 작성 입력 필드 및 "@멘션 추가" 기능
- **의사결정 히스토리 (Decision History)**:
  - 프로젝트의 주요 의사결정 이력 및 버전 관리(예: 버전 3으로 롤백됨, 새로운 버전 4, 버전 3 생성됨)
  - 각 결정의 타임스탬프 포함
- **멤버 목록 (Members List)**:
  - 팀원 목록과 검색 기능
  - 각 멤버의 아바타와 이름 표시
  - 멤버 상태 표시 (협업 중, 자리 비움 등)

#### 기능:
- 실시간 댓글을 통한 팀원 간 소통
- 프로젝트 관련 파일 공유
- 중요 의사결정의 이력 추적 및 관리
- 팀원 검색 및 정보 확인

### 12.6 디자인 가이드라인

#### 색상 팔레트:
- **주요 색상**: 파란색 (#3B82F6) - 주요 데이터, 링크, 활성 상태
- **보조 색상**: 주황색 (#F97316) - 진행률, 강조 요소
- **중성 색상**: 회색 (#6B7280) - 보조 텍스트, 비활성 상태
- **배경**: 흰색 (#FFFFFF) - 메인 배경
- **카드 배경**: 연한 회색 (#F9FAFB) - 카드 배경

#### 타이포그래피:
- **제목**: 굵은 산세리프 폰트, 18-24px
- **본문**: 일반 산세리프 폰트, 14-16px
- **작은 텍스트**: 12px - 타임스탬프, 상태 표시

#### 아이콘:
- **사용자**: 원형 아바타 이미지
- **상태**: 작은 원형 아이콘 (파란색, 주황색, 회색)
- **기능**: 직관적인 아이콘 (검색, 설정, 파일 첨부, 알림)

#### 레이아웃:
- **카드 기반**: 정보의 가독성을 높이기 위해 카드 기반의 모듈형 레이아웃
- **그리드 시스템**: 12컬럼 그리드 시스템 사용
- **반응형**: 다양한 디바이스에서 최적화된 사용자 경험 제공

### 12.7 컴포넌트 구현 가이드

#### 대시보드 컴포넌트:
```typescript
// components/dashboard/DashboardCard.tsx
interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'orange' | 'green' | 'red';
}

// components/dashboard/ProgressChart.tsx
interface ProgressChartProps {
  percentage: number;
  type: 'donut' | 'line' | 'bar';
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

// components/dashboard/ActivityFeed.tsx
interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  timestamp: string;
  icon: string;
}
```

#### 칸반 보드 컴포넌트:
```typescript
// components/kanban/KanbanBoard.tsx
interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: Task[];
}

// components/kanban/TaskCard.tsx
interface TaskCardProps {
  task: Task;
  onDragStart: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}
```

#### 일정 관리 컴포넌트:
```typescript
// components/schedule/GanttChart.tsx
interface GanttItem {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignee: string;
  color: string;
}

// components/schedule/TimelineView.tsx
interface TimelineProps {
  items: GanttItem[];
  view: 'weekly' | 'monthly';
  onItemClick: (item: GanttItem) => void;
}
```

#### 팀 협업 컴포넌트:
```typescript
// components/collaboration/CommentSection.tsx
interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  mentions: string[];
  attachments: Attachment[];
}

// components/collaboration/DecisionHistory.tsx
interface DecisionItem {
  id: string;
  action: string;
  timestamp: string;
  version: string;
  status: 'current' | 'previous';
}
```

### 12.8 구현 우선순위

#### Phase 1 (1-2주): 기본 레이아웃 및 대시보드
1. 기본 레이아웃 컴포넌트 구현
2. 대시보드 카드 컴포넌트
3. 진행률 차트 컴포넌트
4. 활동 피드 컴포넌트

#### Phase 2 (2-3주): 칸반 보드
1. 칸반 컬럼 컴포넌트
2. 태스크 카드 컴포넌트
3. 드래그 앤 드롭 기능
4. 태스크 CRUD 기능

#### Phase 3 (3-4주): 일정 관리
1. 타임라인 뷰 컴포넌트
2. 간트 차트 컴포넌트
3. 캘린더 뷰 컴포넌트
4. 일정 필터링 기능

#### Phase 4 (4-5주): 팀 협업
1. 댓글 시스템
2. 파일 첨부 기능
3. 멘션 기능
4. 의사결정 히스토리

이 청사진을 바탕으로 각 UI 컴포넌트와 기능을 구현해 나갈 수 있습니다.