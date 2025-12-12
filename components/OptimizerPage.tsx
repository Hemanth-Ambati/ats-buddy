import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, FileText, ArrowRight, Clock, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { subscribeToUserSessions, deleteUserSession, type SessionSummary, loadSessionById, saveUserSession } from '../services/dbService';
import { getLocalSessions, loadLocalSession, saveSessionToHistory, deleteSessionFromHistory, resetSession } from '../services/sessionService';
import { SessionSidebar } from './SessionSidebar';
import { Header } from './Header';

export const OptimizerPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // State
    const [sessionsList, setSessionsList] = React.useState<SessionSummary[]>(() => getLocalSessions());
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [sidebarWidth, setSidebarWidth] = React.useState(288);

    // Subscribe to sessions
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

    const handleNewSession = () => {
        const newSession = resetSession();
        // Don't save to DB immediately - wait for content
        saveSessionToHistory(newSession, true);
        navigate(`/session/${newSession.sessionId}`);
    };

    const handleSwitchSession = (sessionId: string) => {
        navigate(`/session/${sessionId}`);
    };

    const handleDeleteSession = async (sessionId: string) => {
        // Optimistic update
        setSessionsList(prev => prev.filter(s => s.sessionId !== sessionId));

        // Delete from persistence
        deleteSessionFromHistory(sessionId);
        if (currentUser) {
            await deleteUserSession(currentUser.uid, sessionId);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex font-sans selection:bg-sky-200 dark:selection:bg-sky-900 overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent dark:from-sky-900/20 dark:via-transparent dark:to-transparent opacity-70"></div>

            <SessionSidebar
                sessions={sessionsList}
                currentSessionId={''}
                onSessionSelect={handleSwitchSession}
                onNewSession={handleNewSession}
                onRenameSession={() => { }} // Read-only context info mostly
                onDeleteSession={handleDeleteSession}
                onHome={() => navigate('/dashboard')}
                onOptimize={() => { }} // Already on Optimize page
                onWiki={() => navigate('/wiki')}
                onCoverLetter={() => navigate('/cover-letter')}
                onLanding={() => navigate('/')}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                width={sidebarWidth}
                setWidth={setSidebarWidth}
                listTitle="Recent Optimizations"
            />

            <div className="relative z-10 flex flex-col flex-1 min-w-0 h-screen">
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onHome={() => navigate('/')}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Resume Optimizer</h1>
                            <p className="text-slate-600 dark:text-slate-400 text-lg">
                                Create new resume optimizations or manage your existing sessions.
                            </p>
                        </div>

                        {/* Section 1: Create New */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Plus size={20} className="text-sky-500" />
                                Start Fresh
                            </h2>
                            <button
                                onClick={handleNewSession}
                                className="group w-full md:w-auto p-6 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-left flex flex-col items-start relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Target size={100} />
                                </div>
                                <div className="relative z-10">
                                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                        <Plus size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">New Optimization</h3>
                                    <p className="text-sky-100 mb-6 max-w-sm">
                                        Tailor your resume for a specific job description using AI-powered analysis.
                                    </p>
                                    <span className="inline-flex items-center font-medium bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                        Start Now <ArrowRight size={16} className="ml-2" />
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Section 2: Recent History */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock size={20} className="text-slate-400" />
                                Recent Optimizations
                            </h2>

                            {sessionsList.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <p className="text-slate-500 dark:text-slate-400">No history found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sessionsList.map((session) => (
                                        <button
                                            key={session.sessionId}
                                            onClick={() => handleSwitchSession(session.sessionId)}
                                            className="group p-6 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg transition-all duration-300 text-left flex flex-col h-full relative overflow-hidden"
                                        >
                                            <div className="flex items-start justify-between w-full mb-4">
                                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-sky-900/20 dark:group-hover:text-sky-400 transition-colors">
                                                    <FileText size={24} />
                                                </div>
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                    {new Date(session.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                {session.title || 'Untitled Session'}
                                            </h3>

                                            <div className="mt-auto pt-4 flex items-center text-sm font-medium text-sky-600 dark:text-sky-400 group-hover:underline">
                                                Continue Editing <ArrowRight size={16} className="ml-1" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
