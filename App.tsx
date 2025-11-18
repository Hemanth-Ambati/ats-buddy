import * as React from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { InputSection } from './components/InputSection';
import { ResultsSection } from './components/ResultsSection';
import type { AnalysisResult } from './types';
import { analyzeResumeAndJD } from './services/geminiService';

const App: React.FC = () => {
  const [resumeText, setResumeText] = React.useState<string>('');
  const [jobDescriptionText, setJobDescriptionText] = React.useState<string>('');
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleResumeUpdate = React.useCallback((updatedResume: string) => {
    setResumeText(updatedResume);
    // Update the optimized resume in the analysis result if it exists
    if (analysisResult) {
      setAnalysisResult(prev => prev ? { ...prev, optimizedResume: updatedResume } : prev);
    }
  }, [analysisResult]);

  const handleAnalyze = React.useCallback(async () => {
    if (!resumeText.trim() || !jobDescriptionText.trim()) {
      setError('Please provide both a resume and a job description.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeResumeAndJD(resumeText, jobDescriptionText);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jobDescriptionText]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InputSection
            resumeText={resumeText}
            setResumeText={setResumeText}
            jobDescriptionText={jobDescriptionText}
            setJobDescriptionText={setJobDescriptionText}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          <ResultsSection
            result={analysisResult}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
  <ChatWindow 
        analysisResult={analysisResult} 
        resumeText={resumeText} 
        jobDescriptionText={jobDescriptionText}
        onResumeUpdate={handleResumeUpdate}
      />
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;