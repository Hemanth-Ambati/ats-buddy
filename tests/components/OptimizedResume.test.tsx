import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OptimizedResume } from '../../components/OptimizedResume';

// Mock clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText,
    },
});

describe('OptimizedResume', () => {
    it('renders nothing significant when resumeText is empty', () => {
        render(<OptimizedResume resumeText="" />);
        expect(screen.getByText(/Run the optimizer to see your updated resume/i)).toBeInTheDocument();
    });

    it('renders markdown content', async () => {
        const resumeText = '# John Doe\n\n- Software Engineer';
        render(<OptimizedResume resumeText={resumeText} />);

        // Check for Heading
        expect(screen.getByRole('heading', { level: 1, name: /John Doe/i })).toBeInTheDocument();
        // Check for List item
        expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
    });

    it('enables buttons when text is present', () => {
        render(<OptimizedResume resumeText="Some text" />);

        expect(screen.getByRole('button', { name: /Copy Text/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Download PDF/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Download DOCX/i })).toBeEnabled();
    });

    it('disables download buttons when text is empty', () => {
        render(<OptimizedResume resumeText="" />);

        expect(screen.getByRole('button', { name: /Download PDF/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Download DOCX/i })).toBeDisabled();
        // Copy button might technically be enabled but does nothing, or UI implementation choice. 
        // In code: disabled={!safeText} is NOT on copy button, but handleCopy returns early.
    });

    it('copies text to clipboard', async () => {
        mockWriteText.mockResolvedValue(undefined);
        render(<OptimizedResume resumeText="Copy me" />);

        const copyBtn = screen.getByRole('button', { name: /Copy Text/i });
        fireEvent.click(copyBtn);

        expect(mockWriteText).toHaveBeenCalledWith('Copy me');

        await waitFor(() => {
            expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
        });
    });
});
