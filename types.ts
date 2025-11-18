
export interface KeywordAnalysis {
  matchingKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export interface AnalysisResult {
  score: number;
  summary: string;
  keywordAnalysis: KeywordAnalysis;
  optimizedResume: string;
}
