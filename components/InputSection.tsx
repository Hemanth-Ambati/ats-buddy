import * as React from 'react';
import { parseFile } from '../services/fileParser';

interface InputSectionProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  jobDescriptionText: string;
  setJobDescriptionText: (text: string) => void;
  onAnalyze: () => void;
  onKeywordAnalyze?: () => void;
  onScoreAnalyze?: () => void;
  isLoading: boolean;
}

const PLensIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10 2a8 8 0 1 0 5.3 14.3l3.4 3.4a1 1 0 0 0 1.4-1.4l-3.4-3.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1-6 6 6 6 0 0 1 6-6Z" />
  </svg>
);


export const InputSection: React.FC<InputSectionProps> = ({
  resumeText,
  setResumeText,
  jobDescriptionText,
  setJobDescriptionText,
  onAnalyze,
  onKeywordAnalyze,
  onScoreAnalyze,
  isLoading,
}) => {
  const [isParsing, setIsParsing] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isButtonDisabled = !resumeText.trim() || !jobDescriptionText.trim() || isLoading || isParsing;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setIsParsing(true);
    try {
      const text = await parseFile(file);
      if (text && text.trim()) {
        setResumeText(text);
      } else {
        setParseError('No text could be extracted from the file.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('File parse error:', err);
      setParseError(msg);
    } finally {
      setIsParsing(false);
      // allow reselecting the same file later - use ref to avoid setting value on unmounted element
      try {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (_) {
        // ignore
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-6 transition-colors duration-300 h-fit">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">Your Details</h2>

      <div className="flex flex-col gap-6">
        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Resume (paste or upload)
          </label>

          <div className="flex items-center gap-4 mb-2">
            <input
              id="resume-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              disabled={isParsing || isLoading}
              className="text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 dark:file:bg-sky-900/50 file:text-sky-700 dark:file:text-sky-300 hover:file:bg-sky-100 dark:hover:file:bg-sky-900 transition-colors"
            />
            {isParsing && <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Parsing file...</span>}
            {parseError && <span className="text-sm text-rose-500">{parseError}</span>}
          </div>

          <textarea
            id="resume"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste the full text of your resume here..."
            className="w-full h-48 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600"
            disabled={isLoading || isParsing}
          />
        </div>

        <div>
          <label htmlFor="job-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Paste the Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescriptionText}
            onChange={(e) => setJobDescriptionText(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-48 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={onKeywordAnalyze}
          disabled={isButtonDisabled || !onKeywordAnalyze}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          Keyword Analysis
        </button>
        <button
          onClick={onScoreAnalyze}
          disabled={isButtonDisabled || !onScoreAnalyze}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all duration-300 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          Check ATS Score
        </button>
        <button
          onClick={onAnalyze}
          disabled={isButtonDisabled}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all duration-300 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <React.Fragment>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </React.Fragment>
          ) : (
            <React.Fragment>
              <PLensIcon className="h-5 w-5" />
              Optimize My Resume
            </React.Fragment>
          )}
        </button>
      </div>
    </div>
  );
};
