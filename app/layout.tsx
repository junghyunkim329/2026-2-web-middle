import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'CVEHUB — CVE 학습 및 분석 플랫폼',
  description:
    'AI 기반 CVE 검색·분석, CWE 취약점 학습, 실습, 원데이 리포트, 질의응답을 제공하는 보안 학습 플랫폼',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0d0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="bg-background">
      <body className="antialiased font-sans flex min-h-dvh flex-col">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
