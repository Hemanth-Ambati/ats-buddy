import * as React from 'react';
import type { KeywordAnalysis as KeywordAnalysisType } from '../types';

interface KeywordAnalysisProps {
  analysis: KeywordAnalysisType;
}

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.103 3.103-1.53-1.53a.75.75 0 0 0-1.06 1.06l2.06 2.06a.75.75 0 0 0 1.06 0l3.623-3.623Z" clipRule="evenodd" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);

const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.25a.75.75 0 0 1 .75.75v.541a11.986 11.986 0 0 1 5.494 2.4l.261-.453a.75.75 0 1 1 1.298.75l-.26.453a12.003 12.003 0 0 1 2.27 4.412l.47-.213a.75.75 0 1 1 .663 1.326l-.47.213a12.003 12.003 0 0 1 0 8.528l.47.213a.75.75 0 1 1-.663 1.326l-.47-.213a12.003 12.003 0 0 1-2.27 4.412l.26.453a.75.75 0 1 1-1.298.75l-.261-.453a11.986 11.986 0 0 1-5.494 2.4v.541a.75.75 0 0 1-1.5 0v-.541a11.986 11.986 0 0 1-5.494-2.4l-.261.453a.75.75 0 1 1-1.298-.75l.26-.453a12.003 12.003 0 0 1-2.27-4.412l-.47.213a.75.75 0 1 1-.663-1.326l.47-.213a12.003 12.003 0 0 1 0-8.528l-.47-.213a.75.75 0 1 1 .663-1.326l.47.213a12.003 12.003 0 0 1 2.27-4.412l-.26-.453a.75.75 0 0 1 1.298-.75l.261.453A11.986 11.986 0 0 1 11.25 3.541V2.999a.75.75 0 0 1 .75-.75Zm-.75 4.5a.75.75 0 0 0-1.5 0v.526a10.45 10.45 0 0 0-3.553 1.833.75.75 0 1 0 .956 1.162A8.951 8.951 0 0 1 11.25 8.7v-1.95Zm1.5 0v1.95a8.951 8.951 0 0 1 3.097 1.47.75.75 0 1 0 .956-1.161A10.45 10.45 0 0 0 14.25 7.276V6.75a.75.75 0 0 0-1.5 0ZM8.033 16.27a.75.75 0 0 0-1.06 1.06 3.001 3.001 0 0 0 4.027 4.027.75.75 0 1 0 1.06-1.06 1.5 1.5 0 0 1-2.013-2.014.75.75 0 0 0-1.06-1.06Z" />
  </svg>
);


export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ analysis }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Keyword Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-slate-600 mb-3 flex items-center gap-2">
            <CheckIcon className="h-6 w-6 text-green-500"/> Matching Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.matchingKeywords.map((kw, i) => (
              <span key={`match-${i}`} className="bg-green-800 text-green-300 text-sm font-medium px-2.5 py-1 rounded-full">{kw}</span>
            ))}
             {analysis.matchingKeywords.length === 0 && <p className="text-slate-300 text-sm">No strong keyword matches found.</p>}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-slate-600 mb-3 flex items-center gap-2">
            <XIcon className="h-6 w-6 text-red-500"/> Missing Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords.map((kw, i) => (
              <span key={`miss-${i}`} className="bg-rose-800 text-rose-300 text-sm font-medium px-2.5 py-1 rounded-full">{kw}</span>
            ))}
            {analysis.missingKeywords.length === 0 && <p className="text-slate-300 text-sm">Great job! No major keywords seem to be missing.</p>}
          </div>
        </div>
      </div>
       <div>
        <h4 className="font-medium text-slate-300 mb-3 flex items-center gap-2">
            <LightbulbIcon className="h-6 w-6 text-yellow-400"/> AI Suggestions
        </h4>
        <ul className="space-y-2 list-disc list-inside text-slate-300">
            {analysis.suggestions.map((suggestion, i) => (
                <li key={`sug-${i}`}>{suggestion}</li>
            ))}
        </ul>
      </div>
    </div>
  );
};