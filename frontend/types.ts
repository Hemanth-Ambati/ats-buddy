/**
 * Type Definitions for ATS Buddy Multi-Agent System
 * 
 * These types define the data structures for:
 * - Agent inputs and outputs
 * - Pipeline stage tracking
 * - Session state management
 * - Chat interactions
 */

/**
 * Output from Keyword Analysis Agent.
 * Compares resume against job description to identify alignment and gaps.
 */
export interface KeywordAnalysis {
  matchingKeywords: string[];  // Keywords present in both resume and JD
  missingKeywords: string[];   // Keywords in JD but missing from resume
  suggestions: string[];       // Actionable recommendations for improvement
}

/**
 * Output from Job Description Analysis Agent.
 * Extracts structured information from unstructured job postings.
 */
export interface JDAnalysis {
  title?: string;       // Job title (e.g., "Senior Software Engineer")
  role?: string;        // Specific role name (e.g. "Backend Developer")
  company?: string;     // Company name (e.g. "Google")
  summary?: string;     // Brief description of the role
  keywords: string[];   // Key terms and technologies mentioned
  skills: string[];     // Required/preferred skills
  seniority?: string;   // Experience level (Junior, Mid, Senior, etc.)
}

/**
 * Output from ATS Scoring Agent.
 * Provides quantitative score with qualitative analysis.
 */
export interface ScoreBreakdown {
  overall: number;              // ATS compatibility score (0-100)
  alignmentNotes: string;       // Detailed explanation of score
  matchedKeywords: string[];    // Keywords that align with JD
  missingKeywords: string[];    // Keywords absent from resume
  jobTitle?: string;            // Extracted from JD (moved from JDAnalysis)
  company?: string;             // Extracted from JD (moved from JDAnalysis)
}

/**
 * Output from Optimizer Agent.
 * Contains improved resume with explanation of changes.
 */
export interface OptimizedResumeDraft {
  markdown: string;   // Optimized resume in markdown format
  rationale: string;  // Explanation of what was changed and why
}

/**
 * Output from Cover Letter Agent.
 */
export interface CoverLetterVersion {
  id: string;
  markdown: string;
  jobTitle?: string;
  company?: string;
  createdAt: number;
  style?: string;
}

export interface CoverLetter {
  markdown: string;       // Current selected version content
  jobTitle?: string;      // Extracted from JD
  company?: string;       // Extracted from JD
  versions?: CoverLetterVersion[]; // History of versions
  selectedId?: string;    // ID of currently selected version
}

/**
 * Request payload for generating a cover letter.
 */
export interface CoverLetterRequest {
  sessionId: string;
  source: 'original' | 'optimized';
}

/**
 * Agent stage identifiers.
 * Each stage represents one agent in the pipeline.
 */
export type AgentStageName =
  | 'jdAnalysis'
  | 'keywordAnalysis'
  | 'scoring'
  | 'optimiser'
  | 'coverLetter'
  | 'formatter';

/**
 * Tracks execution state of a single agent stage.
 * 
 * Lifecycle: pending → running → completed/failed
 * - pending: Stage hasn't started yet
 * - running: Stage is currently executing (not currently used, transitions directly to completed)
 * - completed: Stage finished successfully with output
 * - failed: Stage encountered an error
 * 
 * Design Decision: Generic TOutput type
 * - Each agent produces different output structure (JDAnalysis, ScoreBreakdown, etc.)
 * - Type parameter ensures type safety when accessing stage.output
 */
export interface AgentStage<TOutput> {
  name: AgentStageName;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;    // Unix timestamp (ms) when stage began
  finishedAt?: number;   // Unix timestamp (ms) when stage completed
  output?: TOutput;      // Agent's result (only present if status === 'completed')
  error?: string;        // Error message (only present if status === 'failed')
}

/**
 * Complete result from the multi-agent analysis pipeline.
 * Contains all agent stages with their respective outputs.
 * 
 * This is the primary data structure passed between orchestrator and UI.
 */
export interface AnalysisResult {
  sessionId: string;
  correlationId: string;
  jdAnalysis: AgentStage<JDAnalysis>;
  keywordAnalysis: AgentStage<KeywordAnalysis>;
  scoring: AgentStage<ScoreBreakdown>;
  optimiser: AgentStage<OptimizedResumeDraft>;
  coverLetter?: AgentStage<CoverLetter>;
  formatter: AgentStage<{ markdown: string }>; // Legacy: merged into optimiser
}

/**
 * Single message in chat conversation.
 * Supports user, assistant, and system messages.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;  // Unix timestamp (ms)
}

/**
 * Complete session state persisted to localStorage.
 * 
 * Maintains all user data and analysis results across page refreshes.
 * SessionId persists across page loads; correlationId is regenerated per analysis.
 */
export interface SessionState {
  sessionId: string;           // Persistent session identifier
  title?: string;              // Human-readable session title (e.g. Job Title)
  updatedAt?: string;          // Last modification timestamp
  correlationId: string;       // Current analysis correlation ID
  resumeText: string;          // User's resume content
  jobDescriptionText: string;  // Target job description
  analysis?: AnalysisResult;   // Most recent analysis result (if any)
  chatHistory: ChatMessage[];  // Conversation with AI assistant
}
