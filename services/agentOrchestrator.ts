/**
 * Multi-Agent Resume Optimization Orchestrator
 * 
 * This module implements a parallel multi-agent pipeline for ATS resume optimization.
 * The pipeline consists of 3 specialized agents that work together to analyze and improve resumes:
 * 
 * 1. Keyword Analysis Agent: Identifies matching and missing keywords between resume and JD
 * 2. Scoring Agent: Calculates ATS score and extracts job details (Title/Company)
 * 3. Optimizer Agent: Rewrites resume to incorporate missing keywords without fabrication
 * 
 * Design Decisions:
 * - Parallel execution for ALL agents to minimize latency (~50% speedup)
 * - Removed separate JD Analysis agent to save costs; Scoring agent now handles extraction
 * - Structured output schemas ensure consistent, parseable responses from Gemini
 * - Progress callbacks enable real-time UI updates as each stage completes
 * - Correlation IDs track requests across the entire pipeline for observability
 */

import { generateStructured, Type } from './geminiService';
import type {
  AgentStage,
  AgentStageName,
  AnalysisResult,
  KeywordAnalysis,
  OptimizedResumeDraft,
  ScoreBreakdown,
  CoverLetter,
} from '../types';
import { log } from './logger';


/**
 * Schema for Keyword Analysis Agent output
 * Compares resume against job description to identify gaps and opportunities.
 * Suggestions provide actionable recommendations for resume improvement.
 */
const keywordSchema = {
  type: Type.OBJECT,
  properties: {
    matchingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['matchingKeywords', 'missingKeywords', 'suggestions'],
};

/**
 * Schema for ATS Scoring Agent output
 * Produces a quantitative score (0-100) with qualitative alignment analysis.
 * Also extracts key job details (Title, Company) to avoid a separate JD Analysis call.
 */
const scoringSchema = {
  type: Type.OBJECT,
  properties: {
    overall: { type: Type.NUMBER },
    alignmentNotes: { type: Type.STRING },
    matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    jobTitle: { type: Type.STRING },
    company: { type: Type.STRING },
  },
  required: ['overall', 'alignmentNotes', 'matchedKeywords', 'missingKeywords'],
};

/**
 * Schema for Optimizer Agent output
 * Generates an improved resume in markdown format with explanation.
 * 
 * Design Decision: Merged Formatter into Optimizer (previously separate agents)
 * Rationale: Reduces LLM calls from 5 to 4, improving performance by ~20%
 * while maintaining output quality. The optimizer now handles both content
 * improvement AND ATS-friendly formatting in a single pass.
 */
const optimiserSchema = {
  type: Type.OBJECT,
  properties: {
    markdown: { type: Type.STRING },
    rationale: { type: Type.STRING },
  },
  required: ['markdown', 'rationale'],
};

/**
 * Schema for Cover Letter Agent output
 * Generates a structured cover letter in markdown.
 */
const coverLetterSchema = {
  type: Type.OBJECT,
  properties: {
    markdown: { type: Type.STRING },
  },
  required: ['markdown'],
};

/**
 * Executes a single agent stage with error handling and timing metrics.
 * 
 * @param name - The stage identifier for logging and tracking
 * @param fn - Async function that executes the agent's logic
 * @returns AgentStage object with status, timing, and output/error
 * 
 * This wrapper ensures consistent error handling and provides timing data
 * for performance monitoring and observability.
 */
async function runStage<T>(name: AgentStageName, fn: () => Promise<T>): Promise<AgentStage<T>> {
  try {
    const output = await fn();
    return { name, status: 'completed', output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { name, status: 'failed', error };
  }
}

/**
 * Creates a placeholder stage object for agents that haven't started yet.
 * Used to initialize the analysis result with all stages in pending state.
 */
function pendingStage(name: AgentStageName): AgentStage<unknown> {
  return { name, status: 'pending' };
}

/**
 * Main orchestration function for full resume optimization pipeline.
 * 
 * Executes all 3 agent stages in PARALLEL:
 * 1. Keyword Analysis
 * 2. Scoring (includes Title/Company extraction)
 * 3. Optimizer
 * 
 * @param resume - User's current resume text
 * @param jobDescription - Target job posting text
 * @param sessionId - Unique session identifier for this user session
 * @param correlationId - Unique ID for this specific analysis request
 * @param onProgress - Optional callback for real-time UI updates as stages complete
 * @returns Complete analysis result with all agent outputs
 * 
 * Design Decision: Full Parallelization
 * - All agents run concurrently using Promise.all
 * - Reduces total pipeline time by ~50% compared to sequential flow
 * - Each agent receives raw inputs (Resume + JD) and performs its own analysis
 */
export async function analyzeResumeAndJD(
  resume: string,
  jobDescription: string,
  sessionId: string,
  correlationId: string,
  onProgress?: (partial: AnalysisResult) => void
): Promise<AnalysisResult> {
  log({ level: 'info', message: 'Starting multi-agent analysis (Parallel)', sessionId, correlationId });

  // Initialize all stages in pending state for UI display
  // Note: jdAnalysis is kept as a dummy completed stage for type compatibility
  let result: AnalysisResult = {
    sessionId,
    correlationId,
    jdAnalysis: { name: 'jdAnalysis', status: 'completed', output: { keywords: [], skills: [] } },
    keywordAnalysis: pendingStage('keywordAnalysis') as AgentStage<KeywordAnalysis>,
    scoring: pendingStage('scoring') as AgentStage<ScoreBreakdown>,
    optimiser: pendingStage('optimiser') as AgentStage<OptimizedResumeDraft>,
    formatter: pendingStage('formatter') as AgentStage<{ markdown: string }>,
  };

  // Helper to update progress and notify UI
  const updateProgress = (updates: Partial<AnalysisResult>) => {
    result = { ...result, ...updates };
    onProgress?.(result);
  };

  // PARALLEL EXECUTION: All agents run concurrently
  const [keywordAnalysis, scoring, optimiser] = await Promise.all([
    runStage('keywordAnalysis', async () => {
      log({ level: 'info', message: 'Running keyword analysis agent', sessionId, correlationId, stage: 'keywordAnalysis' });
      const prompt = `You are the Keyword Analyzer agent. Compare the Resume against the Job Description. Return matched/missing keywords and 3-5 concise suggestions.
JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resume}`;
      return generateStructured<KeywordAnalysis>(prompt, keywordSchema, 0.2);
    }).then(res => {
      updateProgress({ keywordAnalysis: res });
      return res;
    }),

    runStage('scoring', async () => {
      log({ level: 'info', message: 'Running scoring agent', sessionId, correlationId, stage: 'scoring' });
      const prompt = `You are the ATS Scorer agent. Compare the Resume against the Job Description.
      1. Calculate an overall match score (0-100).
      2. Provide alignment notes.
      3. List matched and missing keywords.
      4. EXTRACT the "Job Title" and "Company Name" from the Job Description.
      
JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resume}`;
      const res = await generateStructured<ScoreBreakdown>(prompt, scoringSchema, 0.2);
      res.overall = Math.round(res.overall);
      return res;
    }).then(res => {
      updateProgress({ scoring: res });
      return res;
    }),

    runStage('optimiser', async () => {
      log({ level: 'info', message: 'Running optimizer agent', sessionId, correlationId, stage: 'optimiser' });
      const prompt = `You are an expert Resume Optimizer. Rewrite the resume to align with the Job Description.
      
RULES:
1. Analyze the Job Description to identify key missing skills/keywords yourself.
2. Rewrite the resume to incorporate these missing elements naturally.
3. Use standard, clean Markdown formatting.
4. Do NOT fabricate experience.
5. Return the full optimized resume markdown and a brief rationale.

FORMATTING RULES (CRITICAL):
- Use "##" for Section Headers (e.g., ## EXPERIENCE). Always add a blank line after.
- For EXPERIENCE entries, use this EXACT structure:
  **Company Name** | Date
  **Job Title**
  * Bullet point...
  (Ensure Job Title is on a NEW LINE below Company)

- For EDUCATION entries, use this EXACT structure:
  **University Name** | Date
  **Degree**
  (Ensure Degree is on a NEW LINE below University)

- Do NOT merge Company and Job Title on the same line.

JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resume}`;
      return generateStructured<OptimizedResumeDraft>(prompt, optimiserSchema, 0.25);
    }).then(res => {
      updateProgress({ optimiser: res, formatter: { name: 'formatter', status: 'completed', output: { markdown: res.output?.markdown || '' } } });
      return res;
    })
  ]);

  // Final result construction
  result = {
    sessionId,
    correlationId,
    jdAnalysis: { name: 'jdAnalysis', status: 'completed', output: { keywords: [], skills: [] } },
    keywordAnalysis,
    scoring,
    optimiser,
    formatter: { name: 'formatter', status: 'completed', output: { markdown: optimiser.output?.markdown || '' } },
  };

  log({ level: 'info', message: 'Multi-agent analysis complete', sessionId, correlationId, extra: { score: scoring.output?.overall } });
  return result;
}

/**
 * Lightweight analysis pipeline for keyword comparison only.
 * Runs only Keyword Analysis stage (skips scoring and optimization).
 */
export async function analyzeKeywordOnly(
  resume: string,
  jobDescription: string,
  sessionId: string,
  correlationId: string,
  onProgress?: (partial: AnalysisResult) => void
): Promise<AnalysisResult> {
  log({ level: 'info', message: 'Starting keyword-only analysis', sessionId, correlationId });

  let result: AnalysisResult = {
    sessionId,
    correlationId,
    jdAnalysis: { name: 'jdAnalysis', status: 'completed', output: { keywords: [], skills: [] } },
    keywordAnalysis: pendingStage('keywordAnalysis') as AgentStage<KeywordAnalysis>,
    scoring: pendingStage('scoring') as AgentStage<ScoreBreakdown>,
    optimiser: pendingStage('optimiser') as AgentStage<OptimizedResumeDraft>,
    formatter: pendingStage('formatter') as AgentStage<{ markdown: string }>,
  };

  const updateProgress = (updates: Partial<AnalysisResult>) => {
    result = { ...result, ...updates };
    onProgress?.(result);
  };

  const keywordAnalysis = await runStage('keywordAnalysis', async () => {
    const prompt = `You are the Keyword Analyzer agent.Compare the Resume against the Job Description.Return matched / missing keywords and 3 - 5 concise suggestions.
JOB DESCRIPTION: \n${jobDescription}\n\nRESUME: \n${resume}`;
    return generateStructured<KeywordAnalysis>(prompt, keywordSchema, 0.2);
  });

  updateProgress({ keywordAnalysis });

  result = { ...result, keywordAnalysis };
  log({ level: 'info', message: 'Keyword-only analysis complete', sessionId, correlationId });
  return result;
}

/**
 * Medium-weight analysis pipeline for ATS scoring.
 * Runs Keyword Analysis + Scoring (skips optimization).
 */
export async function analyzeScoreOnly(
  resume: string,
  jobDescription: string,
  sessionId: string,
  correlationId: string,
  onProgress?: (partial: AnalysisResult) => void
): Promise<AnalysisResult> {
  log({ level: 'info', message: 'Starting ATS score analysis', sessionId, correlationId });

  let result: AnalysisResult = {
    sessionId,
    correlationId,
    jdAnalysis: { name: 'jdAnalysis', status: 'completed', output: { keywords: [], skills: [] } },
    keywordAnalysis: pendingStage('keywordAnalysis') as AgentStage<KeywordAnalysis>,
    scoring: pendingStage('scoring') as AgentStage<ScoreBreakdown>,
    optimiser: pendingStage('optimiser') as AgentStage<OptimizedResumeDraft>,
    formatter: pendingStage('formatter') as AgentStage<{ markdown: string }>,
  };

  const updateProgress = (updates: Partial<AnalysisResult>) => {
    result = { ...result, ...updates };
    onProgress?.(result);
  };

  // Parallelize Keyword + Scoring
  const [keywordAnalysis, scoring] = await Promise.all([
    runStage('keywordAnalysis', async () => {
      const prompt = `You are the Keyword Analyzer agent.Compare the Resume against the Job Description.Return matched / missing keywords and 3 - 5 concise suggestions.
JOB DESCRIPTION: \n${jobDescription}\n\nRESUME: \n${resume}`;
      return generateStructured<KeywordAnalysis>(prompt, keywordSchema, 0.2);
    }).then(res => {
      updateProgress({ keywordAnalysis: res });
      return res;
    }),

    runStage('scoring', async () => {
      const prompt = `You are the ATS Scorer agent.Compare the Resume against the Job Description.
      1. Calculate an overall match score(0 - 100).
      2. Provide alignment notes.
      3. List matched and missing keywords.
      4. EXTRACT the "Job Title" and "Company Name" from the Job Description.
      
JOB DESCRIPTION: \n${jobDescription}\n\nRESUME: \n${resume}`;
      const res = await generateStructured<ScoreBreakdown>(prompt, scoringSchema, 0.2);
      res.overall = Math.round(res.overall);
      return res;
    }).then(res => {
      updateProgress({ scoring: res });
      return res;
    })
  ]);

  result = { ...result, keywordAnalysis, scoring };
  log({ level: 'info', message: 'ATS score analysis complete', sessionId, correlationId, extra: { score: scoring.output?.overall } });
  return result;
}

// Styles for variations
const STYLES = [
  {
    name: "Professional & Direct",
    prompt: "Adopt a standard, polished professional tone. Focus on clearly matching skills to the job requirements. Be concise and formal."
  },
  {
    name: "Achievement Focused",
    prompt: "Adopt a confident, results-oriented tone. Highlight specific metrics, achievements, and the rapid impact the candidate can make. Be bold."
  },
  {
    name: "Passionate & Cultural",
    prompt: "Adopt a softer, narrative tone. Focus on the candidate's passion for the mission, cultural fit, and personal connection to the industry. Be engaging."
  }
];

export async function generateCoverLetterVariations(
  resumeText: string,
  jdText: string,
  sessionId: string
): Promise<{ status: 'completed' | 'failed', outputs: { markdown: string, style: string }[], error?: string }> {
  try {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const variationPromises = STYLES.map(async (style) => {
      const prompt = `
        You are an expert career coach and professional writer.
        Task: Write a cover letter for a candidate based on their Resume and a Job Description.

        STYLE INSTRUCTION: ${style.prompt}

        REQUIREMENTS:
        1. **Format**: Standard Business Letter.
        - **Header**: Candidate Name (Pascal Case, e.g. "John Doe"), Email, Phone. Do NOT include Portfolio or LinkedIn links.
        - **Date**: ${today}.
        - **Recipient**: Hiring Manager or specific name (from JD), Company Name.
        - **Salutation**: "Dear [Hiring Manager's Name/Team],"
        - **Body**: 3-4 distinct paragraphs.
        - **Sign-off**: "Sincerely," followed by Candidate Name.
        2. **Length**: STRICTLY UNDER 300 WORDS. Must fit on a single page.
        3. **Content**:
        - Analyze the Resume and Match it to the top 3 hard skills in the JD.
        - Do not use placeholders like "[Company Name]" if you can find the name. If unknown, use "Hiring Manager".
        - Do not invent facts.

        RESUME:
        ${resumeText.substring(0, 3000)}

        JOB DESCRIPTION:
        ${jdText.substring(0, 3000)}
        
        OUTPUT FORMAT:
        Return ONLY the markdown text of the letter. No introductory text.
        IMPORTANT: Use double newlines (\n\n) between sections and paragraphs to ensure proper Markdown rendering. Do NOT produce a single block of text.
        `;

      const result = await generateStructured<CoverLetter>(prompt, coverLetterSchema, 0.7);
      const text = result.markdown;
      return {
        markdown: text,
        style: style.name
      };
    });

    const results = await Promise.all(variationPromises);

    return {
      status: 'completed',
      outputs: results
    };

  } catch (error) {
    console.error("Cover Letter Variation Error:", error);
    return {
      status: 'failed',
      outputs: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  sessionId: string
): Promise<AgentStage<CoverLetter>> {
  const correlationId = crypto.randomUUID();
  log({ level: 'info', message: 'Starting cover letter generation', sessionId, correlationId });

  return runStage('coverLetter', async () => {
    const prompt = `You are an expert Cover Letter Writer. Write a professional cover letter for the candidate based on their Resume and the Job Description.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}

REQUIREMENTS:
1. **Format**: Standard Business Letter.
   - **Header**: Candidate Name, Email, Phone, LinkedIn/Portfolio (extract from resume).
   - **Date**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
   - **Recipient**: Hiring Manager or specific name (from JD), Company Name.
   - **Salutation**: "Dear [Hiring Manager's Name/Team],"
   - **Body**: 3-4 distinct paragraphs.
   - **Sign-off**: "Sincerely,\n\nCandidate Name"
2. **Tone**: Professional, enthusiastic, and confident.
3. **Content**:
   - **Intro**: Value proposition and role interest.
   - **Body**: Connect specific resume achievements to JD requirements.
   - **Conclusion**: Call to action (interview request).
4. **Formatting**: 
   - Use double newlines (\n\n) between paragraphs.
   - Do NOT produce one single block of text.
   - Output in Markdown.`;

    return generateStructured<CoverLetter>(prompt, coverLetterSchema, 0.4);
  });
}
