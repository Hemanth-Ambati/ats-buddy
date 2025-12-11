/**
 * App Component
 * 
 * Root component that sets up:
 * - Authentication Provider
 * - Routing (React Router)
 * - Protected Routes
 */

import * as React from 'react';
// Force rebuild
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './components/Auth/LoginPage';
import { SignupPage } from './components/Auth/SignupPage';
import { ForgotPasswordPage } from './components/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/Auth/ResetPasswordPage';
import { ProfilePage } from './components/Auth/ProfilePage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { PublicOnlyRoute } from './components/Auth/PublicOnlyRoute';
import { Dashboard } from './components/Dashboard';
import { SessionEditor } from './components/SessionEditor';
import { LandingPage } from './components/LandingPage';
import { WikiPage } from './components/Wiki/WikiPage';
import { CoverLetterPage } from './components/CoverLetterPage';
import { VerifyEmailPage } from './components/Auth/VerifyEmailPage';
import { ConfirmEmailPage } from './components/Auth/ConfirmEmailPage';
import { AuthActionPage } from './components/Auth/AuthActionPage';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <pre className="bg-gray-100 p-4 rounded text-left overflow-auto max-w-2xl mx-auto">
            {this.state.error?.toString()}
          </pre>
          <p className="mt-4 text-gray-600">Check the console for more details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { PageTransition } from './components/PageTransition';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <PageTransition>
                <LoginPage />
              </PageTransition>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <PageTransition>
                <SignupPage />
              </PageTransition>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <PageTransition>
                <ForgotPasswordPage />
              </PageTransition>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <PageTransition>
                <ResetPasswordPage />
              </PageTransition>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/auth/action"
          element={
            <PageTransition>
              <AuthActionPage />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <ProtectedRoute requireVerification={false}>
              <PageTransition>
                <VerifyEmailPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirm-email"
          element={
            <PublicOnlyRoute>
              <PageTransition>
                <ConfirmEmailPage />
              </PageTransition>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId"
          element={
            <ProtectedRoute>
              <PageTransition>
                <SessionEditor />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wiki"
          element={
            <ProtectedRoute>
              <PageTransition>
                <WikiPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute>
              <PageTransition>
                <CoverLetterPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter/:sessionId"
          element={
            <ProtectedRoute>
              <PageTransition>
                <CoverLetterPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const Main: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AnimatedRoutes />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default Main;
