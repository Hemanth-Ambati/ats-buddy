/**
 * Client-side file parsing utilities for PDF and DOCX resumes.
 * Uses `pdfjs-dist` for PDFs and `mammoth` for DOCX.
 */

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
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  // mammoth returns a value string with plain text
  return result.value || '';
}

async function parsePdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');

  // Ensure workerSrc points to a bundled worker so we don't rely on CDN fetches during runtime.
  try {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;
    }
  } catch (e) {
    console.warn('Could not set pdfjs workerSrc from bundled worker, falling back to auto-detect.', e);
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
