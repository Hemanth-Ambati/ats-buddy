import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Download, RefreshCw, AlertCircle, ArrowLeft, Check, FileText, ArrowRight, Mail, Plus, Trash2, Edit3, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getLocalSessions, loadLocalSession, saveSessionToHistory, saveAnalysis, deleteSessionFromHistory, resetSession, renameSessionInHistory } from '../services/sessionService';
import { subscribeToUserSessions, deleteUserSession, renameUserSession, type SessionSummary, loadSessionById, saveUserSession, getUserProfileResume } from '../services/dbService';
import { generateCoverLetter, generateCoverLetterVariations } from '../services/agentOrchestrator';
import { SessionSidebar } from './SessionSidebar';
import { Header } from './Header';
import { parseFile } from '../services/fileParser';
import type { SessionState, CoverLetter } from '../types';

export const CoverLetterPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // State
    const [session, setSession] = React.useState<SessionState | null>(null);
    const [sessionsList, setSessionsList] = React.useState<SessionSummary[]>(() => getLocalSessions());
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [sidebarWidth, setSidebarWidth] = React.useState(288);
    const [source, setSource] = React.useState<'optimized' | 'original'>('optimized');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [copied, setCopied] = React.useState(false);
    const [isParsing, setIsParsing] = React.useState(false);
    const [parseError, setParseError] = React.useState<string | null>(null);
    const [isResumeFromProfile, setIsResumeFromProfile] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Inline rename & delete state
    const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
    const [editTitle, setEditTitle] = React.useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = React.useState<string | null>(null);

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

    // Load active session
    React.useEffect(() => {
        const loadData = async () => {
            if (!sessionId) {
                setSession(null);
                return;
            }

            // Try local first
            const localSession = loadLocalSession(sessionId);
            if (localSession) {
                setSession(localSession);
            }

            // Sync with remote if authenticated
            if (currentUser) {
                try {
                    const remoteSession = await loadSessionById(currentUser.uid, sessionId);
                    if (remoteSession) {
                        setSession(remoteSession);
                    } else if (!localSession) {
                        setError("Session not found");
                    }
                } catch (err) {
                    console.error("Failed to load session", err);
                }
            }
        };

        loadData();
    }, [sessionId, currentUser]);

    // Handlers
    const handleNewCoverLetterSession = async () => {
        const newSession = resetSession();
        newSession.title = 'New Cover Letter';
        saveSessionToHistory(newSession, true);
        if (currentUser) {
            await saveUserSession(currentUser.uid, newSession);
        }
        navigate(`/cover-letter/${newSession.sessionId}`);
    };

    const handleSwitchSession = (id: string) => {
        navigate(`/cover-letter/${id}`);
        // Close sidebar on mobile after selection
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        // 1. Fetch full session to determine type
        let sessionToUpdate = (await loadSessionById(currentUser?.uid || '', sessionId)) || loadLocalSession(sessionId);

        if (!sessionToUpdate) {
            console.error("Session not found for deletion");
            return;
        }

        // 2. Logic: Conditional Delete
        // If it's an optimizer session (has resume analysis), ONLY delete cover letter.
        // If it's a standalone/fresh session, DELETE the entire session.
        const isOptimizerSession = !!(sessionToUpdate.analysis?.optimiser);

        if (isOptimizerSession && sessionToUpdate.analysis?.coverLetter) {
            // Case A: Optimizer Session -> Delete CL Only
            delete sessionToUpdate.analysis.coverLetter;

            // Persist Update
            saveSessionToHistory(sessionToUpdate);
            if (currentUser) {
                await saveUserSession(currentUser.uid, sessionToUpdate);
            }

            // Update UI: Move from "Has CL" to "No CL" list
            setSessionsList(prev => prev.map(s =>
                s.sessionId === sessionId ? { ...s, hasCoverLetter: false } : s
            ));

            // If we are currently viewing this session, reload it to reflect deletion
            if (session?.sessionId === sessionId) {
                setSession(sessionToUpdate);
            }
        } else {
            // Case B: Fresh Session or No Optimizer Data -> Full Delete
            // Optimistic update
            setSessionsList(prev => prev.filter(s => s.sessionId !== sessionId));

            // Delete from persistence
            deleteSessionFromHistory(sessionId);
            if (currentUser) {
                await deleteUserSession(currentUser.uid, sessionId);
            }

            // If current session is deleted, navigate home
            if (sessionId === session?.sessionId) {
                navigate('/cover-letter');
                setSession(null);
            }
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

        // Update current session if matching
        if (session?.sessionId === sessionId) {
            setSession(prev => prev ? ({ ...prev, title: newTitle }) : null);
        }
    };

    const handleStartRename = (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingSessionId(sessionId);
        setEditTitle(currentTitle || 'New Cover Letter');
    };

    const handleConfirmRename = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            handleRenameSession(sessionId, editTitle.trim());
        }
        setEditingSessionId(null);
        setEditTitle('');
    };

    const handleCancelRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSessionId(null);
        setEditTitle('');
    };

    const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setDeleteConfirmationId(sessionId);
    };

    const executeDelete = () => {
        if (deleteConfirmationId) {
            handleDeleteSession(deleteConfirmationId);
            setDeleteConfirmationId(null);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmationId(null);
    };



    const handleGenerate = async () => {
        if (!session || !session.jobDescriptionText) return;

        let resumeText = '';
        if (source === 'optimized') {
            resumeText = session.analysis?.optimiser?.output?.markdown || '';
            // Fallback to original resume if no optimized version exists
            if (!resumeText) {
                resumeText = session.resumeText;
            }
        } else {
            resumeText = session.resumeText;
        }

        if (!resumeText) {
            setError("No resume content found to generate cover letter.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {

            const result = await generateCoverLetterVariations(resumeText, session.jobDescriptionText, session.sessionId);

            if (result.status === 'completed' && result.outputs.length > 0) {
                const newVersions = result.outputs.map(output => ({
                    id: crypto.randomUUID(),
                    markdown: output.markdown,
                    createdAt: Date.now(),
                    style: output.style
                }));

                const updatedOutput = {
                    markdown: newVersions[0].markdown, // Default content (though unselected)
                    versions: newVersions,
                    selectedId: undefined // Explicitly undefined to trigger comparison view
                };

                // Extract job title and company from JD to auto-name the session
                // Uses the extracted metadata from the agent response
                let newTitle = session.title;
                const firstOutput = result.outputs[0];

                if ((!session.title || session.title === 'New Cover Letter' || session.title === 'Untitled Session')) {
                    const jobTitle = firstOutput.jobTitle || '';
                    const company = firstOutput.company || '';

                    if (jobTitle && company) {
                        newTitle = `${jobTitle} at ${company}`;
                    } else if (jobTitle) {
                        newTitle = jobTitle;
                    } else if (company) {
                        newTitle = `Role at ${company}`;
                    }
                }

                const updatedSession = {
                    ...session,
                    title: newTitle,
                    analysis: {
                        ...session.analysis!,
                        coverLetter: {
                            name: 'coverLetter' as const,
                            status: 'completed' as const,
                            output: updatedOutput
                        }
                    }
                };

                setSession(updatedSession);
                saveSessionToHistory(updatedSession);

                // Update sessionsList with new title
                setSessionsList(prev => prev.map(s =>
                    s.sessionId === session.sessionId
                        ? { ...s, title: newTitle, hasCoverLetter: true }
                        : s
                ));

                if (currentUser) {
                    await saveUserSession(currentUser.uid, updatedSession);
                }
            } else {
                throw new Error(result.error || "Generation failed");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCompare = async () => {
        if (!session?.analysis?.coverLetter?.output) return;

        const updatedSession = { ...session };
        if (updatedSession.analysis?.coverLetter?.output) {
            updatedSession.analysis.coverLetter.output.selectedId = undefined;
        }
        setSession(updatedSession);
        // We don't necessarily need to persist "unselected" state to DB, but good for consistency
        saveSessionToHistory(updatedSession);
    };

    const handleVersionSelect = async (versionId: string) => {
        if (!session?.analysis?.coverLetter?.output?.versions) return;

        const selectedVersion = session.analysis.coverLetter.output.versions.find(v => v.id === versionId);
        if (selectedVersion) {
            const updatedSession = { ...session! }; // Ensure non-null, we know it exists if we are here
            if (updatedSession.analysis?.coverLetter?.output) {
                updatedSession.analysis.coverLetter.output.selectedId = versionId;
                updatedSession.analysis.coverLetter.output.markdown = selectedVersion.markdown;
            }

            setSession(updatedSession);
            saveSessionToHistory(updatedSession);
            if (currentUser) {
                await saveUserSession(currentUser.uid, updatedSession);
            }
        }
    };

    const handleCopy = () => {
        const text = session?.analysis?.coverLetter?.output?.markdown;
        if (text) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadPDF = () => {
        const text = session?.analysis?.coverLetter?.output?.markdown;
        if (!text) return;

        import('jspdf').then(({ jsPDF }) => {
            const doc = new jsPDF();

            // Configuration
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            let y = 20;

            doc.setFont("times", "normal");
            doc.setFontSize(10);

            // 1. Clean basic markdown symbols for the PDF text
            const cleanText = text.replace(/\*\*/g, '').replace(/## /g, '').replace(/### /g, '');

            // 2. Split into paragraphs/lines first to preserve user structure
            const paragraphs = cleanText.split(/\r?\n/);

            paragraphs.forEach(paragraph => {
                // If explicit empty line, add extra spacing (smaller now)
                if (!paragraph.trim()) {
                    y += 5;
                    return;
                }

                // Wrap text
                const splitLines = doc.splitTextToSize(paragraph, maxWidth);

                // Check page bounds
                const blockHeight = splitLines.length * 5; // Reduced 6 -> 5 for tighter packing
                if (y + blockHeight > pageHeight - margin) {
                    doc.addPage();
                    y = 20;
                }

                doc.text(splitLines, margin, y);
                y += blockHeight; // Move y down by the total height of this paragraph
            });

            doc.save(`Cover_Letter_${session.title?.replace(/\s+/g, '_') || 'Draft'}.pdf`);
        });
    };

    const handleDownloadDOCX = async () => {
        const text = session?.analysis?.coverLetter?.output?.markdown;
        if (!text) return;

        const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');

        // Split by lines to determine structure
        const lines = text.split(/\r?\n/);

        const docChildren = lines.map(line => {
            // Identify Header/Contact Info heuristics (simple version)
            // If line is short and looks like email/phone, maybe center it?
            // For now, standard left align with paragraph spacing is safe.

            // Basic formatting parsing (Bold)
            const parts = line.split(/(\*\*.*?\*\*)/g);
            const children = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.replace(/\*\*/g, ''),
                        bold: true,
                        size: 20, // 10pt (docx uses half-points)
                        font: "Times New Roman"
                    });
                }
                return new TextRun({
                    text: part,
                    size: 20, // 10pt
                    font: "Times New Roman"
                });
            });

            // Add spacers for empty lines or standard paragraph spacing
            if (!line.trim()) {
                return new Paragraph({ children: [], spacing: { after: 0 } }); // Empty spacer
            }

            return new Paragraph({
                children: children,
                alignment: AlignmentType.LEFT,
                spacing: {
                    after: 120, // 6pt space after paragraphs
                    line: 276,  // 1.15 line spacing
                }
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: docChildren,
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cover_Letter_${session.title?.replace(/\s+/g, '_') || 'Draft'}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Render helpers
    const renderSessionSelection = () => {
        const withCL = sessionsList.filter(s => s.hasCoverLetter);
        const withoutCL = sessionsList.filter(s => !s.hasCoverLetter);

        // If no sessions at all
        if (sessionsList.length === 0) {
            return (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border dashed border-slate-300 dark:border-slate-700 max-w-2xl mx-auto">
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-full inline-block mb-4">
                        <RefreshCw size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Sessions Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Create a new optimization session from the Home page to get started.
                    </p>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            );
        }

        const renderSessionCard = (session: SessionSummary) => (
            <button
                key={session.sessionId}
                onClick={() => handleSwitchSession(session.sessionId)}
                className="group p-6 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg transition-all duration-300 text-left flex flex-col h-full relative overflow-hidden"
            >
                {/* Action Buttons - Only for sessions with cover letters */}
                {session.hasCoverLetter && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 z-10" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={(e) => handleStartRename(e, session.sessionId, session.title || '')}
                            className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-md transition-colors"
                            title="Rename"
                        >
                            <Edit3 size={14} />
                        </button>
                        <button
                            onClick={(e) => handleDeleteClick(e, session.sessionId)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                <div className="flex items-start justify-between w-full mb-4">
                    <div className={`p-3 rounded-xl ${session.hasCoverLetter ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                        <FileText size={24} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {new Date(session.updatedAt).toLocaleDateString()}
                    </span>
                </div>

                {editingSessionId === session.sessionId ? (
                    <div className="mb-2 z-20" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1 text-sm border border-sky-500 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmRename(e as any, session.sessionId);
                                    if (e.key === 'Escape') handleCancelRename(e as any);
                                }}
                            />
                            <button
                                onClick={(e) => handleConfirmRename(e, session.sessionId)}
                                className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={handleCancelRename}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {session.title || 'Untitled Session'}
                    </h3>
                )}

                <div className={`mt-auto pt-4 flex items-center text-sm font-medium group-hover:underline ${session.hasCoverLetter ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {session.hasCoverLetter ? 'View / Download' : 'Generate Cover Letter'} <ArrowRight size={16} className="ml-1" />
                </div>
            </button>
        );

        return (
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cover Letters</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Manage your cover letters or create new ones from your optimized resumes.
                    </p>
                </div>

                {/* Section 1: History (Existing Cover Letters) */}
                {withCL.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Mail size={20} className="text-sky-500" />
                            Your Cover Letters
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {withCL.map(renderSessionCard)}
                        </div>
                    </div>
                )}

                {/* Section 2: Create New (Sessions without Cover Letters) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <RefreshCw size={20} className="text-slate-400" />
                        Draft New Cover Letter
                    </h2>
                    <p className="text-sm text-slate-500">Start fresh or select a session to generate a cover letter.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Start Fresh Card */}
                        <button
                            onClick={handleNewCoverLetterSession}
                            className="group p-6 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-left flex flex-col h-full relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Plus size={100} />
                            </div>
                            <div className="relative z-10 w-full">
                                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <Plus size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Start Fresh</h3>
                                <p className="text-fuchsia-100 mb-4 text-sm">
                                    Paste your resume and job description to generate a cover letter directly.
                                </p>
                                <span className="inline-flex items-center font-medium bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors text-sm">
                                    Get Started <ArrowRight size={16} className="ml-2" />
                                </span>
                            </div>
                        </button>

                        {/* Existing Sessions */}
                        {withoutCL.map(renderSessionCard)}
                    </div>
                </div>
            </div>
        );
    };

    const renderComparisonGrid = () => {
        const versions = session?.analysis?.coverLetter?.output?.versions;
        if (!versions) return null;

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose Your Style</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        We generated 3 different versions based on your profile. Select the one that matches your vibe.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {versions.map((v, idx) => (
                        <div key={v.id} className="flex flex-col bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                            {/* Header */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                    Option {idx + 1}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                                    {v.style || 'Professional'}
                                </h3>
                            </div>

                            {/* Preview Body */}
                            <div className="p-6 flex-1 bg-slate-50/30 dark:bg-slate-900/10">
                                <div className="prose dark:prose-invert prose-sm max-w-none line-clamp-[12] opacity-70 mask-image-b">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {v.markdown}
                                    </ReactMarkdown>
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-center">
                                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                        <FileText size={12} />
                                        {v.markdown.split(/\s+/).length} words
                                    </span>
                                </div>
                            </div>

                            {/* Footer / Action */}
                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => handleVersionSelect(v.id)}
                                    className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-sky-600 dark:hover:bg-sky-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    Select This Version <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex font-sans selection:bg-sky-200 dark:selection:bg-sky-900 overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-transparent to-transparent dark:from-sky-900/20 dark:via-transparent dark:to-transparent opacity-70"></div>

            <SessionSidebar
                sessions={sessionsList.filter(s => s.hasCoverLetter || (sessionId && s.sessionId === sessionId))}
                currentSessionId={sessionId || ''} // Highlight current if selected
                onSessionSelect={handleSwitchSession}
                onNewSession={() => navigate('/cover-letter')} // Go to dashboard to pick new
                onRenameSession={() => { }} // Read-only sidebar context mostly
                onDeleteSession={handleDeleteSession}
                onHome={() => navigate('/home')}
                onWiki={() => navigate('/wiki')}
                onCoverLetter={() => navigate('/cover-letter')}
                onLanding={() => navigate('/')}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                width={sidebarWidth}
                setWidth={setSidebarWidth}
                listTitle="Cover Letters"
            />

            <div className="relative z-10 flex flex-col flex-1 min-w-0 h-screen">
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onHome={() => navigate('/dashboard')}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {!sessionId ? (
                        renderSessionSelection()
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Controls Header */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Cover Letter Generator</h1>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        For: <span className="font-medium text-sky-600 dark:text-sky-400">{session?.title || 'New Cover Letter'}</span>
                                    </p>
                                </div>

                                {/* Only show source toggle and regenerate when session has optimizer analysis or cover letter */}
                                {(session?.analysis?.optimiser || session?.analysis?.coverLetter) && (
                                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1 w-full sm:w-auto">
                                            <button
                                                onClick={() => setSource('optimized')}
                                                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${source === 'optimized'
                                                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                Optimized Resume
                                            </button>
                                            <button
                                                onClick={() => setSource('original')}
                                                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${source === 'original'
                                                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                Original Resume
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !session?.jobDescriptionText}
                                            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-md shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                            {session?.analysis?.coverLetter ? 'Regenerate' : 'Generate'}
                                        </button>
                                    </div>
                                )}
                            </div>



                            {/* Error Display */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
                                    <AlertCircle size={20} />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* MAIN DISPLAY LOGIC */}
                            {session?.analysis?.coverLetter?.output?.versions && !session.analysis.coverLetter.output.selectedId ? (
                                // 1. COMPARISON MODE
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {session.analysis.coverLetter.output.versions.map((v, idx) => (
                                        <div key={v.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
                                            {/* Header */}
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                        Option {idx + 1}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                    {v.style || `Version ${idx + 1}`}
                                                </h3>
                                            </div>

                                            {/* Preview Body */}
                                            <div className="p-6 flex-1 bg-slate-50/30 dark:bg-slate-900/10 relative">
                                                <div className="prose dark:prose-invert prose-sm max-w-none h-48 overflow-hidden relative opacity-75">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {v.markdown}
                                                    </ReactMarkdown>
                                                    {/* Fade overlay */}
                                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50 dark:from-slate-900/10 to-transparent"></div>
                                                </div>
                                            </div>

                                            {/* Footer / Action */}
                                            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                                                <button
                                                    onClick={() => handleVersionSelect(v.id)}
                                                    className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-sky-600 dark:hover:bg-sky-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    Select This Version <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : session?.analysis?.coverLetter?.output ? (
                                // 2. DETAIL MODE
                                <>
                                    {/* Version Selector Bar */}
                                    {session.analysis.coverLetter.output.versions && session.analysis.coverLetter.output.versions.length > 0 && (
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                {session.analysis.coverLetter.output.versions.map((v, idx) => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => handleVersionSelect(v.id)}
                                                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap flex items-center gap-2 ${session.analysis?.coverLetter?.output?.selectedId === v.id
                                                            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                                            : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                            }`}
                                                    >
                                                        {v.style || `Version ${idx + 1}`}
                                                        <span className={`text-[10px] ${session.analysis?.coverLetter?.output?.selectedId === v.id ? 'text-sky-100' : 'text-slate-400 opacity-70'}`}>
                                                            {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    // Trigger back to comparison
                                                    const updatedSession = { ...session! };
                                                    if (updatedSession.analysis?.coverLetter?.output) {
                                                        updatedSession.analysis.coverLetter.output.selectedId = undefined; // Reset selection
                                                    }
                                                    setSession(updatedSession);
                                                }}
                                                className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1"
                                            >
                                                <RefreshCw size={12} /> Compare Variations
                                            </button>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
                                            <button
                                                onClick={handleCopy}
                                                className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-md transition-colors flex items-center gap-1.5"
                                                title="Copy to Clipboard"
                                            >
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                                <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy'}</span>
                                            </button>
                                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 my-auto mx-1"></div>
                                            <button
                                                onClick={handleDownloadPDF}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-1.5"
                                                title="Download PDF"
                                            >
                                                <Download size={16} />
                                                <span className="text-xs font-medium">PDF</span>
                                            </button>
                                            <button
                                                onClick={handleDownloadDOCX}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex items-center gap-1.5"
                                                title="Download DOCX"
                                            >
                                                <Download size={16} />
                                                <span className="text-xs font-medium">DOCX</span>
                                            </button>
                                        </div>
                                        <div className="p-8 md:p-12 prose dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {session.analysis.coverLetter.output.markdown}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                !isGenerating && (
                                    /* Input Section for New Sessions */
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">Your Details</h2>

                                        {/* Resume Input */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label htmlFor="resume" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Resume (paste or upload)
                                                </label>
                                                {currentUser && !isResumeFromProfile && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const text = await getUserProfileResume(currentUser.uid);
                                                                if (text) {
                                                                    setSession(prev => prev ? { ...prev, resumeText: text } : null);
                                                                    setIsResumeFromProfile(true);
                                                                }
                                                            } catch (err) {
                                                                setError("Failed to load profile resume");
                                                            }
                                                        }}
                                                        className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
                                                        type="button"
                                                    >
                                                        Load from Profile
                                                    </button>
                                                )}
                                            </div>

                                            {isResumeFromProfile ? (
                                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                                            <Check size={20} />
                                                            <span className="font-medium">Resume loaded from profile</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setIsResumeFromProfile(false);
                                                                setSession(prev => prev ? { ...prev, resumeText: '' } : null);
                                                            }}
                                                            className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
                                                            type="button"
                                                        >
                                                            Clear & enter manually
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <input
                                                            id="resume-file"
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                setParseError(null);
                                                                setIsParsing(true);
                                                                try {
                                                                    const text = await parseFile(file);
                                                                    if (text && text.trim()) {
                                                                        setSession(prev => prev ? { ...prev, resumeText: text } : null);
                                                                    } else {
                                                                        setParseError('No text could be extracted from the file.');
                                                                    }
                                                                } catch (err) {
                                                                    setParseError(err instanceof Error ? err.message : String(err));
                                                                } finally {
                                                                    setIsParsing(false);
                                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                                }
                                                            }}
                                                            disabled={isParsing || isGenerating}
                                                            className="text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 dark:file:bg-sky-900/50 file:text-sky-700 dark:file:text-sky-300 hover:file:bg-sky-100 dark:hover:file:bg-sky-900 transition-colors"
                                                        />
                                                        {isParsing && <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Parsing file...</span>}
                                                        {parseError && <span className="text-sm text-rose-500">{parseError}</span>}
                                                    </div>

                                                    <textarea
                                                        id="resume"
                                                        value={session?.resumeText || ''}
                                                        onChange={(e) => setSession(prev => prev ? { ...prev, resumeText: e.target.value } : null)}
                                                        placeholder="Paste the full text of your resume here..."
                                                        className="w-full h-48 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                        disabled={isGenerating || isParsing}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {/* Job Description Input */}
                                        <div>
                                            <label htmlFor="job-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Paste the Job Description
                                            </label>
                                            <textarea
                                                id="job-description"
                                                value={session?.jobDescriptionText || ''}
                                                onChange={(e) => setSession(prev => prev ? { ...prev, jobDescriptionText: e.target.value } : null)}
                                                placeholder="Paste the full job description here..."
                                                className="w-full h-48 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                disabled={isGenerating}
                                            />
                                        </div>

                                        {/* Generate Button */}
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !session?.resumeText?.trim() || !session?.jobDescriptionText?.trim()}
                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-fuchsia-100 transition-all duration-300 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <RefreshCw className="animate-spin" size={20} />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail size={20} />
                                                    Generate Cover Letter
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )
                            )}

                            {isGenerating && !session?.analysis?.coverLetter && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500 mb-4"></div>
                                    <p className="text-slate-500 animate-pulse">Drafting your cover letter...</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmationId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all">
                        {(() => {
                            const sessionToDelete = sessionsList.find(s => s.sessionId === deleteConfirmationId);
                            const isOptimizerSession = sessionToDelete?.hasOptimizer;

                            return (
                                <>
                                    <div className="flex items-center gap-4 mb-4 text-rose-600 dark:text-rose-500">
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-full">
                                            <AlertTriangle size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {isOptimizerSession ? 'Delete Cover Letter?' : 'Delete Session?'}
                                        </h3>
                                    </div>

                                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                                        {isOptimizerSession
                                            ? "Are you sure you want to delete this cover letter? The resume session will be preserved."
                                            : "Are you sure you want to delete this session? This action cannot be undone."}
                                    </p>

                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={cancelDelete}
                                            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={executeDelete}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all"
                                        >
                                            {isOptimizerSession ? 'Delete Cover Letter' : 'Delete Session'}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};
