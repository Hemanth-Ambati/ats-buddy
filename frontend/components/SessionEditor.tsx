import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { ChatWindow } from './ChatWindow';
import { InputSection } from './InputSection';
import { ResultsSection } from './ResultsSection';
import type { AnalysisResult, SessionState, ChatMessage } from '../types';
import { analyzeResumeAndJD, analyzeKeywordOnly, analyzeScoreOnly } from '../services/agentOrchestrator';
import { appendChat, saveAnalysis, updateSessionFields, resetSession, saveSessionToHistory, getLocalSessions, renameSessionInHistory, deleteSessionFromHistory, loadLocalSession } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { loadUserSession, saveUserSession, subscribeToUserSessions, loadSessionById, renameUserSession, deleteUserSession, getUserProfileResume, type SessionSummary } from '../services/dbService';
import { SessionSidebar } from './SessionSidebar';

export const SessionEditor: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Core state
    const [session, setSession] = React.useState<SessionState | null>(null);
    const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isChatVisible, setIsChatVisible] = React.useState(false);

    // Sidebar state
    const [sessionsList, setSessionsList] = React.useState<SessionSummary[]>(() => getLocalSessions());
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [sidebarWidth, setSidebarWidth] = React.useState(288);

    // Subscribe to sessions list
    React.useEffect(() => {
        if (currentUser) {
            const unsubscribe = subscribeToUserSessions(currentUser.uid, (sessions) => {
                setSessionsList(sessions);
            });
            return () => unsubscribe();
        } else {
            setSessionsList(getLocalSessions());
        }
    }, [currentUser]);

    // Load session data
    React.useEffect(() => {
        const loadData = async () => {
            if (!sessionId) {
                setError("No session ID provided");
                setIsLoading(false);
                return;
            }

            // 1. Try Local First (Fastest)
            const localSession = loadLocalSession(sessionId);
            if (localSession) {
                setSession(localSession);
                setAnalysisResult(localSession.analysis ?? null);
                setIsChatVisible(!!localSession.analysis);
                setIsLoading(false); // Show immediately
            }

            // 2. Fetch from Firestore (Source of Truth)
            if (currentUser) {
                try {
                    // If we didn't find it locally, we must show loading
                    if (!localSession) setIsLoading(true);

                    const remoteSession = await loadSessionById(currentUser.uid, sessionId);

                    if (remoteSession) {
                        setSession(remoteSession);
                        setAnalysisResult(remoteSession.analysis ?? null);
                        if (!localSession) setIsChatVisible(!!remoteSession.analysis);
                    } else if (!localSession) {
                        setError("Session not found");
                    }
                } catch (err) {
                    console.error("Failed to load session", err);
                    if (!localSession) setError("Failed to load session");
                } finally {
                    setIsLoading(false);
                }
            } else {
                if (!localSession) {
                    setError("Session not found");
                    setIsLoading(false);
                }
            }
        };

        loadData();
    }, [sessionId, currentUser]);

    // Sync session changes to Firestore
    React.useEffect(() => {
        if (currentUser && session) {
            // Update title logic (same as Dashboard)
            let title = session.title;
            const scoringOutput = session.analysis?.scoring?.output;

            if ((!title || title === 'New Session' || title === 'Untitled Session') && scoringOutput) {
                if (scoringOutput.jobTitle && scoringOutput.company) {
                    title = `${scoringOutput.jobTitle} at ${scoringOutput.company}`;
                } else if (scoringOutput.jobTitle) {
                    title = scoringOutput.jobTitle;
                } else if (scoringOutput.company) {
                    title = `Role at ${scoringOutput.company}`;
                }

                if (title && title !== session.title) {
                    setSession(prev => prev ? ({ ...prev, title }) : null);
                }
            }

            const timeoutId = setTimeout(() => {
                const hasContent = (session.resumeText && session.resumeText.trim().length > 0) ||
                    (session.jobDescriptionText && session.jobDescriptionText.trim().length > 0) ||
                    (session.chatHistory && session.chatHistory.length > 0);

                if (hasContent) {
                    saveUserSession(currentUser.uid, { ...session, title });
                }
                saveSessionToHistory({ ...session, title });
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [session, currentUser]);

    // Handlers
    const handleNewSession = async () => {
        const newSession = resetSession();
        if (currentUser) {
            await saveUserSession(currentUser.uid, newSession);
        }
        saveSessionToHistory(newSession, true);
        navigate(`/optimize/${newSession.sessionId}`);
    };

    const handleSwitchSession = (id: string) => {
        navigate(`/optimize/${id}`);
    };

    const handleDeleteSession = async (id: string) => {
        // Optimistic update
        setSessionsList(prev => prev.filter(s => s.sessionId !== id));
        deleteSessionFromHistory(id);
        if (currentUser) {
            await deleteUserSession(currentUser.uid, id);
        }
        if (id === sessionId) {
            navigate('/dashboard');
        }
    };

    const handleRenameSession = async (id: string, newTitle: string) => {
        setSessionsList(prev => prev.map(s => s.sessionId === id ? { ...s, title: newTitle } : s));
        if (session && session.sessionId === id) {
            setSession(prev => prev ? ({ ...prev, title: newTitle }) : null);
        }
        renameSessionInHistory(id, newTitle);
        if (currentUser) {
            await renameUserSession(currentUser.uid, id, newTitle);
        }
    };

    const toggleChat = () => setIsChatVisible(prev => !prev);

    const handleResumeTextChange = React.useCallback((text: string) => {
        setSession(prev => prev ? updateSessionFields(prev, { resumeText: text }) : null);
    }, []);

    const handleJobDescriptionChange = React.useCallback((text: string) => {
        setSession(prev => prev ? updateSessionFields(prev, { jobDescriptionText: text }) : null);
    }, []);

    const handleResumeUpdate = React.useCallback((updatedResume: string) => {
        setSession(prev => prev ? updateSessionFields(prev, { resumeText: updatedResume }) : null);
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

    const handleLoadProfile = React.useCallback(async () => {
        if (!currentUser) return null;
        try {
            return await getUserProfileResume(currentUser.uid);
        } catch (error) {
            console.error("Failed to load profile resume", error);
            setError("Failed to load profile resume");
            return null;
        }
    }, [currentUser]);

    const handleAnalyze = React.useCallback(async () => {
        if (!session || !session.resumeText || !session.jobDescriptionText) return;

        setIsLoading(true);
        setError(null);
        // setIsChatVisible(true);

        try {
            const result = await analyzeResumeAndJD(
                session.resumeText,
                session.jobDescriptionText,
                session.sessionId,
                crypto.randomUUID(),
                (partial) => setAnalysisResult(partial)
            );
            setAnalysisResult(result);
            setSession(prev => prev ? saveAnalysis(prev, result) : null);

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
            setSession(prev => prev ? appendChat(prev, systemMsg) : null);

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const handleKeywordAnalyze = React.useCallback(async () => {
        if (!session || !session.resumeText || !session.jobDescriptionText) return;
        setIsLoading(true);
        setError(null);
        // setIsChatVisible(true);
        try {
            const result = await analyzeKeywordOnly(
                session.resumeText,
                session.jobDescriptionText,
                session.sessionId,
                crypto.randomUUID(),
                (partial) => setAnalysisResult(partial)
            );
            setAnalysisResult(result);
            setSession(prev => prev ? saveAnalysis(prev, result) : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    const handleScoreAnalyze = React.useCallback(async () => {
        if (!session || !session.resumeText || !session.jobDescriptionText) return;
        setIsLoading(true);
        setError(null);
        // setIsChatVisible(true);
        try {
            const result = await analyzeScoreOnly(
                session.resumeText,
                session.jobDescriptionText,
                session.sessionId,
                crypto.randomUUID(),
                (partial) => setAnalysisResult(partial)
            );
            setAnalysisResult(result);
            setSession(prev => prev ? saveAnalysis(prev, result) : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    }, [session]);


    if (isLoading && !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
                <p className="mb-6 text-slate-600 dark:text-slate-400">The session you are looking for does not exist or you do not have permission to view it.</p>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex font-sans selection:bg-sky-200 dark:selection:bg-sky-900 overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent dark:from-sky-900/20 dark:via-transparent dark:to-transparent opacity-70"></div>

            <SessionSidebar
                sessions={sessionsList}
                currentSessionId={sessionId}
                onSessionSelect={handleSwitchSession}
                onNewSession={handleNewSession}
                onRenameSession={handleRenameSession}
                onDeleteSession={handleDeleteSession}
                onHome={() => navigate('/dashboard')}
                onOptimize={() => navigate('/optimize')}
                onWiki={() => navigate('/wiki')}
                onCoverLetter={() => navigate('/cover-letter')}
                onLanding={() => navigate('/')}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                width={sidebarWidth}
                setWidth={setSidebarWidth}
            />

            <div className="relative z-10 flex flex-col flex-1 min-w-0 h-screen">
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onChatToggle={toggleChat}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onHome={() => navigate('/dashboard')}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto pb-8">
                        <div className="relative">
                            <InputSection
                                resumeText={session.resumeText}
                                setResumeText={handleResumeTextChange}
                                jobDescriptionText={session.jobDescriptionText}
                                setJobDescriptionText={handleJobDescriptionChange}
                                onAnalyze={handleAnalyze}
                                onKeywordAnalyze={handleKeywordAnalyze}
                                onScoreAnalyze={handleScoreAnalyze}
                                onLoadProfile={handleLoadProfile}
                                isLoading={isLoading}
                            />
                            {isChatVisible && (
                                <div className="absolute inset-0 z-10 h-full">
                                    <ChatWindow
                                        analysisResult={analysisResult}
                                        resumeText={session.resumeText}
                                        jobDescriptionText={session.jobDescriptionText}
                                        onResumeUpdate={handleResumeUpdate}
                                        sessionId={session.sessionId}
                                        onChatHistoryUpdate={(msg) => setSession(prev => prev ? appendChat(prev, msg) : null)}
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
                <footer className="text-center p-4 text-slate-500 text-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 z-10">
                    <p>&copy; {new Date().getFullYear()} ATS Buddy. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};
