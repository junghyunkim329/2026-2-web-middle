// lib/source.ts — CVE의 실제 소스 코드 저장소·취약 버전 태그를 OSV + Git 저장소 직접 조회로 확인하는 모듈
import { collections, type CveSourceResult, type SourceRepo } from '@/lib/mongodb'

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const MAX_REFS_BYTES = 20 * 1024 * 1024
const MAX_REPOS = 3

type OsvEvent = { introduced?: string; fixed?: string; last_affected?: string; limit?: string }

type OsvVuln = {
  id: string
  affected?: {
    versions?: string[]
    ranges?: { type?: string; repo?: string; events?: OsvEvent[] }[]
  }[]
}

const SHA_PATTERN = /^[0-9a-f]{40}$/

function unavailable(reason: string): CveSourceResult {
  return { status: 'unavailable', reason, osvId: null, repos: [], checkedAt: new Date().toISOString() }
}

function safeRepoUrl(raw: string) {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null
  if (/^[\d.]+$/.test(host) || host.includes(':')) return null
  url.hash = ''
  url.search = ''
  return url.toString().replace(/\/+$/, '')
}

function webUrl(repo: string) {
  return repo.replace(/\.git$/, '')
}

function commitUrl(repo: string, sha: string) {
  const base = webUrl(repo)
  const host = new URL(base).hostname
  if (host === 'github.com') return `${base}/commit/${sha}`
  if (host === 'gitlab.com') return `${base}/-/commit/${sha}`
  return null
}

async function fetchOsv(id: string): Promise<OsvVuln | null | 'error'> {
  try {
    const response = await fetch(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })
    if (response.status === 404) return null
    if (!response.ok) return 'error'
    return (await response.json()) as OsvVuln
  } catch (error) {
    console.error('OSV request failed:', error)
    return 'error'
  }
}

async function readLimited(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let total = 0
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_REFS_BYTES) {
      await reader.cancel()
      break
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

async function fetchTags(repo: string): Promise<Map<string, string> | null> {
  try {
    const response = await fetch(`${repo}/info/refs?service=git-upload-pack`, {
      headers: { 'User-Agent': 'git/2.45.0' },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
      redirect: 'follow',
    })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !type.includes('git-upload-pack-advertisement')) return null

    const raw = await readLimited(response)
    const tags = new Map<string, string>()
    for (const [, sha, ref] of raw.matchAll(/([0-9a-f]{40}) refs\/tags\/([^\0\n]+)/g)) {
      if (ref.endsWith('^{}')) tags.set(ref.slice(0, -3), sha)
      else if (!tags.has(ref)) tags.set(ref, sha)
    }
    return tags
  } catch (error) {
    console.warn(`Git refs request failed for ${repo}:`, error)
    return null
  }
}

function versionKey(tag: string) {
  const match = tag.match(/\d+(?:\.\d+)+/) ?? tag.match(/\d+/)
  const numbers = match ? match[0].split('.').map(Number) : []
  const prerelease = /(rc|beta|alpha|pre|dev|snapshot)/i.test(tag.slice(match ? (match.index ?? 0) : 0))
  return { numbers, prerelease }
}

function compareTags(a: string, b: string) {
  const ka = versionKey(a)
  const kb = versionKey(b)
  if (ka.prerelease !== kb.prerelease) return ka.prerelease ? -1 : 1
  for (let i = 0; i < Math.max(ka.numbers.length, kb.numbers.length); i++) {
    const diff = (ka.numbers[i] ?? 0) - (kb.numbers[i] ?? 0)
    if (diff !== 0) return diff
  }
  return a.localeCompare(b)
}

function sortTags(names: string[]) {
  return [...names].sort(compareTags)
}

type VerifyResult = { ok: true; repo: SourceRepo } | { ok: false; repo: string; why: 'unreachable' | 'no-tags' }

async function verifyRepo(repo: string, versions: string[], events: OsvEvent[]): Promise<VerifyResult> {
  const tags = await fetchTags(repo)
  if (!tags) return { ok: false, repo, why: 'unreachable' }

  const vulnerableTags = sortTags([...new Set(versions)].filter((v) => tags.has(v))).map((name) => ({
    name,
    commit: tags.get(name)!,
  }))
  if (vulnerableTags.length === 0) return { ok: false, repo, why: 'no-tags' }

  const pick = (key: keyof OsvEvent) =>
    [...new Set(events.map((e) => e[key]).filter((sha): sha is string => !!sha && SHA_PATTERN.test(sha)))].map(
      (sha) => ({ sha, url: commitUrl(repo, sha) }),
    )

  return {
    ok: true,
    repo: {
      repo,
      webUrl: webUrl(repo),
      vulnerableTags,
      recommendedTag: vulnerableTags[vulnerableTags.length - 1].name,
      introducedCommits: pick('introduced'),
      fixedCommits: pick('fixed'),
      lastAffectedCommits: pick('last_affected'),
    },
  }
}

async function resolveSource(id: string): Promise<CveSourceResult | null> {
  const osv = await fetchOsv(id)
  if (osv === 'error') return null
  if (!osv) return unavailable('오픈소스 취약점 DB(OSV)에 등록되지 않은 CVE입니다.')

  const candidates = new Map<string, { versions: string[]; events: OsvEvent[] }>()
  for (const affected of osv.affected ?? []) {
    for (const range of affected.ranges ?? []) {
      if (range.type !== 'GIT' || !range.repo) continue
      const repo = safeRepoUrl(range.repo)
      if (!repo) continue
      const entry = candidates.get(repo) ?? { versions: [], events: [] }
      entry.versions.push(...(affected.versions ?? []))
      entry.events.push(...(range.events ?? []))
      candidates.set(repo, entry)
    }
  }
  if (candidates.size === 0) {
    return { ...unavailable('OSV에 Git 저장소 정보가 없습니다.'), osvId: osv.id }
  }

  const checked = await Promise.all(
    [...candidates].slice(0, MAX_REPOS).map(([repo, c]) => verifyRepo(repo, c.versions, c.events)),
  )
  const repos = checked.flatMap((r) => (r.ok ? [r.repo] : []))
  if (repos.length === 0) {
    const noTags = checked.find((r): r is Extract<VerifyResult, { ok: false }> => !r.ok && r.why === 'no-tags')
    const reason = noTags
      ? `저장소(${webUrl(noTags.repo)})는 있지만, OSV에 적힌 취약 버전이 저장소의 실제 태그와 일치하지 않아 취약 버전을 정확히 특정할 수 없습니다.`
      : '저장소에 접근할 수 없습니다. 비공개로 바뀌었거나 삭제되었을 수 있습니다.'
    return { ...unavailable(reason), osvId: osv.id }
  }
  return { status: 'confirmed', reason: null, osvId: osv.id, repos, checkedAt: new Date().toISOString() }
}

export async function getCveSource(cveId: string): Promise<CveSourceResult> {
  try {
    const { cveSources } = await collections()
    const cached = await cveSources.findOne({ cveId })
    if (cached && cached.expiresAt.getTime() > Date.now()) return cached.result
  } catch (error) {
    console.warn('Source cache read skipped:', error)
  }

  const result = await resolveSource(cveId)
  if (!result) return unavailable('소스 코드 정보를 확인하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')

  try {
    const { cveSources } = await collections()
    const checkedAt = new Date()
    await cveSources.updateOne(
      { cveId },
      { $set: { result, checkedAt, expiresAt: new Date(checkedAt.getTime() + CACHE_TTL_MS) } },
      { upsert: true },
    )
  } catch (error) {
    console.warn('Source cache write skipped:', error)
  }
  return result
}
