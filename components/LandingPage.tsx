import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans selection:bg-sky-200 dark:selection:bg-sky-900">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        A
                    </div>
                    <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        ATS <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">Buddy</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    {currentUser ? (
                        <Link
                            to="/app"
                            className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:opacity-90 transition-opacity"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/20"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-sm font-medium mb-8 animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    Powered by Google Gemini
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
                    Beat the ATS. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500">
                        Land Your Dream Job.
                    </span>
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Optimize your resume for any job description in seconds. Our AI agents analyze keywords, score your resume, and rewrite it to pass Applicant Tracking Systems.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <Link
                        to="/signup"
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-lg hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-1 transition-all duration-300"
                    >
                        Optimize My Resume Free
                    </Link>
                    <a
                        href="#how-it-works"
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                    >
                        See How It Works
                    </a>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left mb-32">
                    <FeatureCard
                        icon={
                            <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title="Instant Scoring"
                        description="Get a detailed match score (0-100) against any job description instantly."
                    />
                    <FeatureCard
                        icon={
                            <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                        title="Keyword Analysis"
                        description="Identify missing keywords and skills that are holding your resume back."
                    />
                    <FeatureCard
                        icon={
                            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        }
                        title="AI Rewriting"
                        description="Let our AI rewrite your bullet points to perfectly align with the job requirements."
                    />
                </div>

                {/* How It Works Section */}
                <div id="how-it-works" className="max-w-5xl mx-auto scroll-mt-24">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-16">
                        How it works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-sky-200 via-blue-200 to-emerald-200 dark:from-sky-800 dark:via-blue-800 dark:to-emerald-800 -z-10"></div>

                        <StepCard
                            number="1"
                            title="Upload Resume"
                            description="Paste your resume text or upload a PDF/DOCX file."
                        />
                        <StepCard
                            number="2"
                            title="Add Job Description"
                            description="Paste the job description you want to apply for."
                        />
                        <StepCard
                            number="3"
                            title="Get Optimized"
                            description="Receive a scored analysis and an optimized version of your resume."
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
                <div className="container mx-auto px-6 text-center text-slate-500 dark:text-slate-400">
                    <p>&copy; {new Date().getFullYear()} ATS Buddy. Built for the Google AI Hackathon.</p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
);

const StepCard: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
    <div className="relative flex flex-col items-center text-center bg-white dark:bg-slate-900 p-4 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xl flex items-center justify-center mb-6 shadow-lg z-10">
            {number}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
);
