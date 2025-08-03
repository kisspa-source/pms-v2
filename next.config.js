/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // HTTP 헤더 크기 제한 증가 (431 에러 해결)
  serverRuntimeConfig: {
    maxHeaderSize: 32768, // 32KB로 증가
  },
  // 서버 외부 패키지 설정
  serverExternalPackages: ['@prisma/client'],
  // NextAuth.js와의 호환성을 위한 설정
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      })
    }
    return config
  },
}

module.exports = nextConfig 