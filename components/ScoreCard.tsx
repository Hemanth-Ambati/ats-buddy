import * as React from 'react';

interface ScoreCardProps {
  score: number;
  summary: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, summary }) => {
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">ATS Match Score</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path
              className="text-slate-200"
              stroke="currentColor"
              strokeWidth="3.8"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={getScoreColor(score)}
              stroke="currentColor"
              strokeWidth="3.8"
              strokeDasharray={`${score}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className={`text-lg font-semibold ${getScoreColor(score)}`}>%</span>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-slate-300">{summary}</p>
        </div>
      </div>
    </div>
  );
};