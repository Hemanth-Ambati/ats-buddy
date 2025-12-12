import * as React from 'react';
import remarkGfm from 'remark-gfm';

import ReactMarkdown from 'react-markdown';
import { remark } from 'remark';
import remarkParse from 'remark-parse';

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
  const resumeRef = React.useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (typeof navigator?.clipboard?.writeText !== 'function') return;
    navigator.clipboard.writeText(safeText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  const handleDownloadPDF = async () => {
    if (!safeText) return;
    await downloadAsPdf(safeText);
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
              onClick={handleDownloadPDF}
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
        id="resume-content"
        ref={resumeRef}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-lg shadow-sm max-w-none max-h-[600px] overflow-y-auto"
      >
        {safeText ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-sm dark:prose-invert max-w-none"
            components={{
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-2" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-6 mb-3 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-1" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              p: ({ node, ...props }) => <p className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />,
            }}
          >
            {safeText}
          </ReactMarkdown>
        ) : (
          <div className="text-slate-400 dark:text-slate-500 text-center py-12 italic">
            Run the optimizer to see your updated resume with ATS-friendly keywords.
          </div>
        )}
      </div>
    </div>
  );
};

async function downloadAsPdf(text: string, filename = 'optimized-resume.pdf') {
  try {
    const processor = remark().use(remarkParse);
    const ast = processor.parse(text);

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    let y = margin;

    // Helper to extract plain text recursively
    const extractText = (nodes: any[]): string => {
      return nodes.map((node: any) => {
        if (node.type === 'text') return node.value;
        if (node.children) return extractText(node.children);
        return '';
      }).join('');
    };

    // Helper to render mixed bold/normal text with wrapping
    const renderRichText = (nodes: any[], x: number, initialY: number, maxWidth: number, fontSize: number) => {
      doc.setFontSize(fontSize);
      const lineHeight = fontSize * 1.2;
      let currentY = initialY;

      const segments: { text: string; isBold: boolean }[] = [];
      const flatten = (n: any) => {
        if (n.type === 'text') {
          segments.push({ text: n.value, isBold: false });
        } else if (n.type === 'strong') {
          n.children.forEach((c: any) => {
            if (c.type === 'text') segments.push({ text: c.value, isBold: true });
          });
        } else if (n.type === 'emphasis') {
          n.children.forEach((c: any) => {
            if (c.type === 'text') segments.push({ text: c.value, isBold: false });
          });
        }
      };
      nodes.forEach(flatten);

      let line: { text: string; isBold: boolean; width: number }[] = [];
      let currentLineWidth = 0;

      const printLine = () => {
        let lineX = x;
        line.forEach(seg => {
          doc.setFont('helvetica', seg.isBold ? 'bold' : 'normal');
          doc.text(seg.text, lineX, currentY + fontSize); // Baseline adjustment
          lineX += seg.width;
        });
        currentY += lineHeight;
        line = [];
        currentLineWidth = 0;
      };

      segments.forEach(seg => {
        // Explicitly split by newline first to guarantee line breaks
        const lines = seg.text.split('\n');

        lines.forEach((lineText, lineIndex) => {
          // If this is not the first line segment, it means we hit a newline char, so force a break
          if (lineIndex > 0) {
            printLine();
          }

          // Split by spaces to handle wrapping
          const words = lineText.split(/(\s+)/);
          words.forEach(word => {
            if (word.length === 0) return;

            doc.setFont('helvetica', seg.isBold ? 'bold' : 'normal');
            const wordWidth = doc.getStringUnitWidth(word) * fontSize;

            if (currentLineWidth + wordWidth > maxWidth) {
              printLine();
              // If the word is a space and we just wrapped, ignore it (trim start of new line)
              if (/^\s+$/.test(word)) return;
            }

            line.push({ text: word, isBold: seg.isBold, width: wordWidth });
            currentLineWidth += wordWidth;
          });
        });
      });

      if (line.length > 0) {
        printLine();
      }

      return currentY - initialY;
    };

    const processNode = (node: any) => {
      // Check for page break
      if (y > pageHeight - margin - 50) {
        doc.addPage();
        y = margin;
      }

      if (node.type === 'heading') {
        const fontSize = node.depth === 1 ? 24 : node.depth === 2 ? 16 : 14;
        const isBold = true;

        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);

        const textContent = extractText(node.children);
        const lines = doc.splitTextToSize(textContent, contentWidth);
        const height = lines.length * fontSize * 1.2;

        if (node.depth <= 2) {
          y += 10;
        }

        doc.text(lines, margin, y + fontSize);
        y += height + 10;

        if (node.depth <= 2) {
          doc.setLineWidth(0.5);
          doc.line(margin, y - 5, pageWidth - margin, y - 5);
          y += 5;
        }

      } else if (node.type === 'paragraph') {
        const usedHeight = renderRichText(node.children, margin, y, contentWidth, 11);
        y += usedHeight + 10;

      } else if (node.type === 'list') {
        node.children.forEach((listItem: any) => {
          const content = listItem.children[0]; // paragraph
          if (content) {
            if (y > pageHeight - margin - 30) {
              doc.addPage();
              y = margin;
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text('• ', margin, y + 11 + 2); // Bullet (slightly adjusted)

            const usedHeight = renderRichText(content.children, margin + 15, y, contentWidth - 15, 11);
            y += usedHeight + 5;
          }
        });
        y += 5;
      }
    };

    ast.children.forEach(processNode);

    doc.save(filename);
  } catch (err) {
    console.error('Failed to generate PDF', err);
  }
}

async function downloadAsDocx(text: string, filename = 'optimized-resume.docx') {
  try {
    const processor = remark().use(remarkParse);
    const ast = processor.parse(text);
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const children: any[] = [];

    // Helper to convert inline nodes (text, strong, emphasis) to TextRuns
    const processInline = (nodes: any[]) => {
      const runs: any[] = [];

      const createRuns = (text: string, options: any = {}) => {
        const parts = text.split('\n');
        parts.forEach((part, index) => {
          if (index > 0) {
            runs.push(new TextRun({ break: 1 }));
          }
          if (part) {
            runs.push(new TextRun({ text: part, ...options }));
          }
        });
      };

      nodes.forEach((node) => {
        if (node.type === 'text') {
          createRuns(node.value);
        } else if (node.type === 'strong') {
          const text = node.children[0]?.value || '';
          createRuns(text, { bold: true });
        } else if (node.type === 'emphasis') {
          const text = node.children[0]?.value || '';
          createRuns(text, { italics: true });
        }
      });
      return runs;
    };

    // Traverse AST and build docx structure
    // We manually traverse top-level nodes to handle lists correctly
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === 'heading') {
          const level = node.depth === 1 ? HeadingLevel.HEADING_1
            : node.depth === 2 ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;

          children.push(new Paragraph({
            children: processInline(node.children),
            heading: level,
            spacing: { before: 240, after: 120 }
          }));
        } else if (node.type === 'paragraph') {
          children.push(new Paragraph({
            children: processInline(node.children),
            spacing: { after: 120 }
          }));
        } else if (node.type === 'list') {
          node.children.forEach((listItem: any) => {
            // List items usually contain a paragraph
            const content = listItem.children[0]; // paragraph
            if (content && content.type === 'paragraph') {
              children.push(new Paragraph({
                children: processInline(content.children),
                bullet: { level: 0 }
              }));
            }
          });
        }
      });
    };

    traverse(ast.children);

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

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
