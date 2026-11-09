// app/learn/[cwe]/cwe-reference.tsx — 준비된 학습 콘텐츠가 없는 CWE를 MITRE 공식 데이터로 보여주는 학습 화면
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, BookOpen, Code2, ExternalLink, ShieldCheck, Target } from 'lucide-react'
import { getMitreCwe, type CweExampleBlock } from '@/lib/cwe'
import { cn } from '@/lib/utils'

const MAX_EXAMPLES = 2
const MAX_MITIGATIONS = 6
const MAX_OBSERVED = 6

export async function CweReferenceView({ id, fromCve }: { id: string; fromCve?: string }) {
  const cwe = await getMitreCwe(id)
  if (cwe === null) notFound()

  const backCve = fromCve && /^CVE-\d{4}-\d{4,}$/i.test(fromCve) ? fromCve.toUpperCase() : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={backCve ? `/cves/${backCve}` : '/learn'}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> {backCve ? `${backCve}로 돌아가기` : '학습 목록'}
      </Link>

      {cwe === 'error' ? (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          MITRE에서 {id.toUpperCase()} 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl font-bold text-accent text-glow">{cwe.id}</span>
              {cwe.abstraction && (
                <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {cwe.abstraction}
                </span>
              )}
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                MITRE CWE 공식 자료
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-foreground">{cwe.name}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cwe.description}</p>
            {cwe.extendedDescription && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cwe.extendedDescription}</p>
            )}
            {backCve && (
              <p className="mt-4 font-mono text-xs text-primary">{backCve}의 약점 유형입니다.</p>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="min-w-0 space-y-8">
              {cwe.consequences.length > 0 && (
                <Block icon={<AlertTriangle className="size-4 text-primary" />} title="발생 시 영향">
                  <ul className="space-y-2">
                    {cwe.consequences.map((c, i) => (
                      <li key={i} className="rounded-lg border border-border bg-card px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {c.scope.map((s) => (
                            <span key={s} className="rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-foreground">{c.impact.join(' · ')}</p>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              {cwe.examples.length > 0 && (
                <Block icon={<Code2 className="size-4 text-primary" />} title="취약 코드 예시">
                  <div className="space-y-4">
                    {cwe.examples.slice(0, MAX_EXAMPLES).map((blocks, i) => (
                      <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-5">
                        {blocks.map((block, j) => (
                          <ExampleBlock key={j} block={block} />
                        ))}
                      </div>
                    ))}
                  </div>
                </Block>
              )}

              {cwe.mitigations.length > 0 && (
                <Block icon={<ShieldCheck className="size-4 text-primary" />} title="대응 방법">
                  <ol className="space-y-2">
                    {cwe.mitigations.slice(0, MAX_MITIGATIONS).map((m, i) => (
                      <li key={i} className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{`0${i + 1}`.slice(-2)}</span>
                        <div className="min-w-0">
                          {m.phase.length > 0 && (
                            <p className="font-mono text-[11px] text-primary">{m.phase.join(' · ')}</p>
                          )}
                          <p className="mt-1 text-sm leading-relaxed text-foreground">{m.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Block>
              )}
            </div>

            <aside className="space-y-4">
              {cwe.observed.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <Target className="size-3.5" /> 실제 CVE 사례
                  </p>
                  <ul className="mt-3 space-y-3">
                    {cwe.observed.slice(0, MAX_OBSERVED).map((o) => (
                      <li key={o.cveId}>
                        <Link href={`/cves/${o.cveId}`} className="font-mono text-xs font-bold text-accent hover:underline">
                          {o.cveId}
                        </Link>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{o.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href={cwe.mitreUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <ExternalLink className="size-4" /> MITRE 원문 보기
              </a>
              <Link
                href="/learn"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <BookOpen className="size-4" /> 다른 약점 학습하기
              </Link>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
        {icon} {title}
      </h2>
      {children}
    </section>
  )
}

function ExampleBlock({ block }: { block: CweExampleBlock }) {
  if (block.kind === 'text') {
    return <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p>
  }
  const label = { bad: '취약한 코드', good: '안전한 코드', other: '예제 코드' }[block.nature]
  return (
    <div>
      <p
        className={cn(
          'font-mono text-[11px] font-semibold',
          block.nature === 'bad' ? 'text-destructive' : block.nature === 'good' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
        {block.language ? ` · ${block.language}` : ''}
      </p>
      <pre
        className={cn(
          'mt-1.5 overflow-x-auto rounded-lg border bg-background px-4 py-3 font-mono text-xs leading-relaxed text-foreground',
          block.nature === 'bad' ? 'border-destructive/40' : block.nature === 'good' ? 'border-primary/40' : 'border-border',
        )}
      >
        {block.code}
      </pre>
    </div>
  )
}
