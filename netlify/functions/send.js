// 슈퍼100 AX 사전진단 질의서 — 이메일 발송 Netlify Function
//
// 배포:
//   1) 이 파일을 저장소의  netlify/functions/send.js  위치에 둡니다.
//   2) GitHub 저장소를 Netlify에 연결(Add new site → Import from GitHub).
//   3) Netlify → Site settings → Environment variables 에 등록:
//        RESEND_API_KEY = re_xxxxxxxx        (https://resend.com 에서 발급)
//        MAIL_TO        = byeongkyo@flow.team  (테스트 수신자, 운영 시 smbu@flow.team)
//        MAIL_FROM      = onboarding@resend.dev
//                         └ 테스트용(가입 본인 메일로만 수신). 운영 시 flow.team 도메인
//                           인증 후 noreply@flow.team 등으로 변경.
//   4) 함수 URL:  https://<사이트>.netlify.app/.netlify/functions/send
//      netlify.toml 의 redirect 로  /api/send  로도 호출 가능.
//
// 요청(JSON): { subject, message, company, date, filename, pdfBase64 }
// 응답(JSON): { success: true } 또는 { success: false, message }

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
        const { subject, message, company, date, filename, pdfBase64 } = body

        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey)
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "RESEND_API_KEY 미설정",
                }),
            }

        const to = process.env.MAIL_TO || "byeongkyo@flow.team"
        const from = process.env.MAIL_FROM || "onboarding@resend.dev"

        const attachments = pdfBase64
            ? [{ filename: filename || "survey.pdf", content: pdfBase64 }]
            : []

        const text =
            (message || "") +
            (company ? `\n\n회사명: ${company}` : "") +
            (date ? `\n작성일: ${date}` : "")

        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: `슈퍼100 AX 사전진단 <${from}>`,
                to: [to],
                subject: subject || "슈퍼100 AX 부트캠프 사전진단 질의서",
                text,
                attachments,
            }),
        })

        const data = await r.json()
        if (r.ok)
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, id: data.id }),
            }
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: data.message || JSON.stringify(data),
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
