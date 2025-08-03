# PMS System - 프로젝트 관리 시스템

현대적이고 반응형 디자인을 갖춘 프로젝트 관리 시스템입니다.

## 🚀 주요 기능

### 📱 반응형 사이드바
- **데스크톱**: 접기/펼치기 기능이 있는 고정 사이드바
- **모바일**: 오버레이 방식의 슬라이드 사이드바
- **자동 감지**: 화면 크기에 따른 자동 레이아웃 전환
- **부드러운 애니메이션**: CSS 트랜지션을 활용한 자연스러운 전환

### 🎨 현대적인 UI/UX
- **글래스모피즘**: 반투명 효과와 블러 처리
- **그라디언트**: 아름다운 색상 그라디언트
- **호버 효과**: 마우스 오버 시 부드러운 애니메이션
- **카드 디자인**: 현대적인 카드 레이아웃

### 🔐 인증 및 권한 관리
- **NextAuth.js**: 안전한 인증 시스템
- **역할 기반 접근 제어**: 사용자 역할에 따른 페이지 접근 권한
- **미들웨어**: 서버 사이드 라우트 보호

### 📊 프로젝트 관리
- **대시보드**: 프로젝트 현황 한눈에 보기
- **프로젝트 목록**: 필터링 및 검색 기능
- **작업 관리**: 칸반 보드 스타일 작업 관리
- **고객사 관리**: 고객 정보 및 연락처 관리

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **UI Components**: Radix UI, Lucide Icons
- **Authentication**: NextAuth.js
- **Database**: Prisma ORM
- **State Management**: React Query (TanStack Query)

## 📱 반응형 디자인

### 데스크톱 (1024px 이상)
- 고정 사이드바 (기본 너비: 256px)
- 사이드바 접기/펼치기 버튼
- 접힌 상태에서는 아이콘만 표시 (너비: 64px)

### 태블릿 (768px - 1023px)
- 모바일과 동일한 오버레이 사이드바
- 터치 친화적인 인터페이스

### 모바일 (767px 이하)
- 햄버거 메뉴 버튼
- 전체 화면 오버레이 사이드바
- 스와이프 제스처 지원

## 🎯 사이드바 기능

### 네비게이션 메뉴
- 대시보드
- 프로젝트 관리
- 작업 관리
- 고객사 관리
- 사용자 관리
- 보고서
- 설정

### 사용자 정보
- 프로필 아바타
- 사용자 이름 및 역할
- 로그아웃 버튼

### 반응형 동작
- 화면 크기 자동 감지
- 부드러운 전환 애니메이션
- 터치 및 마우스 이벤트 지원

## 🚀 시작하기

### 설치
```bash
npm install
# 또는
yarn install
```

### 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

### 빌드
```bash
npm run build
# 또는
yarn build
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── dashboard/         # 대시보드 페이지
│   ├── projects/          # 프로젝트 관리 페이지
│   ├── tasks/             # 작업 관리 페이지
│   ├── clients/           # 고객사 관리 페이지
│   └── login/             # 로그인 페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   │   ├── MainLayout.tsx # 메인 레이아웃 (사이드바 포함)
│   │   ├── Sidebar.tsx   # 반응형 사이드바
│   │   └── Header.tsx    # 헤더 컴포넌트
│   └── ui/               # UI 컴포넌트
├── styles/               # 스타일 파일
│   └── globals.css       # 글로벌 CSS (반응형 스타일 포함)
└── lib/                  # 유틸리티 함수
```

## 🎨 스타일 가이드

### 색상 팔레트
- **Primary**: Blue (#3B82F6) to Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Gray Scale**: Gray (#6B7280 - #F9FAFB)

### 애니메이션
- **Duration**: 200ms - 300ms
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Hover Effects**: translateY(-4px), scale(1.02)

### 반응형 브레이크포인트
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## 🔧 커스터마이징

### 사이드바 메뉴 추가
`src/components/layout/Sidebar.tsx`에서 `navigation` 배열에 새 메뉴 항목을 추가하세요:

```typescript
const navigation = [
  { name: '새 메뉴', href: '/new-menu', icon: NewIcon },
  // ... 기존 메뉴들
]
```

### 스타일 커스터마이징
`src/app/globals.css`에서 CSS 변수와 유틸리티 클래스를 수정하여 디자인을 커스터마이징할 수 있습니다.

## 📱 모바일 최적화

- **터치 친화적**: 44px 이상의 터치 타겟
- **스와이프 제스처**: 사이드바 열기/닫기
- **성능 최적화**: 레이지 로딩 및 코드 스플리팅
- **접근성**: ARIA 레이블 및 키보드 네비게이션

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.