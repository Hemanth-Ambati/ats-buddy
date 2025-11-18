/**
 * Client-side file parsing utilities for PDF and DOCX resumes.
 * Uses `pdfjs-dist` for PDFs and `mammoth` for DOCX.
 */
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// import the worker entry so bundlers (Vite) include a worker whose version matches the
// installed pdfjs-dist package. This avoids API/Worker version mismatch errors.
// The import below resolves to a worker script path handled by the bundler.
// Import the worker entry. Different bundlers expose this import differently
// (string URL as default export, or a module object). Import as a namespace
// and handle both shapes below.
// For Vite: import the worker file as a URL so the bundler provides a string path.
// This avoids module shape issues across bundlers and ensures we get a usable URL.
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.js?url';

export async function parseFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.size > 10 * 1024 * 1024) {
    // limit to 10 MB in-browser to avoid excessive work
    throw new Error('File is too large (max 10MB).');
  }

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return parsePdf(file);
  }

  if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDocx(file);
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  // mammoth returns a value string with plain text
  return result.value || '';
}

async function parsePdf(file: File): Promise<string> {
  // Set worker to a CDN-hosted worker. This is a pragmatic approach for Vite dev/demo.
  // If you prefer bundling the worker locally, update workerSrc accordingly.
  // Use the bundled worker so the API and worker versions match. Cast to any to avoid
  // typing issues with the imported worker value.
  try {
    if (typeof pdfWorkerUrl === 'string' && pdfWorkerUrl) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl as any;
    } else {
      console.warn('pdf.worker URL import did not return a string; leaving workerSrc unset to let pdf.js auto-detect.');
    }
  } catch (e) {
    console.warn('Could not set pdfjs workerSrc from pdfWorkerUrl import, falling back.', e);
  }

  const uint8 = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: uint8 });
  const pdf = await loadingTask.promise;

  const PAGE_LIMIT = 50; // cap pages processed client-side to avoid long work/memory spikes
  const pagesToProcess = Math.min(pdf.numPages, PAGE_LIMIT);
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strs = content.items.map((i: any) => (i.str ? i.str : ''));
    pageTexts.push(strs.join(' '));
  }

  let result = pageTexts.filter(Boolean).join('\n\n');
  if (pdf.numPages > PAGE_LIMIT) {
    result += `\n\n[Document truncated: only the first ${PAGE_LIMIT} pages were parsed in the browser]`;
  }
  return result;
}

export default { parseFile };
