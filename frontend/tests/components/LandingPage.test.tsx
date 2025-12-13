import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LandingPage } from '../../components/LandingPage';
import { MemoryRouter } from 'react-router-dom';

// Mock ThemeContext
vi.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));
// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ currentUser: null }),
    AuthProvider: ({ children }: any) => <>{children}</>
}));

describe('LandingPage', () => {
    it('renders main title and subtitle', () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Beat the ATS/i)).toBeInTheDocument();
        expect(screen.getByText(/Land Your Dream Job/i)).toBeInTheDocument();
        expect(screen.getByText(/Optimize your resume for any job/i)).toBeInTheDocument();
    });

    it('renders CTA button', () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        // Check for "Get Started for Free" button
        const ctaButton = screen.getByRole('link', { name: /Get Started for Free/i });
        expect(ctaButton).toBeInTheDocument();
        expect(ctaButton).toHaveAttribute('href', '/signup');
    });

    it('renders features section', () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Instant Scoring')).toBeInTheDocument();
        expect(screen.getByText('Keyword Analysis')).toBeInTheDocument();
        expect(screen.getByText('AI Rewriting')).toBeInTheDocument();
        expect(screen.getByText('Cover Letters')).toBeInTheDocument();
    });
});
