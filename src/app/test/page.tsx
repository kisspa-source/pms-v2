'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import MainLayout from '@/components/layout/MainLayout'

export default function TestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }
  return (
    <MainLayout>
      <div className="container mx-auto p-8 space-y-8">
        <h1 className="text-3xl font-bold">shadcn/ui 테스트 페이지</h1>
      
      {/* Button 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>Button 컴포넌트</CardTitle>
          <CardDescription>다양한 버튼 스타일을 확인해보세요</CardDescription>
        </CardHeader>
        <CardContent className="space-x-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </CardContent>
      </Card>

      {/* Input 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>Input 컴포넌트</CardTitle>
          <CardDescription>입력 필드 스타일을 확인해보세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input type="email" id="email" placeholder="이메일을 입력하세요" />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input type="password" id="password" placeholder="비밀번호를 입력하세요" />
          </div>
        </CardContent>
      </Card>

      {/* Card 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>Card 컴포넌트</CardTitle>
          <CardDescription>카드 레이아웃을 확인해보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <p>이것은 카드의 내용입니다. shadcn/ui의 Card 컴포넌트가 제대로 작동하고 있습니다.</p>
        </CardContent>
        <CardFooter>
          <Button>확인</Button>
        </CardFooter>
      </Card>
      </div>
    </MainLayout>
  )
} 