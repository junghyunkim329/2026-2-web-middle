// app/cves/[id]/source-section.tsx — CVE 상세 페이지의 "실습용 소스 코드" 영역 (확인된 저장소·취약 태그·패치 커밋 표시)
import { CheckCircle2, ExternalLink, GitBranch, GitCommitHorizontal, XCircle } from 'lucide-react'
import { getCveSource } from '@/lib/source'
import type { SourceCommit, SourceRepo } from '@/lib/mongodb'
import { CopyButton } from './copy-button'

const MAX_TAGS = 12

export async function SourceSection({ cveId }: { cveId: string }) {
  const source = await getCveSource(cveId)

  if (source.status !== 'confirmed') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
        <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">실습용 소스 코드를 확인할 수 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">{source.reason}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary">
          <CheckCircle2 className="size-3.5" /> 오픈소스 · 소스 코드 확인됨
        </span>
        <span>
          출처 OSV {source.osvId} · 저장소 태그 직접 확인 · {source.checkedAt.slice(0, 10)}
        </span>
      </div>
      {source.repos.map((repo) => (
        <RepoCard key={repo.repo} repo={repo} />
      ))}
    </div>
  )
}

function RepoCard({ repo }: { repo: SourceRepo }) {
  const folder = repo.webUrl.split('/').pop() ?? 'repo'
  const command = `git clone ${repo.repo}\ncd ${folder}\ngit checkout ${repo.recommendedTag}`
  const shownTags = repo.vulnerableTags.slice(-MAX_TAGS).reverse()
  const hiddenCount = repo.vulnerableTags.length - shownTags.length

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <a
        href={repo.webUrl}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-2 border-b border-border px-5 py-3 font-mono text-sm text-foreground transition-colors hover:text-primary"
      >
        <GitBranch className="size-4 text-primary" />
        <span className="truncate">{repo.webUrl.replace(/^https:\/\//, '')}</span>
        <ExternalLink className="ml-auto size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
      </a>

      <div className="space-y-5 p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">취약 버전 받기 (최신 취약 태그 기준)</p>
            <CopyButton text={command} />
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs leading-relaxed text-primary">
            {command}
          </pre>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            저장소에서 확인된 취약 태그 {repo.vulnerableTags.length}개
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shownTags.map((tag) => (
              <span
                key={tag.name}
                title={`commit ${tag.commit}`}
                className="rounded border border-destructive/40 bg-destructive/10 px-2 py-0.5 font-mono text-[11px] text-destructive"
              >
                {tag.name}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="px-1 py-0.5 font-mono text-[11px] text-muted-foreground">외 {hiddenCount}개</span>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <CommitList title="취약점 도입 커밋" commits={repo.introducedCommits} />
          <CommitList
            title={repo.fixedCommits.length > 0 ? '패치 커밋' : '마지막 취약 커밋'}
            commits={repo.fixedCommits.length > 0 ? repo.fixedCommits : repo.lastAffectedCommits}
          />
        </div>
      </div>
    </div>
  )
}

function CommitList({ title, commits }: { title: string; commits: SourceCommit[] }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      {commits.length === 0 ? (
        <p className="mt-1 font-mono text-xs text-muted-foreground">정보 없음</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {commits.map((c) => (
            <li key={c.sha} className="flex items-center gap-1.5 font-mono text-xs">
              <GitCommitHorizontal className="size-3.5 shrink-0 text-muted-foreground" />
              {c.url ? (
                <a href={c.url} target="_blank" rel="noreferrer" className="text-foreground hover:text-primary hover:underline">
                  {c.sha.slice(0, 12)}
                </a>
              ) : (
                <span title={c.sha} className="text-foreground">
                  {c.sha.slice(0, 12)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SourceSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="h-4 w-48 rounded bg-secondary" />
      <div className="mt-4 h-16 rounded bg-secondary" />
      <p className="mt-3 text-xs text-muted-foreground">OSV와 Git 저장소에서 소스 코드를 확인하는 중…</p>
    </div>
  )
}
