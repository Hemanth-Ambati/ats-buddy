import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, Book, Menu, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../Header';

interface WikiSection {
    id: string;
    title: string;
    content: string;
    subsections?: WikiSection[];
}

const wikiData: WikiSection[] = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        content: `
# Getting Started with ATS Buddy

Welcome to **ATS Buddy**, your AI-powered assistant for optimizing resumes to beat Applicant Tracking Systems (ATS).

## What is ATS Buddy?

ATS Buddy helps you tailor your resume to specific job descriptions, increasing your chances of getting interviewed. It uses advanced AI to analyze your resume against job requirements and provides actionable feedback.

## Key Features

- **AI Analysis**: Get a detailed score and breakdown of your resume's performance.
- **Keyword Optimization**: Identify missing keywords and learn how to incorporate them.
- **Smart Formatting**: Ensure your resume is formatted correctly for ATS parsing.
- **History Tracking**: Keep track of all your optimizations and versions.
        `
    },
    {
        id: 'how-it-works',
        title: 'How It Works',
        content: `
# How It Works

The optimization process is simple and effective:

1. **Upload Resume**: Upload your existing resume (PDF or DOCX).
2. **Paste Job Description**: Copy and paste the job description you are applying for.
3. **Analyze**: Click "Optimize" to let the AI analyze the match.
4. **Review Feedback**:
    - Check your **ATS Score**.
    - Review **Missing Keywords**.
    - Read specific **Suggestions**.
5. **Edit & Refine**: Use the built-in editor to make changes and re-analyze.
        `
    },
    {
        id: 'ats-guide',
        title: 'ATS Guide',
        content: `
# Understanding ATS (Applicant Tracking Systems)

## What is an ATS?

An Applicant Tracking System (ATS) is software used by employers to manage the hiring process. It scans and ranks resumes before a human ever sees them.

## How Scoring Works

ATS algorithms look for:
- **Keywords**: Specific skills, tools, and qualifications mentioned in the job description.
- **Formatting**: Clean, simple layouts that are easy to parse.
- **Relevance**: How well your experience matches the job requirements.

## Tips for Success

- Use standard section headings (e.g., "Experience", "Education").
- Avoid graphics, columns, and tables that can confuse parsers.
- Use standard fonts like Arial, Calibri, or Helvetica.
- Save your resume as a DOCX or PDF (text-based).
        `
    },
    {
        id: 'cover-letters',
        title: 'Cover Letters',
        content: `
# AI Cover Letter Generator

ATS Buddy doesn't just fix your resume—it writes tailored cover letters for you.

## 3 Unique Version Styles

Every time you click **Generate**, the AI simultaneously creates **3 distinct versions** of your cover letter so you can choose the best fit:

1.  **Professional & Direct**
    - A polished, standard business letter.
    - Focuses on clarity, professionalism, and concise matching of skills.
    - Best for: Corporate jobs, large enterprises.

2.  **Achievement Focused**
    - A bold, metrics-driven approach.
    - Highlights your biggest wins and the impact you can make immediately.
    - Best for: Sales, Leadership, and specialized high-impact roles.

3.  **Passionate & Cultural**
    - A narrative, storytelling style.
    - Focuses on your "why"—your mission alignment and cultural fit.
    - Best for: Startups, Non-profits, and mission-driven companies.

## Smart Features

### Side-by-Side Comparison
You can view all 3 drafted versions side-by-side. Read the previews and click **"Version [Style]"** to select the one you want to finalize.

### Safe Delete
Managing your cover letters is worry-free.
- **"Delete Cover Letter"** only removes the draft letters.
- It **does NOT** delete your Optimized Resume or Chat History.
- You can always regenerate a new set of letters for that session later.
        `
    },
    {
        id: 'faq',
        title: 'FAQ',
        content: `
# Frequently Asked Questions

### Is my data safe?
Yes, your resumes and job descriptions are processed securely and are not shared with third parties.

### Can I save my sessions?
Yes, all your optimization sessions are automatically saved to your history, accessible from the sidebar.

### How accurate is the score?
The score is an estimate based on common ATS criteria. While it's a strong indicator, human review is always recommended.
        `
    }
];

export const WikiPage: React.FC = () => {
    const [activeSection, setActiveSection] = React.useState<string>(wikiData[0].id);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const filteredData = React.useMemo(() => {
        if (!searchQuery) return wikiData;
        return wikiData.filter(section =>
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const activeContent = wikiData.find(s => s.id === activeSection)?.content || '# Section not found';

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-sky-600 dark:text-sky-400">
                        <Book size={24} />
                        <span>Wiki</span>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="text-xs text-slate-500 hover:text-sky-500">
                        Back to App
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search documentation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredData.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${activeSection === section.id
                                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {section.title}
                            {activeSection === section.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Header
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onHome={() => navigate('/dashboard')}
                />
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <h2 className="font-semibold text-lg truncate">
                        {wikiData.find(s => s.id === activeSection)?.title}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    <div className="max-w-3xl mx-auto prose dark:prose-invert prose-sky prose-headings:font-bold prose-a:text-sky-600 hover:prose-a:text-sky-500">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {activeContent}
                        </ReactMarkdown>

                        {activeSection === 'ats-guide' && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-8 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex items-center gap-2"
                                >
                                    Lets get started
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            {(() => {
                                const currentIndex = wikiData.findIndex(s => s.id === activeSection);
                                const prevSection = wikiData[currentIndex - 1];
                                const nextSection = wikiData[currentIndex + 1];

                                return (
                                    <>
                                        {prevSection ? (
                                            <button
                                                onClick={() => setActiveSection(prevSection.id)}
                                                className="flex flex-col items-start gap-1 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-left"
                                            >
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Previous</span>
                                                <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:underline flex items-center gap-1">
                                                    &larr; {prevSection.title}
                                                </span>
                                            </button>
                                        ) : <div />}

                                        {nextSection ? (
                                            <button
                                                onClick={() => setActiveSection(nextSection.id)}
                                                className="flex flex-col items-end gap-1 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-right"
                                            >
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Next</span>
                                                <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:underline flex items-center gap-1">
                                                    {nextSection.title} &rarr;
                                                </span>
                                            </button>
                                        ) : <div />}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
