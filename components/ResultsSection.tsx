import * as React from 'react';
import type { AnalysisResult, AgentStage } from '../types';
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
    <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
    <div className="space-y-4">
      <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
    </div>
    <div className="space-y-4">
      <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
    </div>
  </div>
);

const Placeholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Analysis Results</h3>
    <p className="mt-2 text-slate-500 dark:text-slate-400">Your resume analysis and optimization will appear here once completed.</p>
  </div>
);

const StageBadge: React.FC<{ stage: AgentStage<unknown> }> = ({ stage }) => {
  const labelMap: Record<string, string> = {
    jdAnalysis: 'JD Analysis',
    keywordAnalysis: 'Keyword Map',
    scoring: 'ATS Score',
    optimiser: 'Optimizer',
    formatter: 'Formatter',
  };

  const color = stage.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    : stage.status === 'running' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
      : stage.status === 'failed' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  const duration = stage.startedAt && stage.finishedAt ? `${Math.max(1, Math.round((stage.finishedAt - stage.startedAt)))}ms` : '';

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${color}`}>
      <span className="text-sm font-semibold">{labelMap[stage.name]}</span>
      <span className="text-xs font-medium">{stage.status.toUpperCase()} {duration && `• ${duration}`}</span>
    </div>
  );
};

export const ResultsSection: React.FC<ResultsSectionProps> = ({ result, isLoading, error }) => {
  const stageList = result ? [result.jdAnalysis, result.keywordAnalysis, result.scoring, result.optimiser, result.formatter] : [];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3 mb-6">AI Analysis</h2>

      <div className="min-h-[500px] space-y-6">
        {isLoading && !result && <LoadingSkeleton />}
        {error && <div className="text-rose-600 bg-rose-50 border border-rose-200 p-4 rounded-lg">{error}</div>}
        {!isLoading && !error && !result && <Placeholder />}
        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stageList.map((stage) => (
                <StageBadge key={stage.name} stage={stage} />
              ))}
            </div>
            {result.scoring.output && (
              <ScoreCard score={result.scoring.output?.overall} summary={result.scoring.output?.alignmentNotes} />
            )}
            <KeywordAnalysis analysis={result.keywordAnalysis.output} />
            <OptimizedResume resumeText={result.formatter.output?.markdown || result.optimiser.output?.markdown} />
          </div>
        )}
      </div>
    </div>
  );
};
