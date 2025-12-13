import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoverLetterPage } from '../../components/CoverLetterPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as dbService from '../../services/dbService';
import * as sessionService from '../../services/sessionService';
import * as agentOrchestrator from '../../services/agentOrchestrator';
import * as AuthContext from '../../contexts/AuthContext';

// Mock dependencies
vi.mock('../../services/dbService');
vi.mock('../../services/sessionService');
vi.mock('../../services/agentOrchestrator');
vi.mock('../../contexts/AuthContext');

// Mock ThemeContext
vi.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
    ThemeProvider: ({ children }: any) => <>{children}</>
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('CoverLetterFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        const mockAuthValue: any = {
            currentUser: {
                uid: 'user1',
                displayName: 'Test User',
                email: 'test@example.com',
                photoURL: null,
                emailVerified: true,
                providerData: []
            },
            loading: false,
            signup: vi.fn(),
            login: vi.fn(),
            loginWithGoogle: vi.fn(),
            resetPassword: vi.fn(),
            logout: vi.fn(),
            updateName: vi.fn(),
            updateUserPassword: vi.fn(),
            confirmReset: vi.fn(),
            verifyResetCode: vi.fn(),
            checkEmailExists: vi.fn(),
            reauthenticate: vi.fn(),
            sendVerification: vi.fn(),
            confirmEmail: vi.fn(),
            reloadUser: vi.fn(),
            completeNewPassword: vi.fn(),
        };

        vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuthValue);

        // Default local sessions empty
        // @ts-ignore
        vi.spyOn(sessionService, 'getLocalSessions').mockReturnValue([]);
        // @ts-ignore
        vi.spyOn(dbService, 'subscribeToUserSessions').mockReturnValue(() => { });
    });

    it('loads session and facilitates cover letter generation', async () => {
        const mockSession = {
            sessionId: 'sess-1',
            title: 'Machine Learning Engineer at Assembled',
            resumeText: 'My Resume',
            jobDescriptionText: 'Job Description',
            updatedAt: new Date().toISOString(),
            analysis: {
                optimiser: {
                    status: 'completed',
                    output: { markdown: 'Optimized Resume Content' }
                }
            }
        };

        // Mock loading session
        // @ts-ignore
        vi.spyOn(sessionService, 'loadLocalSession').mockReturnValue(mockSession);
        // @ts-ignore
        vi.spyOn(dbService, 'loadSessionById').mockResolvedValue(mockSession);

        // Mock generation with specific variations from screenshot
        // @ts-ignore
        vi.spyOn(agentOrchestrator, 'generateCoverLetterVariations').mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
                status: 'completed',
                outputs: [
                    {
                        markdown: 'Hemanth Ambati\nambatihemanth00@gmail.com\n\nDear Hiring Manager, Professional content...',
                        style: 'Professional & Direct'
                    },
                    {
                        markdown: 'Hemanth Ambati\nambatihemanth00@gmail.com\n\nDear Hiring Manager, Achievement content...',
                        style: 'Achievement Focused'
                    },
                    {
                        markdown: 'Hemanth Ambati\nambatihemanth00@gmail.com\n\nDear Hiring Manager, Passionate content...',
                        style: 'Passionate & Cultural'
                    }
                ]
            };
        });

        render(
            <MemoryRouter initialEntries={['/cover-letter/sess-1']}>
                <Routes>
                    <Route path="/cover-letter/:sessionId" element={<CoverLetterPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Verify session loaded with correct Title
        await waitFor(() => {
            expect(screen.getByText('Cover Letter Generator')).toBeInTheDocument();
            expect(screen.getByText('Machine Learning Engineer at Assembled')).toBeInTheDocument();
        });

        // Find Generate button
        const generateBtn = screen.getByText('Generate');
        expect(generateBtn).not.toBeDisabled();
        fireEvent.click(generateBtn);

        // Wait for generation to complete and verify elements from screenshot
        await waitFor(() => {
            expect(agentOrchestrator.generateCoverLetterVariations).toHaveBeenCalled();
        });

        await waitFor(() => {
            // Check for Styles
            expect(screen.getByText('Professional & Direct')).toBeInTheDocument();
            expect(screen.getByText('Achievement Focused')).toBeInTheDocument();
            expect(screen.getByText('Passionate & Cultural')).toBeInTheDocument();

            // Check for Content (Name/Email in preview)
            expect(screen.getAllByText(/Hemanth Ambati/i).length).toBeGreaterThan(0);

            // Check for Interaction Elements
            expect(screen.getByText('Optimized Resume')).toBeInTheDocument();
            expect(screen.getByText('Original Resume')).toBeInTheDocument();
            expect(screen.getByText('Regenerate')).toBeInTheDocument(); // Button changes to Regenerate

            // Check for "Select This Version" buttons
            const selectButtons = screen.getAllByText(/Select This Version/i);
            expect(selectButtons).toHaveLength(3);
        });
    });

    it('handles absence of job description', async () => {
        const mockSession = {
            sessionId: 'sess-2',
            resumeText: 'My Resume',
            jobDescriptionText: '', // Empty JD
            updatedAt: new Date().toISOString()
        };

        // @ts-ignore
        vi.spyOn(sessionService, 'loadLocalSession').mockReturnValue(mockSession);
        // @ts-ignore
        vi.spyOn(dbService, 'loadSessionById').mockResolvedValue(mockSession);

        render(
            <MemoryRouter initialEntries={['/cover-letter/sess-2']}>
                <Routes>
                    <Route path="/cover-letter/:sessionId" element={<CoverLetterPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Cover Letter Generator')).toBeInTheDocument();
        });

        const generateBtn = screen.getByText('Generate');
        expect(generateBtn).toBeDisabled();
    });
});
