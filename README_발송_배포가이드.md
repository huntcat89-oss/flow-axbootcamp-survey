# 슈퍼100 AX 사전진단 질의서 — 이메일(PDF 첨부) 발송 배포 가이드 (GitHub + Netlify)

브라우저에서 **PDF를 생성해 이메일로 실제 발송**하려면 서버리스 함수가 하나 필요합니다.
GitHub 저장소를 **Netlify**에 연결하면, 폼(HTML)과 발송 함수를 한 사이트에서 함께 호스팅할 수 있습니다.
(Web3Forms 무료 플랜은 파일 첨부 불가 → Resend + Netlify Functions 구성. 무료.)

## 구성

```
사이트(HTML 폼)  ── 같은 Netlify 사이트 ──  /api/send (Netlify Function)
   │  ① 작성 내용으로 PDF 생성 → base64                         │
   │  ② POST(JSON) { subject, message, company, date, filename, pdfBase64 }
   └───────────────────────────────────────────────────────────┘
                                              │ ③ Resend API 호출(PDF 첨부)
                                              ▼
                                    Resend → byeongkyo@flow.team
                                            (운영 시 smbu@flow.team)
```

## 저장소 구조

```
├─ index.html                       # 폼 (사이트 첫 화면)
├─ netlify.toml                     # publish/functions/redirect 설정
└─ netlify/
   └─ functions/
      └─ send.js                    # 발송 함수 (Resend)
```

## 1. Resend 준비 (무료)

1. https://resend.com 가입 (테스트라면 **byeongkyo@flow.team**으로 가입해야 테스트 수신 가능)
2. **API Keys → Create API Key** → `re_...` 복사
3. (운영) **Domains**에서 `flow.team` 인증 → `noreply@flow.team` 발신 가능
   - 테스트만 할 땐 발신 `onboarding@resend.dev` → **가입한 본인 메일로만** 수신됨

## 2. GitHub → Netlify 연결

1. 이 폴더를 GitHub 저장소로 push
2. Netlify → **Add new site → Import an existing project → GitHub** → 저장소 선택
3. 빌드 설정은 비워도 됨(`netlify.toml`이 자동 적용). Deploy
4. **Site settings → Environment variables** 등록 후 재배포
   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | `re_...` |
   | `MAIL_TO` | `byeongkyo@flow.team` (운영 시 `smbu@flow.team`) |
   | `MAIL_FROM` | `onboarding@resend.dev` (도메인 인증 후 `noreply@flow.team`) |

## 3. 확인

- 폼 주소: `https://<사이트>.netlify.app/` (index.html 자동 제공)
- 발송 함수: `https://<사이트>.netlify.app/api/send` (redirect) 또는 `/.netlify/functions/send`
- 폼과 함수가 같은 사이트이므로 HTML의 `SEND_ENDPOINT = "/api/send"` 그대로 동작(CORS 불필요)
- **다른 곳(Framer 등)에 폼을 올릴 경우**: `SEND_ENDPOINT`를 전체 URL
  `https://<사이트>.netlify.app/api/send` 로 바꾸면 됩니다(함수의 CORS는 열려 있음).

## 4. 동작

1. 방문자 작성(상단 진행률 %) → **이메일 발송** → 확인 모달 → **발송하기**
2. 브라우저에서 PDF 생성 → `/api/send` 전송 → Resend가 PDF 첨부 메일 발송
3. 성공 시 "발송되었습니다." 토스트

## 참고

- 제목 자동: `[슈퍼100 AX 부트캠프 사전진단 질의서] {회사명} {작성일}`
- 첨부 파일명: `사전진단_질의서_{회사명}.pdf`
- 본문에도 전체 응답이 텍스트로 포함(PDF 없이도 내용 확인 가능)
- Netlify Functions 런타임 Node 18+ (global fetch 사용) — 기본값이라 별도 설정 불필요
