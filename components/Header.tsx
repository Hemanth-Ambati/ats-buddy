import * as React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-3xl font-bold text-slate-100">
          ATS <span className="text-sky-400">Buddy</span>
        </h1>
        <p className="text-slate-300 mt-1">
          Optimize your resume for any job description with AI-powered analysis.
        </p>
      </div>
    </header>
  );
};