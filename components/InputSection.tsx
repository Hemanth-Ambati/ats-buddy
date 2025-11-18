import * as React from 'react';
import { parseFile } from '../services/fileParser';

interface InputSectionProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  jobDescriptionText: string;
  setJobDescriptionText: (text: string) => void;
  onAnalyze: () => void;
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
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col gap-6 h-full">
      <h2 className="text-2xl font-semibold text-slate-100 border-b border-slate-700 pb-3">Your Details</h2>
      
      <div className="flex-grow flex flex-col gap-6">
        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-slate-300 mb-2">
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
                className="text-sm"
              />
            {isParsing && <span className="text-sm text-slate-300">Parsing file...</span>}
            {parseError && <span className="text-sm text-rose-400">{parseError}</span>}
          </div>

          <textarea
            id="resume"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste the full text of your resume here..."
            className="w-full h-48 p-3 border border-slate-700 rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-shadow resize-y"
            disabled={isLoading || isParsing}
          />
        </div>
        
        <div>
          <label htmlFor="job-description" className="block text-sm font-medium text-slate-300 mb-2">
            Paste the Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescriptionText}
            onChange={(e) => setJobDescriptionText(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-48 p-3 border border-slate-700 rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-shadow resize-y"
            disabled={isLoading}
          />
        </div>
      </div>
      
      <button
        onClick={onAnalyze}
        disabled={isButtonDisabled}
        className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
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
  );
};