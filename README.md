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

> **Beat the ATS. Land Your Dream Job.**

ATS Buddy is an intelligent, "Local-First" concierge agent designed to help job seekers optimize their resumes for Applicant Tracking Systems (ATS). Powered by **Google Gemini 2.5 Flash**, it employs a multi-agent orchestration pipeline to analyze resumes against job descriptions, provide match scores, and generate ATS-friendly rewrites in seconds.

![Project Banner](https://via.placeholder.com/1200x400?text=ATS+Buddy+Dashboard+Preview)

## 🚀 Key Features

-   **🤖 Multi-Agent Pipeline**: Uses parallel specialized agents to analyze keywords, score relevance, and rewrite content simultaneously.
-   **🎯 Instant ATS Scoring**: Provides a 0-100 match score with detailed alignment notes and missing keyword analysis.
-   **📝 Intelligent Rewriting**: Automatically rewrites your resume summaries and bullet points to incorporate missing skills without fabricating experience.
-   **💬 Context-Aware Chat**: A built-in AI assistant that understands your specific resume context and can answer questions like "Why did my score improve?"
-   **🔒 Local-First Privacy**: Resume parsing happens entirely in the browser. User sessions are stored locally by default, with optional cloud sync for authenticated users.
-   **📊 Observability**: Real-time "Debug Panel" streaming agent logs and execution traces for complete transparency.

## �️ Tech Stack

**Frontend & Core:**
* **Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS (v3.4) + Typography Plugin
* **State**: React Context API + LocalStorage (Persistence)
* **Parsing**: `pdfjs-dist` (PDF) & `mammoth` (DOCX)

**AI & Backend:**
* **AI Engine**: Google Gemini 2.5 Flash (via `@google/genai`)
* **Authentication**: Firebase Auth (Email/Password + Google OAuth)
* **Database**: Cloud Firestore (Session History)
* **Serverless**: Firebase Cloud Functions (Security & Cleanup)

## 🏗️ Architecture

ATS Buddy moves beyond simple API wrappers by using a **Coordinator Pattern**. When a user clicks "Optimize", the `AgentOrchestrator` spins up three specialized agents in parallel:

1.  **Keyword Agent**: Scans the JD for hard/soft skills and identifies gaps in the resume.
2.  **Scoring Agent**: Calculates a weighted score based on keywords, skills, experience, and formatting.
3.  **Optimizer Agent**: Rewrites the resume in Markdown, strictly following ATS formatting rules (e.g., standard headers, no columns).

All agent outputs use **Structured JSON Schemas** to ensure reliability and prevent hallucinations.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A Firebase Project (Free Tier)
* Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ats-buddy.git
cd ats-buddy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory and add your keys:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Get these from Firebase Console)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Optional: Email Service (EmailJS)
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
```

### 4. Firebase Setup
1. Go to the Firebase Console.
2. Enable Authentication (Email/Password and Google providers).
3. Enable Cloud Firestore (Start in Test Mode for development).
4. (Optional) Deploy Cloud Functions:

```bash
firebase login
firebase init functions
# Replace functions/index.ts with the code in this repo
firebase deploy --only functions
```

### 5. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000 to view the app.

## 📖 Usage Guide
1. **Upload Resume**: Drag & drop your existing PDF/DOCX resume or paste the text directly.
2. **Add Job Description**: Paste the full job description of the role you are targeting.
3. **Analyze**: Click "Optimize My Resume". The dashboard will light up as agents run in parallel.
4. **Review Results**:
    - Check your **ATS Match Score**.
    - Review the **Keyword Analysis** to see what you are missing.
    - Download the **Optimized Resume** (Docx/PDF).
5. **Refine**: Use the Chat Assistant to tweak specific sections (e.g., "Rewrite my summary to be more senior").

## 🧪 Running Tests
This project uses Vitest for unit testing agent logic and session management.

```bash
npm test
```

## 📄 License
This is a private, personal project. All rights reserved.

Built with ❤️ for the AI Agent Capstone Project.
