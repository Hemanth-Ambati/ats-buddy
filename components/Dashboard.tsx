/**
 * Dashboard Component
 * 
 * Main application interface for authenticated users.
 * Contains the resume analysis, chat, and results sections.
 */

import * as React from 'react';
import { Header } from './Header';
import { ChatWindow } from './ChatWindow';
import { InputSection } from './InputSection';
import { ResultsSection } from './ResultsSection';
import type { AnalysisResult, SessionState, ChatMessage } from '../types';
import { analyzeResumeAndJD, analyzeKeywordOnly, analyzeScoreOnly } from '../services/agentOrchestrator';
import { appendChat, loadSession, saveAnalysis, updateSessionFields, resetSession, saveSessionToHistory, getLocalSessions, loadLocalSession, renameSessionInHistory, deleteSessionFromHistory } from '../services/sessionService';
import { subscribeLogger, type LogEntry } from '../services/logger';
// import { DebugPanel } from './DebugPanel';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { loadUserSession, saveUserSession, subscribeToUserSessions, loadSessionById, renameUserSession, deleteUserSession, type SessionSummary } from '../services/firestoreService';
import { SessionSidebar } from './SessionSidebar';
import { Menu } from 'lucide-react';

import { DashboardHome } from './DashboardHome';

export const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Core state: Session persisted to localStorage (and Firestore)
    const [session, setSession] = React.useState<SessionState>(() => loadSession());

    // Analysis state: Current pipeline execution results
    const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(session.analysis ?? null);

    // UI state
    const [view, setView] = React.useState<'home' | 'editor'>('home');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    // const [logs, setLogs] = React.useState<LogEntry[]>([]); // Recent logs for debug panel
    // const [isDebugOpen, setIsDebugOpen] = React.useState(true); // Forced open for debugging
    const [isChatVisible, setIsChatVisible] = React.useState(false);

    // Sidebar state
    const [sessionsList, setSessionsList] = React.useState<SessionSummary[]>(() => getLocalSessions());
    // Default to open on desktop, closed on mobile
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => window.innerWidth >= 768);
    const [sidebarWidth, setSidebarWidth] = React.useState(288); // Default w-72 (72 * 4 = 288px)

    // Subscribe to sessions list
    React.useEffect(() => {
        if (currentUser) {
            const unsubscribe = subscribeToUserSessions(currentUser.uid, (sessions) => {
                // Trust the subscription (which handles offline cache too)
                setSessionsList(sessions);
            });
            return () => unsubscribe();
        } else {
            setSessionsList(getLocalSessions());
        }
    }, [currentUser]);

    // ... (rest of the file)

    const handleDeleteSession = async (sessionId: string) => {
        // Optimistic update
        setSessionsList(prev => prev.filter(s => s.sessionId !== sessionId));

        // Delete from persistence
        deleteSessionFromHistory(sessionId);
        if (currentUser) {
            await deleteUserSession(currentUser.uid, sessionId);
        }

        // If deleted session was active, switch to another one
        if (session.sessionId === sessionId) {
            const remaining = sessionsList.filter(s => s.sessionId !== sessionId);
            if (remaining.length > 0) {
                handleSwitchSession(remaining[0].sessionId);
            } else {
                handleNewSession();
            }
        }
    };

    const handleRenameSession = async (sessionId: string, newTitle: string) => {
        // Optimistic local update
        setSessionsList(prev => prev.map(s =>
            s.sessionId === sessionId ? { ...s, title: newTitle } : s
        ));

        // Update current session if it's the one being renamed
        if (session.sessionId === sessionId) {
            setSession(prev => ({ ...prev, title: newTitle }));
        }

        // Persist
        renameSessionInHistory(sessionId, newTitle);
        if (currentUser) {
            await renameUserSession(currentUser.uid, sessionId, newTitle);
        }
    };

    // Load session from Firestore when user logs in
    React.useEffect(() => {
        if (currentUser) {
            loadUserSession(currentUser.uid).then(remoteSession => {
                if (remoteSession) {
                    setSession(remoteSession);
                    setAnalysisResult(remoteSession.analysis ?? null);
                } else {
                    // New user or no saved data: Start fresh
                    const newSession = resetSession();
                    setSession(newSession);
                    setAnalysisResult(null);
                }
            });
        }
    }, [currentUser]);

    // Sync session changes to Firestore
    React.useEffect(() => {
        if (currentUser && session) {
            // Update title based on JD if available and generic
            let title = session.title;
            const scoringOutput = session.analysis?.scoring?.output;

            if ((!title || title === 'New Session') && scoringOutput) {
                if (scoringOutput.jobTitle && scoringOutput.company) {
                    title = `${scoringOutput.jobTitle} at ${scoringOutput.company}`;
                } else if (scoringOutput.jobTitle) {
                    title = scoringOutput.jobTitle;
                } else if (scoringOutput.company) {
                    title = `Role at ${scoringOutput.company}`;
                }

                if (title && title !== session.title) {
                    setSession(prev => ({ ...prev, title })); // Update local state
                }
            }

            // Debounce save to avoid too many writes
            const timeoutId = setTimeout(() => {
                saveUserSession(currentUser.uid, { ...session, title });
                saveSessionToHistory({ ...session, title }); // Save locally as fallback
                setSessionsList(getLocalSessions()); // Immediate local update
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [session, currentUser]);

    const handleNewSession = async () => {
        const newSession = resetSession();
        setSession(newSession);
        setAnalysisResult(null);
        setIsChatVisible(false);
        setView('editor');
        if (currentUser) {
            await saveUserSession(currentUser.uid, newSession);
        }
        saveSessionToHistory(newSession);
        setSessionsList(getLocalSessions());
    };

    const handleSwitchSession = async (sessionId: string) => {
        setIsLoading(true);
        try {
            let loadedSession: SessionState | null = null;

            // Try Firestore first if authenticated
            if (currentUser) {
                loadedSession = await loadSessionById(currentUser.uid, sessionId);
            }

            // Fallback to local storage if not found or not authenticated
            if (!loadedSession) {
                loadedSession = loadLocalSession(sessionId);
            }

            if (loadedSession) {
                setSession(loadedSession);
                setAnalysisResult(loadedSession.analysis ?? null);
                setIsChatVisible(!!loadedSession.analysis); // Open chat if analysis exists
                setView('editor');
            }
        } catch (err) {
            console.error('Failed to switch session', err);
        } finally {
            setIsLoading(false);
        }
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



    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex font-sans selection:bg-sky-200 dark:selection:bg-sky-900 overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent dark:from-sky-900/20 dark:via-transparent dark:to-transparent opacity-70"></div>

            {/* Sidebar - Full height on desktop */}
            <SessionSidebar
                sessions={sessionsList}
                currentSessionId={session.sessionId}
                onSessionSelect={handleSwitchSession}
                onNewSession={handleNewSession}
                onRenameSession={handleRenameSession}
                onDeleteSession={handleDeleteSession}
                onHome={() => setView('home')}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                width={sidebarWidth}
                setWidth={setSidebarWidth}
            />

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col flex-1 min-w-0 h-screen">
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onChatToggle={toggleChat}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onHome={() => setView('home')}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {view === 'home' ? (
                        <DashboardHome
                            sessions={sessionsList}
                            onNewSession={handleNewSession}
                            onSelectSession={handleSwitchSession}
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto pb-8">
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
                    )}
                </main>

                <footer className="text-center p-4 text-slate-500 text-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
                    <p>Powered by Google Gemini</p>
                </footer>
            </div>
        </div>
    );
};
