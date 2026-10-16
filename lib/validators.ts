// 서버(API)와 브라우저(폼) 양쪽에서 함께 쓰는 입력값 검증 함수.
// 서버 쪽 검증이 진짜 방어선이고, 브라우저 쪽은 사용자 편의를 위한 것이다.

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const LIMITS = {
  emailMax: 254,
  passwordMin: 10,
  passwordMax: 128,
  questionTitleMax: 150,
  questionBodyMax: 5000,
  answerBodyMax: 5000,
  reportTitleMax: 100,
  reportContentMax: 20000,
  searchMax: 100,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+$/;
const NICKNAME_RE = /^[가-힣a-zA-Z0-9_]{2,20}$/;
const CVE_ID_RE = /^CVE-\d{4}-\d{4,7}$/;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

// 값이 문자열이 아닐 때 바로 거절한다.
// {"$ne": null} 같은 객체가 들어와 MongoDB 쿼리 연산자로 해석되는 NoSQL 인젝션을 막는다.
export function requireText(
  value: unknown,
  label: string,
  { min = 1, max }: { min?: number; max: number },
): string {
  if (typeof value !== 'string')
    throw new HttpError(400, `${label}을(를) 입력해주세요.`);
  const text = value.trim();
  if (text.length < min) {
    throw new HttpError(
      400,
      min <= 1
        ? `${label}을(를) 입력해주세요.`
        : `${label}은(는) ${min}자 이상이어야 합니다.`,
    );
  }
  if (text.length > max)
    throw new HttpError(400, `${label}은(는) ${max}자 이하여야 합니다.`);
  return text;
}

export function validateEmail(value: unknown): string {
  const email = requireText(value, '이메일', {
    max: LIMITS.emailMax,
  }).toLowerCase();
  if (!EMAIL_RE.test(email))
    throw new HttpError(400, '이메일 형식이 올바르지 않습니다.');
  return email;
}

export function nicknameError(nickname: string): string | null {
  return NICKNAME_RE.test(nickname)
    ? null
    : '닉네임은 한글·영문·숫자·밑줄(_)로 2~20자여야 합니다.';
}

export function validateNickname(value: unknown): string {
  const nickname = requireText(value, '닉네임', { max: 20 });
  const error = nicknameError(nickname);
  if (error) throw new HttpError(400, error);
  return nickname;
}

export function passwordError(password: string): string | null {
  if (
    password.length < LIMITS.passwordMin ||
    password.length > LIMITS.passwordMax
  ) {
    return `비밀번호는 ${LIMITS.passwordMin}~${LIMITS.passwordMax}자여야 합니다.`;
  }
  if (
    !/[a-zA-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[^a-zA-Z0-9]/.test(password)
  ) {
    return '비밀번호에 영문, 숫자, 특수문자를 모두 포함해주세요.';
  }
  return null;
}

export function validatePassword(value: unknown): string {
  // 비밀번호는 공백도 의미가 있으므로 trim 하지 않는다.
  if (typeof value !== 'string')
    throw new HttpError(400, '비밀번호를 입력해주세요.');
  const error = passwordError(value);
  if (error) throw new HttpError(400, error);
  return value;
}

export function normalizeCveId(value: string): string | null {
  const id = value.trim().toUpperCase();
  return CVE_ID_RE.test(id) ? id : null;
}

export function validateCveId(value: unknown): string {
  const id = typeof value === 'string' ? normalizeCveId(value) : null;
  if (!id)
    throw new HttpError(
      400,
      'CVE ID 형식이 올바르지 않습니다. (예: CVE-2024-3094)',
    );
  return id;
}

export function isObjectIdString(value: unknown): value is string {
  return typeof value === 'string' && OBJECT_ID_RE.test(value);
}

// 사용자가 입력한 검색어를 정규식에 그대로 넣으면 정규식 인젝션/ReDoS가 생길 수 있어
// 특수문자를 모두 이스케이프한다.
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 로그인 후 이동할 주소(next)는 우리 사이트 내부 경로만 허용한다. (오픈 리다이렉트 방지)
export function safeNextPath(value: unknown, fallback = '/mypage'): string {
  if (typeof value !== 'string') return fallback;
  // 브라우저는 주소 안의 탭·줄바꿈을 지우고 \를 /로 바꾸기 때문에 이런 문자가 있으면 거절한다.
  if (/[\u0000-\u001f\\]/.test(value)) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

// 리포트 작성·수정 API가 함께 쓰는 입력값 검증
export function readReportInput(body: Record<string, unknown>) {
  const title = requireText(body.title, '제목', {
    min: 2,
    max: LIMITS.reportTitleMax,
  });
  const content = requireText(body.content, '내용', {
    min: 10,
    max: LIMITS.reportContentMax,
  });
  // CVE ID는 선택 입력. 비어 있으면 null로 저장한다.
  const rawCve = typeof body.cveId === 'string' ? body.cveId.trim() : '';
  const cveId = rawCve ? validateCveId(rawCve) : null;
  return { title, content, cveId };
}
