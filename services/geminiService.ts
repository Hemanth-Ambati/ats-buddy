
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "The ATS match score from 0 to 100, as an integer.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief, 2-3 sentence summary explaining the score and key observations.",
    },
    keywordAnalysis: {
      type: Type.OBJECT,
      properties: {
        matchingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of important keywords from the job description that were found in the resume.",
        },
        missingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of important keywords from the job description that were NOT found in the resume.",
        },
        suggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of 3-5 actionable suggestions for improving the resume.",
        },
      },
      required: ["matchingKeywords", "missingKeywords", "suggestions"],
    },
    optimizedResume: {
      type: Type.STRING,
      description: "The full, optimized resume text in Markdown format. This version should subtly incorporate missing keywords and improve phrasing for ATS compatibility, without fabricating experience.",
    },
  },
  required: ["score", "summary", "keywordAnalysis", "optimizedResume"],
};


export async function analyzeResumeAndJD(resume: string, jobDescription: string): Promise<AnalysisResult> {
  const prompt = `
    You are an expert ATS (Applicant Tracking System) analysis system composed of multiple specialized agents. Your goal is to help a user optimize their resume for a specific job description. Please perform the following steps and return the result in the requested JSON format.

    **USER INPUTS:**

    ---
    **Resume:**
    ${resume}
    ---
    **Job Description:**
    ${jobDescription}
    ---

    **AGENT TASKS:**

    1.  **JD Analysis Agent:** Meticulously analyze the provided Job Description. Extract the most critical keywords, skills (hard and soft), and qualifications. Pay close attention to technologies, job titles, and responsibilities mentioned.

    2.  **Resume Match & Scoring Agent:** Compare the user's Resume against the extracted requirements from the JD. Identify which keywords are present and which are missing. Based on this comparison, calculate an ATS match score from 0 to 100.

    3.  **Optimization Agent:** Rewrite the user's resume to be more ATS-friendly and better aligned with the job description. Subtly incorporate the missing keywords where they logically fit, without fabricating experience. Improve formatting for clarity and parsability. Ensure the output is in Markdown format.

    Please provide your complete analysis in the specified JSON structure.
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.2,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    // Ensure score is an integer
    result.score = Math.round(result.score);
    
    return result as AnalysisResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get analysis from Gemini API. Please check the console for more details.");
  }
}

export async function chatWithGemini(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  analysisContext: AnalysisResult | null = null,
  currentResumeText: string = '',
  jobDescriptionText: string = ''
): Promise<string> {
  // If an analysis context is provided, prepend it as a SYSTEM message so the
  // assistant always answers with that context in mind.
  let systemPrefix = '';

  if (analysisContext) {
    const { score, summary, keywordAnalysis, optimizedResume } = analysisContext;
    const matching = keywordAnalysis.matchingKeywords.join(', ') || 'None';
    const missing = keywordAnalysis.missingKeywords.join(', ') || 'None';
    const suggestions = keywordAnalysis.suggestions.join('\n- ') || 'None';

    systemPrefix = `CONTEXT ANALYSIS:\n- ATS Score: ${score}\n- Summary: ${summary}\n- Matching Keywords: ${matching}\n- Missing Keywords: ${missing}\n- Suggestions:\n- ${suggestions}\n\nOptimized Resume (excerpt):\n${optimizedResume.slice(0, 1200)}\n\nCurrent Resume Text:\n${currentResumeText}\n\nJob Description:\n${jobDescriptionText}\n\nImportant: When answering, always consider the above analysis, resume, and job description. You can compare the optimized resume against the job description, analyze keyword matches, suggest improvements, or provide detailed feedback. If the user asks you to modify, update, or change their resume, respond with your explanation followed by "UPDATED_RESUME:" and then the complete updated resume text. If a suggestion requires clarification, ask a focused follow-up question.`;
  }

  // Build conversation text from the message history
  const conversation = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

  // Combine systemPrefix (if any) with the conversation and instruct the assistant
  const prompt = `${systemPrefix}\n\nYou are an expert resume assistant. Continue the conversation below and provide a helpful, concise reply that uses the analysis context above when relevant.\n\n${conversation}\n\nASSISTANT:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.4 },
    });

    return response.text.trim();
  } catch (err) {
    console.error('Gemini chat error:', err);
    throw new Error('Failed to get chat response from Gemini.');
  }
}
