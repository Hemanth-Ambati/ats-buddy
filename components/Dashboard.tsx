/**
 * Dashboard Component
 * 
 * Main application interface for authenticated users.
 * Contains the resume analysis, chat, and results sections.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { resetSession, saveSessionToHistory, getLocalSessions, renameSessionInHistory, deleteSessionFromHistory } from '../services/sessionService';
import { subscribeLogger, type LogEntry } from '../services/logger';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { saveUserSession, subscribeToUserSessions, renameUserSession, deleteUserSession, type SessionSummary } from '../services/dbService';
import { SessionSidebar } from './SessionSidebar';
import { Menu } from 'lucide-react';

import { DashboardHome } from './DashboardHome';

export const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

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

    const handleNewSession = async () => {
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

    const handleRenameSession = async (sessionId: string, newTitle: string) => {
        // Optimistic local update
        setSessionsList(prev => prev.map(s =>
            s.sessionId === sessionId ? { ...s, title: newTitle } : s
        ));

        // Persist
        renameSessionInHistory(sessionId, newTitle);
        if (currentUser) {
            await renameUserSession(currentUser.uid, sessionId, newTitle);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex font-sans selection:bg-sky-200 dark:selection:bg-sky-900 overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent dark:from-sky-900/20 dark:via-transparent dark:to-transparent opacity-70"></div>

            {/* Sidebar - Full height on desktop */}
            <SessionSidebar
                sessions={sessionsList}
                currentSessionId={null} // No active session in dashboard home
                onSessionSelect={handleSwitchSession}
                onNewSession={handleNewSession}
                onRenameSession={handleRenameSession}
                onDeleteSession={handleDeleteSession}
                onHome={() => { }} // Already on home
                onWiki={() => navigate('/wiki')}
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
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onHome={() => { }}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <DashboardHome
                        sessions={sessionsList}
                        onNewSession={handleNewSession}
                        onSelectSession={handleSwitchSession}
                    />
                </main>

                <footer className="text-center p-4 text-slate-500 text-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 z-10">
                    <p>&copy; {new Date().getFullYear()} ATS Buddy. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};
