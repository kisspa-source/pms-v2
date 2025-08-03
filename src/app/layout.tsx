import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NextAuthProvider } from '@/components/providers/NextAuthProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PMS System',
  description: 'Project Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        <NextAuthProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
} 