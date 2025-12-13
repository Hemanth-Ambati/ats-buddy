import React from 'react';

export const LoadingPage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="relative">
                {/* Pulsing effect */}
                <div className="absolute inset-0 bg-sky-500/30 rounded-2xl blur-xl animate-pulse"></div>

                {/* Logo */}
                <div className="relative w-24 h-24 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-white font-bold text-5xl">A</span>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    ATS <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">Buddy</span>
                </h2>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};
