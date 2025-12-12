import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptimizerPage } from '../../components/OptimizerPage';
import { MemoryRouter } from 'react-router-dom';
import * as dbService from '../../services/dbService';
import * as sessionService from '../../services/sessionService';
import * as AuthContext from '../../contexts/AuthContext';

// Mock dependencies
vi.mock('../../services/dbService');
vi.mock('../../services/sessionService');
vi.mock('../../contexts/AuthContext');

// Mock ThemeContext
vi.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
    ThemeProvider: ({ children }: any) => <>{children}</>
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('OptimizerFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default authenticated user

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
    });

    it('renders the page and lists sessions', async () => {
        // Mock getLocalSessions for initial state
        const mockSessions = [
            { sessionId: '1', title: 'React Dev', updatedAt: new Date().toISOString() },
            { sessionId: '2', title: 'Node Dev', updatedAt: new Date().toISOString() }
        ];
        // @ts-ignore
        vi.mocked(sessionService.getLocalSessions).mockReturnValue(mockSessions);
        // @ts-ignore
        vi.mocked(dbService.subscribeToUserSessions).mockImplementation((uid, callback) => {
            callback(mockSessions);
            return () => { };
        });

        render(
            <MemoryRouter>
                <OptimizerPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Resume Optimizer')).toBeInTheDocument();
        expect(screen.getByText('Start Fresh')).toBeInTheDocument();

        // Check if sessions are listed (might be in sidebar and grid)
        const reactDevItems = await screen.findAllByText('React Dev');
        expect(reactDevItems.length).toBeGreaterThan(0);

        const nodeDevItems = await screen.findAllByText('Node Dev');
        expect(nodeDevItems.length).toBeGreaterThan(0);
    });

    it('creates a new session and navigates', async () => {
        // @ts-ignore
        vi.spyOn(sessionService, 'getLocalSessions').mockReturnValue([]);
        // @ts-ignore
        vi.spyOn(dbService, 'subscribeToUserSessions').mockImplementation((uid, callback) => {
            callback([]);
            return () => { };
        });

        const newSession = { sessionId: 'new-session-id', correlationId: 'corr-id' };
        // @ts-ignore
        vi.spyOn(sessionService, 'resetSession').mockReturnValue(newSession);

        render(
            <MemoryRouter>
                <OptimizerPage />
            </MemoryRouter>
        );

        const startBtn = screen.getByText('New Optimization');
        fireEvent.click(startBtn);

        expect(sessionService.resetSession).toHaveBeenCalled();
        expect(sessionService.saveSessionToHistory).toHaveBeenCalledWith(newSession, true);
        expect(mockNavigate).toHaveBeenCalledWith('/optimize/new-session-id');
    });
});
