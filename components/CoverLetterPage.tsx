import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Download, RefreshCw, AlertCircle, ArrowLeft, Check, FileText, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { loadSessionById, subscribeToUserSessions, saveUserSession, deleteUserSession, type SessionSummary } from '../services/dbService';
import { getLocalSessions, loadLocalSession, saveSessionToHistory, saveAnalysis, deleteSessionFromHistory } from '../services/sessionService';
import { generateCoverLetter, generateCoverLetterVariations } from '../services/agentOrchestrator';
import { SessionSidebar } from './SessionSidebar';
import { Header } from './Header';
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
    const handleSwitchSession = (id: string) => {
        navigate(`/cover-letter/${id}`);
        // Close sidebar on mobile after selection
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleDeleteSession = async (idToDelete: string) => {
        // Confirmation is handled by SessionSidebar UI
        try {
            // 1. Fetch full session data
            let sessionToUpdate = (await loadSessionById(currentUser?.uid || '', idToDelete)) || loadLocalSession(idToDelete);

            if (!sessionToUpdate) {
                console.error("Session not found for deletion");
                return;
            }

            // 2. Remove Cover Letter Data ONLY
            // We do NOT delete the session itself, as it contains the resume/JD/chat
            if (sessionToUpdate.analysis) {
                delete sessionToUpdate.analysis.coverLetter;
            }

            // 3. Save Updated Session
            saveSessionToHistory(sessionToUpdate);
            if (currentUser) {
                await saveUserSession(currentUser.uid, sessionToUpdate);
            }

            // 4. Update UI List State
            // Instead of removing it, we mark it as not having a cover letter
            setSessionsList(prev => prev.map(s =>
                s.sessionId === idToDelete
                    ? { ...s, hasCoverLetter: false }
                    : s
            ));

            // 5. Navigation/View Update
            if (idToDelete === sessionId) {
                // Determine if we should navigate or just refresh
                // If we are on the specific page, refresh the local session state so it shows "Draft New"
                setSession({ ...sessionToUpdate });

                // Optional: If you want to kick them back to the list:
                // navigate('/cover-letter'); 
                // But staying on the page in "Draft Mode" is better UX for "Undo/Redo" or "Try Again"
            }
        } catch (err) {
            console.error("Failed to delete cover letter", err);
            setError("Failed to delete cover letter");
        }
    };

    const handleGenerate = async () => {
        if (!session || !session.jobDescriptionText) return;

        let resumeText = '';
        if (source === 'optimized') {
            resumeText = session.analysis?.optimiser?.output?.markdown || '';
            // Fallback if no optimized resume exists
            if (!resumeText) {
                if (confirm("No optimized resume found. Do you want to use the original resume instead?")) {
                    setSource('original');
                    resumeText = session.resumeText;
                } else {
                    return;
                }
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

                const updatedSession = {
                    ...session,
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
                            {withCL.map((session) => (
                                <button
                                    key={session.sessionId}
                                    onClick={() => handleSwitchSession(session.sessionId)}
                                    className="group p-6 rounded-xl bg-white dark:bg-slate-800 border-2 border-sky-100 dark:border-sky-900/30 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg transition-all duration-300 text-left flex flex-col h-full relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                        READY
                                    </div>
                                    <div className="flex items-start justify-between w-full mb-4">
                                        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
                                            <FileText size={24} />
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                            {new Date(session.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                        {session.title || 'Untitled Session'}
                                    </h3>

                                    <div className="mt-auto pt-4 flex items-center text-sm font-medium text-sky-600 dark:text-sky-400 group-hover:underline">
                                        View / Download <ArrowRight size={16} className="ml-1" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 2: Create New (Sessions without Cover Letters) */}
                {withoutCL.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <RefreshCw size={20} className="text-slate-400" />
                            Draft New Cover Letter
                        </h2>
                        <p className="text-sm text-slate-500">Select a session to generate a cover letter for the first time.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                            {withoutCL.map((session) => (
                                <button
                                    key={session.sessionId}
                                    onClick={() => handleSwitchSession(session.sessionId)}
                                    className="group p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-300 text-left flex flex-col h-full"
                                >
                                    <div className="flex items-start justify-between w-full mb-4">
                                        <div className="p-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                            <FileText size={24} />
                                        </div>
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                            {new Date(session.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2 line-clamp-1">
                                        {session.title || 'Untitled Session'}
                                    </h3>

                                    <div className="mt-auto pt-4 flex items-center text-sm font-medium text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                                        Refine & Generate <ArrowRight size={16} className="ml-1" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
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
                    onHome={() => navigate('/home')}
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
                                        For: <span className="font-medium text-sky-600 dark:text-sky-400">{session?.title || 'Untitled Session'}</span>
                                    </p>
                                </div>

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
                                    <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <p className="text-slate-500 dark:text-slate-400 mb-2">No cover letter generated yet.</p>
                                        <p className="text-sm text-slate-400 dark:text-slate-500">
                                            Select a source and click Generate to create one.
                                        </p>
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
        </div>
    );
};
