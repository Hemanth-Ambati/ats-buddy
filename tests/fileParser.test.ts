import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseFile } from '../services/fileParser';

// Mock mammoth
vi.mock('mammoth', () => ({
    extractRawText: vi.fn().mockResolvedValue({ value: 'Mock Docx Content' })
}));

// Mock pdfjs-dist
const mockGetPage = vi.fn();
const mockGetDocument = vi.fn(() => ({
    promise: Promise.resolve({
        numPages: 1,
        getPage: mockGetPage,
    }),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
    getDocument: mockGetDocument,
    GlobalWorkerOptions: {
        workerSrc: '',
    },
}));

describe('fileParser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        if (!File.prototype.arrayBuffer) {
            // @ts-ignore
            File.prototype.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
        }
    });

    it('parses DOCX files correctly', async () => {
        const file = {
            name: 'test.docx',
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 1000,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        } as unknown as File;

        const text = await parseFile(file);
        expect(text).toBe('Mock Docx Content');
    });

    it('parses PDF files correctly', async () => {
        mockGetPage.mockResolvedValue({
            getTextContent: () => Promise.resolve({
                items: [
                    { str: 'Hello', transform: [1, 0, 0, 1, 0, 100] },
                    { str: 'World', transform: [1, 0, 0, 1, 0, 100] } // Same Y -> same line
                ]
            })
        });

        const file = {
            name: 'test.pdf',
            type: 'application/pdf',
            size: 1000,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        } as unknown as File;

        const text = await parseFile(file);
        expect(text).toContain('Hello');
        expect(text).toContain('World');
    });

    it('throws error for unsupported file types', async () => {
        const file = {
            name: 'test.png',
            type: 'image/png',
            size: 1000
        } as unknown as File;
        await expect(parseFile(file)).rejects.toThrow('Unsupported file type');
    });

    it('throws error for large files', async () => {
        // Mock a large file size check
        // Since we can't easily create a 10MB file in memory without overhead, we rely on the implementation checking file.size
        const largeFile = {
            name: 'large.pdf',
            size: 11 * 1024 * 1024,
            type: 'application/pdf',
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
        } as any as File;

        await expect(parseFile(largeFile)).rejects.toThrow('File is too large');
    });
});
