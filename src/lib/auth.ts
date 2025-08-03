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
          where: { email: credentials.email },
          include: {
            organization_members: {
              include: {
                organization: true
              }
            }
          }
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
          organizationId: user.organization_members[0]?.organization_id || null,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // 로그인 페이지로의 리디렉션 방지
      if (url.startsWith('/login')) {
        return `${baseUrl}/dashboard`
      }
      // 상대 URL인 경우 baseUrl 추가
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // 외부 URL인 경우 baseUrl과 같은 도메인인지 확인
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    }
  },
  pages: {
    signIn: "/login",
    error: "/login", // 에러 페이지도 로그인으로
  },
  secret: process.env.NEXTAUTH_SECRET,
} 