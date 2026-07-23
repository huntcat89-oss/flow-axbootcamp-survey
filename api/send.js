// 슈퍼100 AX 사전진단 질의서 — 제출(Flow 업무 등록) Vercel Serverless Function
//
// Netlify 대체용(무료·지속 가능). 같은 GitHub 리포를 Vercel에 연결하면 이 파일이
// 자동으로 /api/send 엔드포인트가 됩니다. (netlify/functions/send.js 와 로직 동일)
//
// Vercel 배포:
//   1) https://vercel.com → Add New → Project → 같은 GitHub 리포 Import
//   2) Framework Preset: Other (빌드 명령 없음, 루트를 그대로 서빙)
//   3) Settings → Environment Variables 에 등록: FLOW_API_KEY = xxxxxxxx
//      (projectId/status/priority 는 소스 기본값. FLOW_PROJECT_ID 등으로 덮어쓰기 가능)
//   4) 배포 후 URL: https://<프로젝트>.vercel.app  (폼은 /index.html, 함수는 /api/send)
//
// 클라이언트는 SEND_ENDPOINT="/api/send" 그대로 사용 → 코드 수정 불필요.

const PROJECT_ID_DEFAULT = "2935035"
const STATUS_DEFAULT = "request" // request | progress | feedback | complete | hold
const PRIORITY_DEFAULT = "normal" // low | normal | high | urgent

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") return res.status(200).end()
    if (req.method !== "POST")
        return res.status(405).json({ success: false, message: "POST only" })

    try {
        const body =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}
        const { title, contents, filename, pdfBase64 } = body

        const apiKey = process.env.FLOW_API_KEY
        if (!apiKey)
            return res
                .status(500)
                .json({ success: false, message: "FLOW_API_KEY 미설정" })

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

        const r = await fetch(
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

        const raw = await r.text()
        let d
        try {
            d = JSON.parse(raw)
        } catch (e) {
            d = { raw }
        }

        if (r.ok) return res.status(200).json({ success: true, data: d })
        return res.status(r.status).json({
            success: false,
            message: (d && d.message) || raw || "Flow 등록 실패",
        })
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message })
    }
}
