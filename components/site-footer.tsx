import Link from 'next/link'
import { Shield } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md border border-primary/50 bg-primary/10 text-primary">
              <Shield className="size-4" />
            </span>
            <span className="font-mono text-base font-bold text-primary">CVEHUB</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            AI 기반 CVE 검색·분석과 CWE 취약점 학습을 위한 보안 실습 플랫폼. 와이어프레임 데모.
          </p>
        </div>

        <FooterCol
          title="탐색"
          links={[
            { href: '/', label: 'CVE 검색' },
            { href: '/compare', label: 'CVE 비교' },
            { href: '/learn', label: '취약점 학습' },
            { href: '/lab', label: '실습 랩' },
          ]}
        />
        <FooterCol
          title="커뮤니티"
          links={[
            { href: '/qna', label: '질의응답' },
            { href: '/mypage', label: '마이페이지' },
            { href: '/login', label: '로그인' },
            { href: '/signup', label: '회원가입' },
          ]}
        />
        <FooterCol
          title="데이터 출처"
          links={[
            { href: '#', label: 'NVD' },
            { href: '#', label: 'CISA KEV' },
            { href: '#', label: 'FIRST EPSS' },
            { href: '#', label: 'MITRE CWE' },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p className="font-mono">© 2026 CVEHUB · 학습용 데모</p>
          <p>데이터는 예시이며 실제 취약점 정보와 다를 수 있습니다.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
