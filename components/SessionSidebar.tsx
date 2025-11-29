import * as React from 'react';
import { Plus, MessageSquare, Edit2, Check, X, Trash2, GripVertical, Calendar, AlertTriangle, PanelLeftClose, Home } from 'lucide-react';
import type { SessionSummary } from '../services/firestoreService';

interface SessionSidebarProps {
    sessions: SessionSummary[];
    currentSessionId: string;
    onSessionSelect: (sessionId: string) => void;
    onNewSession: () => void;
    onRenameSession: (sessionId: string, newTitle: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onHome: () => void;
    isOpen: boolean;
    onToggle: () => void;
    width: number;
    setWidth: (width: number) => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
    sessions,
    currentSessionId,
    onSessionSelect,
    onNewSession,
    onRenameSession,
    onDeleteSession,
    onHome,
    isOpen,
    onToggle,
    width,
    setWidth
}) => {
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = React.useState<string | null>(null);
    const sidebarRef = React.useRef<HTMLDivElement>(null);
    const isResizing = React.useRef(false);

    // Group sessions by date
    const groupedSessions = React.useMemo(() => {
        const groups: { [key: string]: SessionSummary[] } = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        sessions.forEach(session => {
            const date = new Date(session.updatedAt);
            const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (sessionDate.getTime() === today.getTime()) {
                groups['Today'].push(session);
            } else if (sessionDate.getTime() === yesterday.getTime()) {
                groups['Yesterday'].push(session);
            } else if (sessionDate > lastWeek) {
                groups['Previous 7 Days'].push(session);
            } else {
                groups['Older'].push(session);
            }
        });

        return groups;
    }, [sessions]);

    const startEditing = (e: React.MouseEvent, session: SessionSummary) => {
        e.stopPropagation();
        setEditingId(session.sessionId);
        setEditValue(session.title);
    };

    const saveEditing = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (editValue.trim()) {
            onRenameSession(sessionId, editValue.trim());
        }
        setEditingId(null);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const confirmDelete = (e: React.MouseEvent, sessionId: string) => {
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

    const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
        if (e.key === 'Enter') {
            if (editValue.trim()) {
                onRenameSession(sessionId, editValue.trim());
            }
            setEditingId(null);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    // Resize logic
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = Math.max(200, Math.min(480, e.clientX));
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [setWidth]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
    };

    return (
        <>
            <div
                ref={sidebarRef}
                className={`fixed md:relative z-20 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none'}`}
                style={{ width: isOpen ? `${width}px` : undefined }}
            >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        ATS <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-emerald-600 dark:from-sky-400 dark:to-emerald-400">Buddy</span>
                    </h1>
                    <button
                        onClick={onToggle}
                        className="p-2 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        title="Close Sidebar"
                    >
                        <PanelLeftClose size={20} />
                    </button>
                </div>

                <div className="px-3 py-2 space-y-1">
                    <button
                        onClick={onHome}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Home size={18} />
                        Home
                    </button>
                </div>

                <div className="px-4 py-2 flex justify-between items-center bg-transparent">
                    <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chats</h2>
                    <button
                        onClick={onNewSession}
                        className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-all shadow-sm hover:shadow-md active:scale-95"
                        title="New Session"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                <MessageSquare className="opacity-50" size={20} />
                            </div>
                            <p>No history yet</p>
                            <button onClick={onNewSession} className="mt-2 text-sky-500 hover:text-sky-600 text-xs font-medium">Start a new session</button>
                        </div>
                    ) : (
                        Object.entries(groupedSessions).map(([group, groupSessions]) => {
                            if (groupSessions.length === 0) return null;
                            return (
                                <div key={group}>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 flex items-center gap-1.5 opacity-80">
                                        {group}
                                    </h3>
                                    <div className="space-y-0.5">
                                        {groupSessions.map((session) => (
                                            <div
                                                key={session.sessionId}
                                                onClick={() => onSessionSelect(session.sessionId)}
                                                className={`group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${currentSessionId === session.sessionId
                                                    ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                {editingId === session.sessionId ? (
                                                    <div className="flex items-center" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            onKeyDown={e => handleKeyDown(e, session.sessionId)}
                                                            className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-900 border border-sky-500 rounded focus:outline-none"
                                                            autoFocus
                                                        />
                                                        <div className="flex ml-1 gap-0.5">
                                                            <button onClick={e => saveEditing(e, session.sessionId)} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Check size={14} /></button>
                                                            <button onClick={cancelEditing} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X size={14} /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`text-sm font-medium truncate leading-tight mb-1 ${currentSessionId === session.sessionId ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                                                                {session.title}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 truncate font-medium">
                                                                {new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-1 transition-opacity duration-200 ${currentSessionId === session.sessionId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                            <button
                                                                onClick={(e) => startEditing(e, session)}
                                                                className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-md transition-colors"
                                                                title="Rename"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => confirmDelete(e, session.sessionId)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Active Indicator Bar (Optional, purely decorative) */}
                                                {currentSessionId === session.sessionId && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-sky-500 rounded-r-full" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Resize Handle */}
                {isOpen && (
                    <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-sky-500/50 transition-colors z-30 group/handle"
                        onMouseDown={startResizing}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 right-0.5 opacity-0 group-hover/handle:opacity-100 transition-opacity">
                            <GripVertical size={16} className="text-slate-400" />
                        </div>
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
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Session?</h3>
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
        </>
    );
};
