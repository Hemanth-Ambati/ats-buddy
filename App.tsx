/**
 * Main Application Component
 * 
 * Orchestrates the entire ATS Buddy application:
 * - Session state management with localStorage persistence
 * - Multi-agent analysis pipeline execution
 * - Real-time progress updates via callbacks
 * - Theme management (light/dark mode)
 * - Chat interface integration
 * - Structured logging with debug panel
 * 
 * Design Decisions:
 * - Single source of truth: session state in React state + localStorage
 * - Optimistic UI updates: Show pending states immediately, update as agents complete
 * - Auto-open chat: Chat window opens automatically when analysis starts
 * - Real-time logs: Subscribe to logger for live debug panel updates
 */

import * as React from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import type { AnalysisResult, SessionState, ChatMessage } from './types';
import { analyzeResumeAndJD, analyzeKeywordOnly, analyzeScoreOnly } from './services/agentOrchestrator';
import { appendChat, loadSession, saveAnalysis, updateSessionFields } from './services/sessionService';
import { subscribeLogger, type LogEntry } from './services/logger';
import { DebugPanel } from './components/DebugPanel';

const App: React.FC = () => {
  // Core state: Session persisted to localStorage
  const [session, setSession] = React.useState<SessionState>(() => loadSession());

  // Analysis state: Current pipeline execution results
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(session.analysis ?? null);

  // UI state
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<LogEntry[]>([]); // Recent logs for debug panel
  const [isDebugOpen, setIsDebugOpen] = React.useState(false);
  const [isChatVisible, setIsChatVisible] = React.useState(false);

  // Theme management: Persists to localStorage, respects system preference
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme to document root for Tailwind dark mode
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleChat = () => {
    setIsChatVisible(prev => !prev);
  };

  const resumeText = session.resumeText;
  const jobDescriptionText = session.jobDescriptionText;

  // Input handlers: Update session state and persist to localStorage
  const handleResumeTextChange = React.useCallback((text: string) => {
    setSession(prev => updateSessionFields(prev, { resumeText: text }));
  }, []);

  const handleJobDescriptionChange = React.useCallback((text: string) => {
    setSession(prev => updateSessionFields(prev, { jobDescriptionText: text }));
  }, []);

  /**
   * Handles manual resume updates from chat interface.
   * Updates both session state and analysis result to keep UI in sync.
   */
  const handleResumeUpdate = React.useCallback((updatedResume: string) => {
    setSession(prev => updateSessionFields(prev, { resumeText: updatedResume }));
    if (analysisResult) {
      setAnalysisResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          optimiser: { ...prev.optimiser, output: { ...(prev.optimiser.output ?? { markdown: '', rationale: 'Manual update' }), markdown: updatedResume } },
          formatter: { ...prev.formatter, output: { markdown: updatedResume } },
        };
      });
    }
  }, [analysisResult]);

  /**
   * Main analysis handler: Runs full multi-agent pipeline.
   * 
   * Flow:
   * 1. Set loading state and clear errors
   * 2. Auto-open chat window for user interaction
   * 3. Execute pipeline with progress callback for real-time UI updates
   * 4. Save results to session (persists to localStorage)
   * 5. Add system message to chat announcing completion
   */
  const handleAnalyze = React.useCallback(async () => {
    if (!resumeText || !jobDescriptionText) return;

    setIsLoading(true);
    setError(null);
    setIsChatVisible(true); // Auto-open chat on analysis

    try {
      // onProgress callback enables real-time UI updates as each agent completes
      const result = await analyzeResumeAndJD(
        resumeText,
        jobDescriptionText,
        session.sessionId,
        crypto.randomUUID(), // New correlation ID for this analysis
        (partial) => setAnalysisResult(partial) // Real-time progress updates
      );
      setAnalysisResult(result);
      setSession(prev => saveAnalysis(prev, result));

      // Add system message to chat history announcing completion
      const systemMsg: ChatMessage = {
        role: 'system',
        content: `Analysis complete! I have analyzed your resume against the job description.
        
**Score:** ${result.scoring.output?.overall ?? 'N/A'}/100
**Key Findings:**
- Matched ${result.scoring.output?.matchedKeywords.length ?? 0} keywords
- Identified ${result.scoring.output?.missingKeywords.length ?? 0} missing keywords

You can now ask me specific questions about the analysis or request further improvements.`,
        timestamp: Date.now()
      };
      setSession(prev => appendChat(prev, systemMsg));

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText, session.sessionId, setSession]);

  /**
   * Lightweight analysis: Keyword comparison only (no scoring or optimization).
   * Faster alternative when user only needs keyword gap analysis.
   */
  const handleKeywordAnalyze = React.useCallback(async () => {
    if (!resumeText || !jobDescriptionText) return;

    setIsLoading(true);
    setError(null);
    setIsChatVisible(true);

    try {
      const result = await analyzeKeywordOnly(
        resumeText,
        jobDescriptionText,
        session.sessionId,
        crypto.randomUUID(),
        (partial) => setAnalysisResult(partial)
      );
      setAnalysisResult(result);
      setSession(prev => saveAnalysis(prev, result));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText, session.sessionId, setSession]);

  /**
   * Medium-weight analysis: Keyword + ATS scoring (no optimization).
   * Provides score without generating optimized resume.
   */
  const handleScoreAnalyze = React.useCallback(async () => {
    if (!resumeText || !jobDescriptionText) return;

    setIsLoading(true);
    setError(null);
    setIsChatVisible(true);

    try {
      const result = await analyzeScoreOnly(
        resumeText,
        jobDescriptionText,
        session.sessionId,
        crypto.randomUUID(),
        (partial) => setAnalysisResult(partial)
      );
      setAnalysisResult(result);
      setSession(prev => saveAnalysis(prev, result));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText, session.sessionId, setSession]);

  /**
   * Subscribe to logger for real-time log streaming to debug panel.
   * Keeps last 30 entries to avoid memory bloat.
   */
  React.useEffect(() => {
    const unsubscribe = subscribeLogger((entry) => {
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.slice(-30); // Keep only recent 30 entries
      });
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col font-sans selection:bg-sky-200 dark:selection:bg-sky-900">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent dark:from-sky-900/20 dark:via-transparent dark:to-transparent opacity-70"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header theme={theme} toggleTheme={toggleTheme} onChatToggle={toggleChat} />
        <main className="container mx-auto p-4 md:p-8 flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative">
              <InputSection
                resumeText={resumeText}
                setResumeText={handleResumeTextChange}
                jobDescriptionText={jobDescriptionText}
                setJobDescriptionText={handleJobDescriptionChange}
                onAnalyze={handleAnalyze}
                onKeywordAnalyze={handleKeywordAnalyze}
                onScoreAnalyze={handleScoreAnalyze}
                isLoading={isLoading}
              />
              {isChatVisible && (
                <div className="absolute inset-0 z-10 h-full">
                  <ChatWindow
                    analysisResult={analysisResult}
                    resumeText={resumeText}
                    jobDescriptionText={jobDescriptionText}
                    onResumeUpdate={handleResumeUpdate}
                    sessionId={session.sessionId}
                    onChatHistoryUpdate={(msg) => setSession(prev => appendChat(prev, msg))}
                    chatHistory={session.chatHistory}
                    onClose={() => setIsChatVisible(false)}
                  />
                </div>
              )}
            </div>
            <ResultsSection
              result={analysisResult}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </main>
        <DebugPanel
          logs={logs}
          isOpen={isDebugOpen}
          onToggle={() => setIsDebugOpen((v) => !v)}
          onClear={() => setLogs([])}
        />
        <footer className="text-center p-4 text-slate-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
