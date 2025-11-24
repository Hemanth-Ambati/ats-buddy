<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ATS Buddy – Multi-Agent Resume Optimizer

This app helps you align a resume to a job description using a lightweight multi-agent pipeline on Gemini.

## Architecture at a Glance
- **Coordinator:** Drives a sequential pipeline.
- **JD Analysis Agent:** Extracts title/summary/keywords/skills from the JD.
- **Keyword Agent:** Finds matched/missing keywords + suggestions.
- **ATS Scoring Agent:** Produces an overall score and alignment notes.
- **Optimizer Agent:** Rewrites resume in Markdown, weaving in missing keywords without fabrication.
- **Formatter Agent:** Normalizes headings/bullets for ATS-friendly output.
- **Session + Memory:** Sessions carry resume/JD text, agent outputs, and chat history; persisted to `localStorage`.
- **Observability:** Structured logs with correlation IDs; a UI debug panel surfaces recent entries for demos.

## Setup
1) Install dependencies: `npm install`
2) Copy `.env.local` and set one of:
   - `GEMINI_API_KEY=` (or `VITE_GEMINI_API_KEY=`) your Gemini key
   - Optional: `VITE_GEMINI_MOCK=true` to run with mocked agent responses (no API calls)
3) Run the dev server: `npm run dev`

## Using the App
- Paste/upload your resume and paste the job description, then click **Optimize My Resume**.
- View stage statuses, ATS score, keyword map, and the formatted optimized resume.
- Use the floating chat to ask follow-ups or apply AI edits to your resume.
- Toggle the **Debug Logs** panel (bottom-right) to view recent structured logs.

## Tests
- Run unit tests (orchestrator + session service): `npm test`

## Deployment
- Any static-capable host (e.g., Vercel/Netlify). Build with `npm run build`, then serve `dist/`.
