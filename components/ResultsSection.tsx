import * as React from 'react';
import type { AnalysisResult } from '../types';
import { ScoreCard } from './ScoreCard';
import { KeywordAnalysis } from './KeywordAnalysis';
import { OptimizedResume } from './OptimizedResume';

interface ResultsSectionProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-28 bg-slate-700 rounded-lg"></div>
    <div className="space-y-4">
      <div className="h-8 w-1/3 bg-slate-700 rounded"></div>
      <div className="h-20 bg-slate-700 rounded-lg"></div>
    </div>
    <div className="space-y-4">
      <div className="h-8 w-1/3 bg-slate-700 rounded"></div>
      <div className="h-40 bg-slate-700 rounded-lg"></div>
    </div>
  </div>
);

const Placeholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-300 p-8 border-2 border-dashed border-slate-700 rounded-xl">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h3 className="text-xl font-semibold text-slate-100">Analysis Results</h3>
    <p className="mt-2 text-slate-300">Your resume analysis and optimization will appear here once completed.</p>
  </div>
);

export const ResultsSection: React.FC<ResultsSectionProps> = ({ result, isLoading, error }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-slate-100 border-b border-slate-700 pb-3 mb-6">AI Analysis</h2>
      
      <div className="min-h-[500px]">
        {isLoading && <LoadingSkeleton />}
        {error && <div className="text-rose-400 bg-rose-900/30 p-4 rounded-lg">{error}</div>}
        {!isLoading && !error && !result && <Placeholder />}
        {result && (
          <div className="space-y-8">
            <ScoreCard score={result.score} summary={result.summary} />
            <KeywordAnalysis analysis={result.keywordAnalysis} />
            <OptimizedResume resumeText={result.optimizedResume} />
          </div>
        )}
      </div>
    </div>
  );
};