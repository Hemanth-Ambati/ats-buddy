import React from 'react';
import { Plus, Clock, FileText, ArrowRight, Trash2, Edit3, Check, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { SessionSummary } from '../services/dbService';

interface DashboardHomeProps {
    sessions: SessionSummary[];
    onNewSession: () => void;
    onSelectSession: (sessionId: string, isCoverLetter?: boolean) => void;
    onDeleteSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, newTitle: string) => void;
    onCoverLetter?: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    sessions,
    onNewSession,
    onSelectSession,
    onDeleteSession,
    onRenameSession,
    onCoverLetter,
}) => {
    const { currentUser } = useAuth();
    const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
    const [editTitle, setEditTitle] = React.useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = React.useState<string | null>(null);

    const handleStartRename = (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingSessionId(sessionId);
        setEditTitle(currentTitle || 'Untitled Session');
    };

    const handleConfirmRename = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            onRenameSession(sessionId, editTitle.trim());
        }
        setEditingSessionId(null);
        setEditTitle('');
    };

    const handleCancelRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSessionId(null);
        setEditTitle('');
    };

    const handleDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setDeleteConfirmationId(sessionId);
    };

    const executeDelete = () => {
        if (deleteConfirmationId) {
            onDeleteSession(deleteConfirmationId);
            setDeleteConfirmationId(null);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmationId(null);
    };

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
                            <div
                                key={session.sessionId}
                                onClick={() => editingSessionId !== session.sessionId && onSelectSession(session.sessionId, !!session.hasCoverLetter)}
                                className="group p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md transition-all duration-200 text-left flex flex-col h-full cursor-pointer"
                            >
                                <div className="flex items-start justify-between w-full mb-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-sky-900/20 dark:group-hover:text-sky-400 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-medium group-hover:hidden">
                                            {new Date(session.updatedAt).toLocaleDateString()}
                                        </span>
                                        <div className="hidden group-hover:flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleStartRename(e, session.sessionId, session.title)}
                                                className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 transition-colors"
                                                title="Rename"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, session.sessionId)}
                                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {editingSessionId === session.sessionId ? (
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleConfirmRename(e as any, session.sessionId);
                                                if (e.key === 'Escape') handleCancelRename(e as any);
                                            }}
                                            className="flex-1 px-2 py-1 text-sm font-semibold border border-sky-500 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={(e) => handleConfirmRename(e, session.sessionId)}
                                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={handleCancelRename}
                                            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                        {session.title || 'Untitled Session'}
                                    </h3>
                                )}

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
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmationId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100 border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Delete Session?
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                This action cannot be undone. This session will be permanently removed from your history.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDelete}
                                    className="flex-1 px-4 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors shadow-sm shadow-red-500/20 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
