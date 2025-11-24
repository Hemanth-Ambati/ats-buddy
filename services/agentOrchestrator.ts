/**
 * Multi-Agent Resume Optimization Orchestrator
 * 
 * This module implements a sequential multi-agent pipeline for ATS resume optimization.
 * The pipeline consists of 5 specialized agents that work together to analyze and improve resumes:
 * 
 * 1. JD Analysis Agent: Extracts keywords, skills, and requirements from job descriptions
 * 2. Keyword Analysis Agent: Identifies matching and missing keywords between resume and JD
 * 3. Scoring Agent: Calculates ATS compatibility score (0-100) with detailed alignment notes
 * 4. Optimizer Agent: Rewrites resume to incorporate missing keywords without fabrication
 * 5. Formatter Agent: (Merged into Optimizer) Ensures ATS-friendly markdown formatting
 * 
 * Design Decisions:
 * - Sequential execution for stages 1-2 to build context for later agents
 * - Parallel execution for Scoring + Optimizer (stages 3-4) to reduce latency
 * - Structured output schemas ensure consistent, parseable responses from Gemini
 * - Progress callbacks enable real-time UI updates as each stage completes
 * - Correlation IDs track requests across the entire pipeline for observability
 */

import { generateStructured, Type } from './geminiService';
import type {
  AgentStage,
  AgentStageName,
  AnalysisResult,
  JDAnalysis,
  KeywordAnalysis,
  OptimizedResumeDraft,
  ScoreBreakdown,
} from '../types';
import { log } from './logger';

/**
 * Schema for Job Description Analysis Agent output
 * Defines the structured format for extracting key information from job postings.
 * Required fields ensure we always get actionable keywords and skills for comparison.
 */
const jdSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    seniority: { type: Type.STRING },
  },
  required: ['keywords', 'skills'],
};

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
 * The score helps users understand their resume's ATS compatibility at a glance.
 */
const scoringSchema = {
  type: Type.OBJECT,
  properties: {
    overall: { type: Type.NUMBER },
    alignmentNotes: { type: Type.STRING },
    matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
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
  const startedAt = Date.now();
  try {
    const output = await fn();
    return { name, status: 'completed', startedAt, finishedAt: Date.now(), output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { name, status: 'failed', startedAt, finishedAt: Date.now(), error };
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
 * Executes all 5 agent stages in optimized order:
 * 1. JD Analysis (sequential) - Must complete first to provide context
 * 2. Keyword Analysis (sequential) - Depends on JD analysis output
 * 3. Scoring + Optimizer (parallel) - Both depend on stages 1-2, can run concurrently
 * 
 * @param resume - User's current resume text
 * @param jobDescription - Target job posting text
 * @param sessionId - Unique session identifier for this user session
 * @param correlationId - Unique ID for this specific analysis request
 * @param onProgress - Optional callback for real-time UI updates as stages complete
 * @returns Complete analysis result with all agent outputs
 * 
 * Design Decision: Parallel execution of Scoring + Optimizer
 * - Both agents need the same inputs (JD analysis + keyword analysis)
 * - Neither depends on the other's output
 * - Running in parallel reduces total pipeline time by ~30-40%
 * - Progress updates are sent independently as each completes
 */
export async function analyzeResumeAndJD(
  resume: string,
  jobDescription: string,
  sessionId: string,
  correlationId: string,
  onProgress?: (partial: AnalysisResult) => void
): Promise<AnalysisResult> {
  log({ level: 'info', message: 'Starting multi-agent analysis', sessionId, correlationId });

  // Initialize all stages in pending state for UI display
  let result: AnalysisResult = {
    sessionId,
    correlationId,
    jdAnalysis: pendingStage('jdAnalysis') as AgentStage<JDAnalysis>,
    keywordAnalysis: pendingStage('keywordAnalysis') as AgentStage<KeywordAnalysis>,
    scoring: pendingStage('scoring') as AgentStage<ScoreBreakdown>,
    optimiser: pendingStage('optimiser') as AgentStage<OptimizedResumeDraft>,
    formatter: pendingStage('formatter') as AgentStage<{ markdown: string }>, // Kept for backward compatibility
  };

  // Helper to update progress and notify UI
  const updateProgress = (updates: Partial<AnalysisResult>) => {
    result = { ...result, ...updates };
    onProgress?.(result);
  };

  const jdAnalysis = await runStage('jdAnalysis', async () => {
    log({ level: 'info', message: 'Running JD analysis agent', sessionId, correlationId, stage: 'jdAnalysis' });
    const prompt = `Extract the most relevant details from the job description. Return key keywords, skills, and an optional summary/title.
JOB DESCRIPTION:\n${jobDescription}`;
    return generateStructured<JDAnalysis>(prompt, jdSchema, 0.2);
  });

  updateProgress({ jdAnalysis });

  const keywordAnalysis = await runStage('keywordAnalysis', async () => {
    log({ level: 'info', message: 'Running keyword analysis agent', sessionId, correlationId, stage: 'keywordAnalysis' });
    const prompt = `You are the Keyword Analyzer agent. Given a job description analysis and a resume, return matched/missing keywords and 3-5 concise suggestions.
JD ANALYSIS:\n${JSON.stringify(jdAnalysis.output || {})}\n\nRESUME:\n${resume}`;
    return generateStructured<KeywordAnalysis>(prompt, keywordSchema, 0.2);
  });

  updateProgress({ keywordAnalysis });

  // PARALLEL EXECUTION: Scoring and Optimizer run concurrently
  // Both agents have all required inputs from stages 1-2, no interdependency
  const [scoring, optimiser] = await Promise.all([
    runStage('scoring', async () => {
      log({ level: 'info', message: 'Running scoring agent', sessionId, correlationId, stage: 'scoring' });
      const prompt = `You are the ATS Scorer agent. Using the job description analysis, keywords evaluation, and resume, produce an overall score (0-100 integer), alignment notes, matched keywords, and missing keywords.
JD ANALYSIS:\n${JSON.stringify(jdAnalysis.output || {})}\n\nKEYWORD ANALYSIS:\n${JSON.stringify(keywordAnalysis.output || {})}\n\nRESUME:\n${resume}`;
      const res = await generateStructured<ScoreBreakdown>(prompt, scoringSchema, 0.2);
      res.overall = Math.round(res.overall); // Ensure integer score for UI display
      return res;
    }).then(res => {
      // Update UI immediately when scoring completes (may finish before optimizer)
      updateProgress({ scoring: res });
      return res;
    }),

    runStage('optimiser', async () => {
      log({ level: 'info', message: 'Running optimizer agent', sessionId, correlationId, stage: 'optimiser' });
      // MERGED PROMPT: Combines optimization + formatting in single LLM call
      // Previous implementation had separate formatter agent, merged for performance
      const prompt = `You are an expert Resume Optimizer. Rewrite the resume to align with the job description and missing keywords.
      
RULES:
1. Use standard, clean Markdown formatting.
2. Use bullet points for experience/skills.
3. Do NOT fabricate experience, but emphasize relevant existing skills.
4. Ensure the output is ATS-friendly (no tables, no complex layouts).
5. Return the full optimized resume markdown and a brief rationale.

JD ANALYSIS:\n${JSON.stringify(jdAnalysis.output || {})}\n\nKEYWORD ANALYSIS:\n${JSON.stringify(keywordAnalysis.output || {})}\n\nRESUME:\n${resume}`;
      return generateStructured<OptimizedResumeDraft>(prompt, optimiserSchema, 0.25);
    }).then(res => {
      // Update both optimizer and formatter (formatter is now just a passthrough)
      updateProgress({ optimiser: res, formatter: { name: 'formatter', status: 'completed', output: { markdown: res.output?.markdown || '' } } });
      return res;
    })
  ]);

  // Final update is already done by the .then() blocks above, but let's ensure consistency
  result = {
    sessionId,
    correlationId,
    jdAnalysis,
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
 * Runs only JD Analysis + Keyword Analysis stages (skips scoring and optimization).
 * Useful for quick keyword gap analysis without full resume rewrite.
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
    jdAnalysis: pendingStage('jdAnalysis') as AgentStage<JDAnalysis>,
    keywordAnalysis: pendingStage('keywordAnalysis') as AgentStage<KeywordAnalysis>,
    scoring: pendingStage('scoring') as AgentStage<ScoreBreakdown>,
    optimiser: pendingStage('optimiser') as AgentStage<OptimizedResumeDraft>,
    formatter: pendingStage('formatter') as AgentStage<{ markdown: string }>,
  };

  const updateProgress = (updates: Partial<AnalysisResult>) => {
    result = { ...result, ...updates };
    onProgress?.(result);
  };

  const jdAnalysis = await runStage('jdAnalysis', async () => {
    const prompt = `Extract the most relevant details from the job description. Return key keywords, skills, and an optional summary/title.
JOB DESCRIPTION:\n${jobDescription}`;
    return generateStructured<JDAnalysis>(prompt, jdSchema, 0.2);
  });

  updateProgress({ jdAnalysis });

  const keywordAnalysis = await runStage('keywordAnalysis', async () => {
    const prompt = `You are the Keyword Analyzer agent. Given a job description analysis and a resume, return matched/missing keywords and 3-5 concise suggestions.
JD ANALYSIS:\n${JSON.stringify(jdAnalysis.output || {})}\n\nRESUME:\n${resume}`;
    return generateStructured<KeywordAnalysis>(prompt, keywordSchema, 0.2);
  });

  updateProgress({ keywordAnalysis });

  result = { ...result, jdAnalysis, keywordAnalysis };
  log({ level: 'info', message: 'Keyword-only analysis complete', sessionId, correlationId });
  return result;
}

/**
 * Medium-weight analysis pipeline for ATS scoring.
 * Runs JD Analysis + Keyword Analysis + Scoring (skips optimization).
 * Provides quantitative score without generating optimized resume.
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
    jdAnalysis: pendingStage('jdAnalysis') as AgentStage<JDAnalysis>,
    keywordAnalysis: pendingStage('keywordAnalysis') as AgentStage<KeywordAnalysis>,
    scoring: pendingStage('scoring') as AgentStage<ScoreBreakdown>,
    optimiser: pendingStage('optimiser') as AgentStage<OptimizedResumeDraft>,
    formatter: pendingStage('formatter') as AgentStage<{ markdown: string }>,
  };

  const updateProgress = (updates: Partial<AnalysisResult>) => {
    result = { ...result, ...updates };
    onProgress?.(result);
  };

  const jdAnalysis = await runStage('jdAnalysis', async () => {
    const prompt = `Extract the most relevant details from the job description. Return key keywords, skills, and an optional summary/title.
JOB DESCRIPTION:\n${jobDescription}`;
    return generateStructured<JDAnalysis>(prompt, jdSchema, 0.2);
  });

  updateProgress({ jdAnalysis });

  const keywordAnalysis = await runStage('keywordAnalysis', async () => {
    const prompt = `You are the Keyword Analyzer agent. Given a job description analysis and a resume, return matched/missing keywords and 3-5 concise suggestions.
JD ANALYSIS:\n${JSON.stringify(jdAnalysis.output || {})}\n\nRESUME:\n${resume}`;
    return generateStructured<KeywordAnalysis>(prompt, keywordSchema, 0.2);
  });

  updateProgress({ keywordAnalysis });

  const scoring = await runStage('scoring', async () => {
    const prompt = `You are the ATS Scorer agent. Using the job description analysis, keywords evaluation, and resume, produce an overall score (0-100 integer), alignment notes, matched keywords, and missing keywords.
JD ANALYSIS:\n${JSON.stringify(jdAnalysis.output || {})}\n\nKEYWORD ANALYSIS:\n${JSON.stringify(keywordAnalysis.output || {})}\n\nRESUME:\n${resume}`;
    const res = await generateStructured<ScoreBreakdown>(prompt, scoringSchema, 0.2);
    res.overall = Math.round(res.overall);
    return res;
  });

  updateProgress({ scoring });

  result = { ...result, jdAnalysis, keywordAnalysis, scoring };
  log({ level: 'info', message: 'ATS score analysis complete', sessionId, correlationId, extra: { score: scoring.output?.overall } });
  return result;
}
