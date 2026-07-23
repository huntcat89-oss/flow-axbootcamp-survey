// 슈퍼100 AX 사전진단 질의서 — 제출(Flow 업무 등록) Netlify Function
//
// 동작: 폼 응답을 Flow(플로우) 프로젝트에 "업무"로 등록하고 PDF를 첨부합니다.
//   POST https://api.flow.team/user/posts/projects/{projectId}/tasks
//   헤더 x-flow-api-key 로 인증 → 인증된 사용자가 작성자.
//   files[] = { fileName, fileContents(base64) } 로 PDF 첨부.
//
// 배포:
//   Netlify → Site settings → Environment variables 에 등록:
//     FLOW_API_KEY = xxxxxxxx   ← 이것만 필수 (관리 페이지에서 발급)
//   프로젝트 ID / 상태 / 우선순위는 아래 소스 기본값으로 반영됨(환경변수 불필요).
//     FLOW_PROJECT_ID / FLOW_STATUS / FLOW_PRIORITY 로 덮어쓸 수 있음.
//
// 요청(JSON): { title, contents, filename, pdfBase64 }
// 응답(JSON): { success: true } 또는 { success: false, message }

// 소스 기본값 (환경변수 없이 동작)
const PROJECT_ID_DEFAULT = "2935035"
const STATUS_DEFAULT = "request" // request | progress | feedback | complete | hold
const PRIORITY_DEFAULT = "normal" // low | normal | high | urgent

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if (event.httpMethod === "OPTIONS")
        return { statusCode: 200, headers, body: "" }
    if (event.httpMethod !== "POST")
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: "POST only" }),
        }

    try {
        const body = JSON.parse(event.body || "{}")
        const { title, contents, filename, pdfBase64 } = body

        const apiKey = process.env.FLOW_API_KEY
        if (!apiKey)
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "FLOW_API_KEY 미설정",
                }),
            }

        const projectId = process.env.FLOW_PROJECT_ID || PROJECT_ID_DEFAULT
        const status = process.env.FLOW_STATUS || STATUS_DEFAULT
        const priority = process.env.FLOW_PRIORITY || PRIORITY_DEFAULT

        const files = pdfBase64
            ? [{ fileName: filename || "survey.pdf", fileContents: pdfBase64 }]
            : []

        const payload = {
            title: (title || "슈퍼100 AX 부트캠프 사전진단 질의서").slice(0, 200),
            contents: (contents || "").slice(0, 10000),
            status,
            priority,
            files,
        }

        const rr = await fetch(
            `https://api.flow.team/user/posts/projects/${projectId}/tasks`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-flow-api-key": apiKey,
                },
                body: JSON.stringify(payload),
            }
        )
        const raw = await rr.text()
        let d
        try {
            d = JSON.parse(raw)
        } catch (e) {
            d = { raw }
        }

        if (rr.ok)
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: d }),
            }
        return {
            statusCode: rr.status,
            headers,
            body: JSON.stringify({
                success: false,
                message: (d && d.message) || raw || "Flow 등록 실패",
            }),
        }
    } catch (e) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: e.message }),
        }
    }
}
