import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../../components/Header';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../../contexts/AuthContext';

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock ThemeContext
vi.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Header', () => {
    it('renders branding', () => {
        // @ts-ignore
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: null, logout: vi.fn() });

        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        expect(screen.getByText(/ATS/i)).toBeInTheDocument();
        expect(screen.getByText(/Buddy/i)).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        // @ts-ignore
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: null, logout: vi.fn() });

        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Optimizer')).toBeInTheDocument();
    });

    it('renders desktop navigation when sidebar is closed', () => {
        // @ts-ignore
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: null, logout: vi.fn() });

        render(
            <MemoryRouter>
                <Header isSidebarOpen={false} />
            </MemoryRouter>
        );

        // Check for Home link which is in the desktop nav
        expect(screen.getByText('Home')).toBeVisible();
    });
});
