export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type Cve = {
  id: string
  title: string
  summary: string
  severity: Severity
  cvss: number
  cvssVector: string
  epss: number // 0..1
  kev: boolean
  exploitPublic: boolean
  patched: boolean
  cwe: string
  cweName: string
  vendor: string
  products: string[]
  published: string
  updated: string
}

export const CVES: Cve[] = [
  {
    id: 'CVE-2024-3094',
    title: 'XZ Utils 백도어 (공급망 공격)',
    summary:
      'xz/liblzma 5.6.0~5.6.1에 삽입된 악성 코드로 인해 특정 조건에서 SSH 인증을 우회하고 원격 코드 실행이 가능한 공급망 백도어.',
    severity: 'CRITICAL',
    cvss: 10.0,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
    epss: 0.94,
    kev: true,
    exploitPublic: true,
    patched: true,
    cwe: 'CWE-506',
    cweName: 'Embedded Malicious Code',
    vendor: 'XZ Project',
    products: ['xz-utils 5.6.0', 'xz-utils 5.6.1', 'liblzma'],
    published: '2024-03-29',
    updated: '2024-04-02',
  },
  {
    id: 'CVE-2021-44228',
    title: 'Log4Shell — Apache Log4j2 원격 코드 실행',
    summary:
      'JNDI lookup 기능을 악용해 신뢰할 수 없는 LDAP 서버에서 클래스를 로드, 원격 코드 실행이 가능한 치명적 취약점.',
    severity: 'CRITICAL',
    cvss: 10.0,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
    epss: 0.97,
    kev: true,
    exploitPublic: true,
    patched: true,
    cwe: 'CWE-502',
    cweName: 'Deserialization of Untrusted Data',
    vendor: 'Apache',
    products: ['Log4j2 2.0-beta9 ~ 2.14.1'],
    published: '2021-12-10',
    updated: '2021-12-20',
  },
  {
    id: 'CVE-2023-4863',
    title: 'libwebp 힙 버퍼 오버플로우',
    summary:
      'WebP 이미지 처리 시 힙 버퍼 오버플로우가 발생하여 조작된 이미지로 원격 코드 실행이 가능. 다수 브라우저에 영향.',
    severity: 'CRITICAL',
    cvss: 9.6,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H',
    epss: 0.62,
    kev: true,
    exploitPublic: true,
    patched: true,
    cwe: 'CWE-787',
    cweName: 'Out-of-bounds Write',
    vendor: 'Google',
    products: ['libwebp < 1.3.2', 'Chrome', 'Firefox'],
    published: '2023-09-12',
    updated: '2023-09-27',
  },
  {
    id: 'CVE-2022-22965',
    title: 'Spring4Shell — Spring Framework RCE',
    summary:
      'JDK 9+ 환경에서 데이터 바인딩을 통해 클래스 로더를 조작, 원격 코드 실행이 가능한 취약점.',
    severity: 'HIGH',
    cvss: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    epss: 0.88,
    kev: true,
    exploitPublic: true,
    patched: true,
    cwe: 'CWE-94',
    cweName: 'Code Injection',
    vendor: 'VMware',
    products: ['Spring Framework < 5.3.18', 'Spring Framework < 5.2.20'],
    published: '2022-03-31',
    updated: '2022-04-15',
  },
  {
    id: 'CVE-2023-34362',
    title: 'MOVEit Transfer SQL 인젝션',
    summary:
      'Progress MOVEit Transfer 웹 애플리케이션의 SQL 인젝션으로 인해 인증되지 않은 공격자가 DB에 접근 가능. Cl0p 랜섬웨어 캠페인에 악용.',
    severity: 'CRITICAL',
    cvss: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    epss: 0.91,
    kev: true,
    exploitPublic: true,
    patched: true,
    cwe: 'CWE-89',
    cweName: 'SQL Injection',
    vendor: 'Progress',
    products: ['MOVEit Transfer'],
    published: '2023-06-02',
    updated: '2023-06-09',
  },
  {
    id: 'CVE-2024-21413',
    title: 'Microsoft Outlook 원격 코드 실행',
    summary:
      'Outlook의 조작된 링크 처리 과정에서 Office 보호 뷰를 우회하여 원격 코드 실행이 가능.',
    severity: 'HIGH',
    cvss: 9.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    epss: 0.34,
    kev: false,
    exploitPublic: true,
    patched: true,
    cwe: 'CWE-20',
    cweName: 'Improper Input Validation',
    vendor: 'Microsoft',
    products: ['Outlook 2016', 'Microsoft 365 Apps'],
    published: '2024-02-13',
    updated: '2024-02-20',
  },
  {
    id: 'CVE-2023-38831',
    title: 'WinRAR 확장자 스푸핑 코드 실행',
    summary:
      '조작된 아카이브 내 폴더/파일 이름 처리 오류로 사용자가 문서를 열 때 임의 코드가 실행됨.',
    severity: 'HIGH',
    cvss: 7.8,
    cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H',
    epss: 0.45,
    kev: true,
    exploitPublic: true,
    patched: false,
    cwe: 'CWE-345',
    cweName: 'Insufficient Verification of Data Authenticity',
    vendor: 'RARLAB',
    products: ['WinRAR < 6.23'],
    published: '2023-08-23',
    updated: '2023-09-01',
  },
  {
    id: 'CVE-2022-0847',
    title: 'Dirty Pipe — Linux 커널 권한 상승',
    summary:
      '파이프 버퍼 관리 결함으로 읽기 전용 파일을 덮어써 로컬 권한 상승이 가능한 리눅스 커널 취약점.',
    severity: 'HIGH',
    cvss: 7.8,
    cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
    epss: 0.12,
    kev: false,
    exploitPublic: true,
    patched: true,
    cwe: 'CWE-269',
    cweName: 'Improper Privilege Management',
    vendor: 'Linux',
    products: ['Linux Kernel 5.8 ~ 5.16.11'],
    published: '2022-03-07',
    updated: '2022-03-14',
  },
]

export function getCve(id: string) {
  return CVES.find((c) => c.id.toLowerCase() === id.toLowerCase())
}

export const severityMeta: Record<Severity, { label: string; token: string }> =
  {
    CRITICAL: {
      label: 'CRITICAL',
      token: 'text-destructive border-destructive/50 bg-destructive/10',
    },
    HIGH: {
      label: 'HIGH',
      token: 'text-warning border-warning/50 bg-warning/10',
    },
    MEDIUM: {
      label: 'MEDIUM',
      token: 'text-accent border-accent/50 bg-accent/10',
    },
    LOW: {
      label: 'LOW',
      token: 'text-primary border-primary/50 bg-primary/10',
    },
  }

export type Cwe = {
  id: string
  name: string
  category: string
  description: string
  difficulty: '입문' | '중급' | '고급'
  lessons: number
  labs: number
  relatedCves: string[]
}

export const CWES: Cwe[] = [
  {
    id: 'CWE-89',
    name: 'SQL Injection',
    category: '인젝션',
    description:
      '신뢰할 수 없는 입력이 SQL 쿼리에 그대로 포함되어 데이터 유출·변조·인증 우회로 이어지는 취약점.',
    difficulty: '입문',
    lessons: 6,
    labs: 4,
    relatedCves: ['CVE-2023-34362'],
  },
  {
    id: 'CWE-79',
    name: 'Cross-site Scripting (XSS)',
    category: '인젝션',
    description:
      '악성 스크립트가 웹 페이지에 삽입되어 다른 사용자의 브라우저에서 실행되는 취약점.',
    difficulty: '입문',
    lessons: 5,
    labs: 3,
    relatedCves: [],
  },
  {
    id: 'CWE-502',
    name: 'Deserialization of Untrusted Data',
    category: '데이터 처리',
    description:
      '신뢰할 수 없는 직렬화 데이터를 역직렬화하며 객체 조작·원격 코드 실행이 발생하는 취약점.',
    difficulty: '고급',
    lessons: 4,
    labs: 2,
    relatedCves: ['CVE-2021-44228'],
  },
  {
    id: 'CWE-787',
    name: 'Out-of-bounds Write',
    category: '메모리 안전',
    description:
      '버퍼 경계를 벗어난 쓰기로 메모리 손상·코드 실행이 가능한 대표적인 메모리 안전 취약점.',
    difficulty: '고급',
    lessons: 7,
    labs: 5,
    relatedCves: ['CVE-2023-4863'],
  },
  {
    id: 'CWE-94',
    name: 'Code Injection',
    category: '인젝션',
    description:
      '외부 입력이 코드로 해석·실행되어 임의 명령이 수행되는 취약점.',
    difficulty: '중급',
    lessons: 5,
    labs: 3,
    relatedCves: ['CVE-2022-22965'],
  },
  {
    id: 'CWE-269',
    name: 'Improper Privilege Management',
    category: '권한 관리',
    description: '권한 부여·검증이 부적절해 권한 상승으로 이어지는 취약점.',
    difficulty: '중급',
    lessons: 4,
    labs: 3,
    relatedCves: ['CVE-2022-0847'],
  },
]

export function getCwe(id: string) {
  return CWES.find((c) => c.id.toLowerCase() === id.toLowerCase())
}
