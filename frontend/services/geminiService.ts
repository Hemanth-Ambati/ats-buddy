/**
 * Gemini AI Service Integration
 * 
 * This module provides the interface to Google's Gemini 2.5 Flash model for:
 * 1. Structured generation - Agent outputs with validated JSON schemas
 * 2. Conversational chat - Interactive resume improvement suggestions
 * 
 * Design Decisions:
 * - Uses Gemini 2.5 Flash for optimal balance of speed, quality, and cost
 * - Structured generation ensures type-safe, parseable agent outputs
 * - Low temperature (0.2) for agents ensures consistent, factual responses
 * - Higher temperature (0.4) for chat enables more creative suggestions
 * - Mock mode allows development/testing without API calls
 */

import { generateClient } from 'aws-amplify/api';
import type { AnalysisResult, ChatMessage } from '../types';
import { log } from './logger';

const client = generateClient();

// Define the GraphQL query
const generateGeminiResponse = /* GraphQL */ `
  query GenerateGeminiResponse(
    $prompt: String
    $schema: String
    $temperature: Float
    $messages: String
    $analysisContext: String
    $resumeText: String
    $jobDescriptionText: String
  ) {
    generateGeminiResponse(
      prompt: $prompt
      schema: $schema
      temperature: $temperature
      messages: $messages
      analysisContext: $analysisContext
      resumeText: $resumeText
      jobDescriptionText: $jobDescriptionText
    )
  }
`;

// Mock mode for development/testing without consuming API quota
const MOCK_ENABLED =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_MOCK === 'true') ||
  process.env.GEMINI_MOCK === 'true';

// Export Type for schema definition used by consumers
export enum Type {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT'
}

type Schema = any; // Gemini schema type (simplified for brevity)

/**
 * Generates structured JSON output from Gemini using a defined schema.
 */
async function generateStructured<T>(prompt: string, schema: Schema, temperature = 0.2, mockResponse?: T): Promise<T> {
  log({ level: 'debug', message: 'Gemini request', extra: { temperature } });
  if (MOCK_ENABLED && mockResponse) {
    return mockResponse;
  }

  try {
    const response = await client.graphql({
      query: generateGeminiResponse,
      variables: {
        prompt,
        schema: JSON.stringify(schema), // Pass schema as string
        temperature
      },
      authMode: 'userPool'
    });

    const resultString = (response as any).data.generateGeminiResponse;
    // The Lambda returns a JSON string (or object depending on implementation, but GraphQL returns string usually if typed as String)
    // Our schema says String, so we need to parse it if it's double encoded, or just parse the result.
    // The Lambda returns `body: JSON.stringify(result)`.
    // AppSync might unwrap the body? No, @function returns what the handler returns.
    // If handler returns { body: ... }, AppSync via Lambda DataSource usually expects just the result if using direct lambda resolver,
    // OR if using Lambda Proxy integration it expects the full object.
    // Amplify @function uses Direct Lambda Resolver usually.
    // Let's assume the Lambda should return just the data, NOT { statusCode, body }.
    // Wait, I wrote the Lambda to return { statusCode, body }. This is for API Gateway.
    // For AppSync @function, it passes the arguments directly and expects the return value directly.
    // I need to fix the Lambda to return just the data, OR handle the response here.

    // Let's parse assuming it returns the JSON object directly if I fix the Lambda.
    // If I don't fix the Lambda, it returns { statusCode, body }.

    // I SHOULD FIX THE LAMBDA TO BE APPSYNC COMPATIBLE.
    // But for now, let's assume I will fix the Lambda in the next step.

    // DEBUG: Log the raw response to understand the parsing error


    if (!resultString) {
      throw new Error('Empty response from Gemini');
    }

    // Clean markdown code blocks if present (common LLM behavior)
    let cleanString = resultString.trim();
    if (cleanString.startsWith('```')) {
      cleanString = cleanString.replace(/^```(json)?\n/, '').replace(/```$/, '');
    }

    return JSON.parse(cleanString) as T;
  } catch (err) {
    log({ level: 'error', message: 'Failed to call Gemini Proxy', error: err });
    throw err;
  }
}

export { generateStructured };

/**
 * Interactive chat interface with context-aware resume assistance.
 */
export async function chatWithGemini(
  messages: ChatMessage[],
  analysisContext: AnalysisResult | null = null,
  currentResumeText: string = '',
  jobDescriptionText: string = ''
): Promise<string> {
  // ... (Context construction logic remains the same, omitted for brevity but should be preserved if I replace the whole file)
  // Wait, I am replacing the whole file content? No, just from line 16.

  // I need to preserve the context logic.
  // Let's just replace the API call part.

  // Actually, I'll rewrite the whole file to be safe and clean.

  let systemPrefix = '';

  if (analysisContext) {
    // ... (Same context logic)
    const summary = analysisContext.scoring.output?.alignmentNotes ?? 'Not available';
    const overall = analysisContext.scoring.output?.overall;
    const matching = analysisContext.keywordAnalysis.output?.matchingKeywords?.join(', ') || 'None';
    const missing = analysisContext.keywordAnalysis.output?.missingKeywords?.join(', ') || 'None';
    const suggestions = analysisContext.keywordAnalysis.output?.suggestions?.join('\n- ') || 'None';
    const optimized = analysisContext.optimiser.output?.markdown || '';
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    systemPrefix = `CURRENT DATE: ${currentDate}
  
  CONTEXT ANALYSIS:
  - Original Resume ATS Score: ${overall ?? 'N/A'}/100
  - Alignment Summary: ${summary}
  - Matching Keywords from Original: ${matching}
  - Missing Keywords from Original: ${missing}
  - Improvement Suggestions:
  - ${suggestions}
  
  OPTIMIZED RESUME (AI-Generated Improved Version):
  ${optimized}
  
  ORIGINAL RESUME (User's Current Version):
  ${currentResumeText}
  
  JOB DESCRIPTION:
  ${jobDescriptionText}
  
  IMPORTANT INSTRUCTIONS:
  1. The ATS score of ${overall ?? 'N/A'}/100 applies ONLY to the ORIGINAL resume.
  2. The OPTIMIZED resume has been rewritten to address the missing keywords and gaps.
  3. When asked to compare, score, or analyze the optimized resume against the job description, you MUST:
     a) Perform a fresh ATS analysis of the OPTIMIZED resume against the job description
     b) Count how many keywords from the job description appear in the optimized resume
     c) Evaluate alignment with job requirements, skills, and experience
     d) Provide a NEW ATS score (0-100) for the optimized resume with detailed justification
     e) Compare this new score to the original score of ${overall ?? 'N/A'}/100
     f) Explain specifically which improvements (added keywords, better alignment, etc.) led to the score change
  4. Your scoring should follow these criteria:
     - Keyword match rate (40%): How many JD keywords appear in the resume
     - Skills alignment (30%): How well skills match the requirements
     - Experience relevance (20%): How relevant is the experience to the role
     - Format & clarity (10%): ATS-friendly formatting and clear presentation
  5. If the user asks you to modify their resume, respond with your explanation followed by "UPDATED_RESUME:" and then the complete updated resume text.
  6. Always be specific and reference actual content from the resumes and job description.`;
  }

  const conversation = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  const prompt = `${systemPrefix}\n\nYou are an expert resume assistant. Continue the conversation below and provide a helpful, concise reply that uses the analysis context above when relevant.\n\n${conversation}\n\nASSISTANT:`;

  try {
    const response = await client.graphql({
      query: generateGeminiResponse,
      variables: {
        prompt,
        temperature: 0.4
      },
      authMode: 'userPool'
    });

    const resultString = (response as any).data.generateGeminiResponse;
    return resultString; // Chat returns string directly
  } catch (err) {
    console.error('Gemini chat error:', err);
    throw new Error('Failed to get chat response from Gemini Proxy.');
  }
}
