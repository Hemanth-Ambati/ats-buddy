import * as React from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import ReactMarkdown from 'react-markdown';

interface OptimizedResumeProps {
  resumeText?: string;
}

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-3a2.25 2.25 0 0 1-2.25-2.25V5.25c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V7.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.06l-3.103 3.103-1.53-1.53a.75.75 0 0 0-1.06 1.06l2.06 2.06a.75.75 0 0 0 1.06 0l3.623-3.623Z" clipRule="evenodd" />
  </svg>
);


export const OptimizedResume: React.FC<OptimizedResumeProps> = ({ resumeText }) => {
  const safeText = resumeText ?? '';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (typeof navigator?.clipboard?.writeText !== 'function') return;
    navigator.clipboard.writeText(safeText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Optimized Resume</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium py-2 px-3 rounded-lg transition-colors shadow-sm"
          >
            {copied ? (
              <React.Fragment>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                Copied!
              </React.Fragment>
            ) : (
              <React.Fragment>
                <ClipboardIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                Copy Text
              </React.Fragment>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadAsPDF(safeText)}
              disabled={!safeText}
              className="text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
            <button
              onClick={() => downloadAsDocx(safeText)}
              disabled={!safeText}
              className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download DOCX
            </button>
          </div>
        </div>
      </div>
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-lg prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto shadow-sm"
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
      >
        {safeText ? (
          <ReactMarkdown>{safeText}</ReactMarkdown>
        ) : (
          <div className="text-slate-400 dark:text-slate-500 text-center py-12 italic">
            Run the optimizer to see your updated resume with ATS-friendly keywords.
          </div>
        )}
      </div>
    </div>
  );
};

function downloadAsPDF(text: string, filename = 'optimized-resume.pdf') {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 14;
    const lines = doc.splitTextToSize(text, maxWidth);
    let cursorY = margin;

    for (let i = 0; i < lines.length; i++) {
      if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(lines[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save(filename);
  } catch (err) {
    console.error('Failed to generate PDF', err);
  }
}

async function downloadAsDocx(text: string, filename = 'optimized-resume.docx') {
  try {
    // Create structured paragraphs with heading styles and bullet lists to improve DOCX
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const children: Paragraph[] = [];

    const toRuns = (line: string): TextRun[] => {
      // Convert markdown-like **bold** to TextRun bold segments
      const parts: TextRun[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = boldRegex.exec(line)) !== null) {
        if (m.index > lastIndex) {
          parts.push(new TextRun(line.substring(lastIndex, m.index)));
        }
        parts.push(new TextRun({ text: m[1], bold: true }));
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < line.length) {
        parts.push(new TextRun(line.substring(lastIndex)));
      }
      if (parts.length === 0) parts.push(new TextRun(line));
      return parts;
    };

    let i = 0;
    while (i < lines.length) {
      const raw = lines[i].trim();
      // skip repeated blank lines
      if (!raw) {
        children.push(new Paragraph({ children: [new TextRun('')] }));
        i++;
        continue;
      }

      // Contact line heuristic (email or phone present) => prominent paragraph
      if (/\S+@\S+\.(com|net|org|io|edu)|\+?\d[\d()\s-]{6,}/i.test(raw)) {
        children.push(new Paragraph({ children: toRuns(raw) }));
        i++;
        continue;
      }

      // Heading (all caps, limited length)
      const isHeading = raw === raw.toUpperCase() && raw.length > 1 && raw.length < 60;
      if (isHeading) {
        children.push(new Paragraph({ children: toRuns(raw), heading: HeadingLevel.HEADING_2 }));
        i++;
        continue;
      }

      // Bullet list: lines that start with '- ' or '*' or look like list items
      if (/^[-\*]\s+/.test(raw)) {
        // accumulate contiguous bullets
        while (i < lines.length && /^[-\*]\s+/.test(lines[i].trim())) {
          const item = lines[i].trim().replace(/^[-\*]\s+/, '');
          children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
          i++;
        }
        continue;
      }

      // Otherwise treat as normal paragraph; merge consecutive short lines into one paragraph until a blank or heading
      let paraLines = [raw];
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next || next === next.toUpperCase() || /^[-\*]\s+/.test(next) || /\S+@\S+\.(com|net|org|io|edu)/i.test(next)) break;
        paraLines.push(next);
        i++;
      }
      children.push(new Paragraph({ children: toRuns(paraLines.join(' ')) }));
    }

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to generate DOCX', err);
  }
}
