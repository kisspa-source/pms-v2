'use client'

import { SessionProvider } from 'next-auth/react'

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5분마다 세션 갱신
      refetchOnWindowFocus={true} // 윈도우 포커스 시 세션 갱신
    >
      {children}
    </SessionProvider>
  )
} 