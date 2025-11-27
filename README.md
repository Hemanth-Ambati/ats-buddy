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

## 🔐 Authentication Setup (Firebase)

This project uses Firebase for authentication and data persistence.

1.  **Create a Firebase Project:**
    *   Go to [Firebase Console](https://console.firebase.google.com/)
    *   Create a new project
    *   Enable **Authentication** (Email/Password provider)
    *   Enable **Firestore Database** (Start in Test Mode)

2.  **Get Configuration:**
    *   Go to Project Settings > General
    *   Register a new Web App
    *   Copy the `firebaseConfig` values

3.  **Configure Environment:**
    *   Create `.env.local` (copy from `.env.example`)
    *   Fill in the Firebase variables:
        ```env
        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
        VITE_FIREBASE_PROJECT_ID=your_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        VITE_FIREBASE_APP_ID=your_app_id
        ```

## 🚀 Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    *   Copy `.env.example` to `.env.local`
    *   Add your `VITE_GEMINI_API_KEY`
    *   Add your Firebase config (see above)

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **AI:** Google Gemini 2.5 Flash
*   **Auth & DB:** Firebase (Auth + Firestore)
*   **Build:** Vite
*   **Parsing:** PDF.js, Mammoth (DOCX)

## Using the App
- Paste/upload your resume and paste the job description, then click **Optimize My Resume**.
- View stage statuses, ATS score, keyword map, and the formatted optimized resume.
- Use the floating chat to ask follow-ups or apply AI edits to your resume.
- Toggle the **Debug Logs** panel (bottom-right) to view recent structured logs.

## Tests
- Run unit tests (orchestrator + session service): `npm test`

## Deployment
- Any static-capable host (e.g., Vercel/Netlify). Build with `npm run build`, then serve `dist/`.
