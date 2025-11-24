import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateStructured = vi.hoisted(() => vi.fn());

vi.mock('../services/geminiService', () => ({
  generateStructured: mockGenerateStructured,
  // minimal Type shim so orchestrator can build schemas
  Type: { OBJECT: 'object', ARRAY: 'array', STRING: 'string', NUMBER: 'number' },
}));

import { analyzeResumeAndJD, analyzeKeywordOnly, analyzeScoreOnly } from '../services/agentOrchestrator';

describe('agentOrchestrator', () => {
  beforeEach(() => {
    mockGenerateStructured.mockReset();
  });

  it('analyzeResumeAndJD runs stages and returns completed outputs', async () => {
    const sequence = [
      { keywords: ['typescript'], skills: ['react'], title: 'Engineer' }, // JD
      { matchingKeywords: ['react'], missingKeywords: ['graphql'], suggestions: ['Mention GraphQL work'] }, // Keyword
      { overall: 82, alignmentNotes: 'Good match', matchedKeywords: ['react'], missingKeywords: ['graphql'] }, // Scoring
      { markdown: 'Optimized Resume', rationale: 'Aligned to JD' }, // Optimiser
    ];

    mockGenerateStructured.mockImplementation(() => Promise.resolve(sequence.shift()));

    const onProgress = vi.fn();
    const result = await analyzeResumeAndJD('my resume', 'job description', 'session-1', 'corr-1', onProgress);

    expect(result.jdAnalysis.status).toBe('completed');
    expect(result.keywordAnalysis.status).toBe('completed');
    expect(result.scoring.status).toBe('completed');
    expect(result.optimiser.status).toBe('completed');
    expect(result.formatter.status).toBe('completed');
    expect(result.scoring.output?.overall).toBe(82);
    expect(result.formatter.output?.markdown).toBe('Optimized Resume');
    // Expect 4 calls: JD, Keyword, Scoring, Optimiser (Formatter is merged)
    expect(mockGenerateStructured).toHaveBeenCalledTimes(4);

    // Verify progress callbacks were called
    expect(onProgress).toHaveBeenCalled();
  });

  it('analyzeKeywordOnly runs only JD and Keyword analysis', async () => {
    const sequence = [
      { keywords: ['typescript'], skills: ['react'], title: 'Engineer' }, // JD
      { matchingKeywords: ['react'], missingKeywords: ['graphql'], suggestions: ['Mention GraphQL work'] }, // Keyword
    ];

    mockGenerateStructured.mockImplementation(() => Promise.resolve(sequence.shift()));

    const onProgress = vi.fn();
    const result = await analyzeKeywordOnly('my resume', 'job description', 'session-2', 'corr-2', onProgress);

    expect(result.jdAnalysis.status).toBe('completed');
    expect(result.keywordAnalysis.status).toBe('completed');
    expect(result.scoring.status).toBe('pending');
    expect(result.optimiser.status).toBe('pending');
    expect(mockGenerateStructured).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalled();
  });

  it('analyzeScoreOnly runs JD, Keyword, and Scoring analysis', async () => {
    const sequence = [
      { keywords: ['typescript'], skills: ['react'], title: 'Engineer' }, // JD
      { matchingKeywords: ['react'], missingKeywords: ['graphql'], suggestions: ['Mention GraphQL work'] }, // Keyword
      { overall: 75, alignmentNotes: 'Decent', matchedKeywords: ['react'], missingKeywords: ['graphql'] }, // Scoring
    ];

    mockGenerateStructured.mockImplementation(() => Promise.resolve(sequence.shift()));

    const onProgress = vi.fn();
    const result = await analyzeScoreOnly('my resume', 'job description', 'session-3', 'corr-3', onProgress);

    expect(result.jdAnalysis.status).toBe('completed');
    expect(result.keywordAnalysis.status).toBe('completed');
    expect(result.scoring.status).toBe('completed');
    expect(result.optimiser.status).toBe('pending');
    expect(mockGenerateStructured).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalled();
  });

  it('marks a stage as failed when an agent throws', async () => {
    mockGenerateStructured
      .mockResolvedValueOnce({ keywords: [], skills: [] })
      .mockRejectedValueOnce(new Error('oops'));

    const result = await analyzeResumeAndJD('resume', 'jd', 'session-4', 'corr-4');

    expect(result.jdAnalysis.status).toBe('completed');
    expect(result.keywordAnalysis.status).toBe('failed');
    expect(result.keywordAnalysis.error).toBe('oops');
  });
});
