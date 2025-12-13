import * as React from 'react';

interface ScoreCardProps {
  score?: number;
  summary?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, summary }) => {
  const safeScore = typeof score === 'number' ? score : 0;

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-lg shadow-sm transition-colors duration-300">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">ATS Match Score</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path
              className="text-slate-100 dark:text-slate-700"
              stroke="currentColor"
              strokeWidth="3.8"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={getScoreColor(safeScore)}
              stroke="currentColor"
              strokeWidth="3.8"
              strokeDasharray={`${safeScore}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(safeScore)}`}>
              {safeScore}
            </span>
            <span className={`text-lg font-semibold ${getScoreColor(safeScore)}`}>%</span>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-slate-500 dark:text-slate-400">{summary ?? 'Run analysis to get your ATS score breakdown.'}</p>
        </div>
      </div>
    </div>
  );
};
