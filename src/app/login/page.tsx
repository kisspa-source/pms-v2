'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Building2, Shield, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading' || isRedirecting) return

    if (session) {
      setIsRedirecting(true)
      // callbackUrl이 있으면 해당 URL로, 없으면 대시보드로
      const callbackUrl = searchParams.get('callbackUrl')
      const redirectUrl = callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/dashboard'
      router.push(redirectUrl)
    }
  }, [session, status, router, searchParams, isRedirecting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (isSignUp) {
      // 회원가입 처리
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.')
        setIsLoading(false)
        return
      }

      if (password.length < 8) {
        setError('비밀번호는 최소 8자 이상이어야 합니다.')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        })

        if (response.ok) {
          setSuccess('회원가입이 완료되었습니다. 로그인해주세요.')
          setIsSignUp(false)
          setName('')
          setPassword('')
          setConfirmPassword('')
        } else {
          const data = await response.json()
          setError(data.error || '회원가입 중 오류가 발생했습니다.')
        }
      } catch (error) {
        setError('회원가입 중 오류가 발생했습니다.')
      }
    } else {
      // 로그인 처리
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else {
          // 로그인 성공 시 callbackUrl 또는 대시보드로 리디렉트
          const callbackUrl = searchParams.get('callbackUrl')
          const redirectUrl = callbackUrl && callbackUrl !== '/login' ? callbackUrl : '/dashboard'
          router.push(redirectUrl)
        }
      } catch (error) {
        setError('로그인 중 오류가 발생했습니다.')
      }
    }
    
    setIsLoading(false)
  }

  // 이미 인증된 사용자가 로그인 페이지에 접근한 경우 로딩 표시
  if (status === 'loading' || (session && isRedirecting)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">리디렉션 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">PMS System</h1>
          <p className="text-gray-600 text-lg">
            {isSignUp ? '새 계정을 만들어 시작하세요' : '프로젝트 관리 시스템에 로그인하세요'}
          </p>
        </div>

        {/* 로그인/회원가입 카드 */}
        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              {isSignUp ? '회원가입' : '로그인'}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {isSignUp ? '새 계정을 만들어 시작하세요' : '계정 정보를 입력하여 로그인하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    이름
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  이메일
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isSignUp ? "your@email.com" : "admin@pms.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? "최소 8자 이상" : "admin123"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    비밀번호 확인
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
                  <UserPlus className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{success}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isSignUp ? '가입 중...' : '로그인 중...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="mr-2 h-5 w-5" />
                        회원가입
                      </>
                    ) : (
                      '로그인'
                    )}
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                    setSuccess('')
                    setName('')
                    setEmail('')
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 PMS System. 모든 권리 보유.</p>
        </div>
      </div>
    </div>
  )
} 