import React from 'react';
import { Plus, Clock, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { SessionSummary } from '../services/dbService';

interface DashboardHomeProps {
    sessions: SessionSummary[];
    onNewSession: () => void;
    onSelectSession: (sessionId: string, isCoverLetter?: boolean) => void;
    onCoverLetter?: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    sessions,
    onNewSession,
    onSelectSession,
    onCoverLetter,
}) => {
    const { currentUser } = useAuth();

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour > 12 && hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-10">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                    {getGreeting()}, {currentUser?.displayName?.split(' ')[0] ? currentUser.displayName.split(' ')[0].charAt(0).toUpperCase() + currentUser.displayName.split(' ')[0].slice(1).toLowerCase() : 'there'}!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Ready to land your next dream job?
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={onNewSession}
                    className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Plus size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Plus size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">New Optimizer</h3>
                        <p className="text-sky-100 mb-6 max-w-xs">
                            Start a fresh analysis with a new resume and job description.
                        </p>
                        <span className="inline-flex items-center font-medium bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            Start Now <ArrowRight size={16} className="ml-2" />
                        </span>
                    </div>
                </button>

                <button
                    onClick={() => { if (onCoverLetter) onCoverLetter(); }}
                    className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Cover Letters</h3>
                        <p className="text-fuchsia-100 mb-6 max-w-xs">
                            Create and manage tailored cover letters for your job applications.
                        </p>
                        <span className="inline-flex items-center font-medium bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            Manage Letters <ArrowRight size={16} className="ml-2" />
                        </span>
                    </div>
                </button>
            </div>

            {/* Recent Sessions */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock size={20} className="text-slate-400" />
                        Recent Activity
                    </h2>
                </div>

                {sessions.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400">No recent activity found.</p>
                        <button
                            onClick={onNewSession}
                            className="mt-4 text-sky-600 dark:text-sky-400 font-medium hover:underline"
                        >
                            Create your first optimization
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sessions.slice(0, 6).map((session) => (
                            <button
                                key={session.sessionId}
                                onClick={() => onSelectSession(session.sessionId, !!session.hasCoverLetter)}
                                className="group p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md transition-all duration-200 text-left flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between w-full mb-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-sky-900/20 dark:group-hover:text-sky-400 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">
                                        {new Date(session.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                    {session.title || 'Untitled Session'}
                                </h3>

                                <div className="mt-auto">
                                    {session.hasCoverLetter ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800">
                                            Cover Letter
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                            Resume Optimization
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
