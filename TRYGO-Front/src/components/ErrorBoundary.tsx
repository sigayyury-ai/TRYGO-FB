import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if the error is related to DOM manipulation by browser translators
    const isTranslatorError = 
      error.message.includes('removeChild') ||
      error.message.includes('Node') ||
      error.message.includes('not a child') ||
      error.name === 'NotFoundError';

    // If it's a translator error, don't show error UI, just log it
    if (isTranslatorError) {
      console.warn('Browser translator conflict detected, but app continues to work:', error);
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if the error is related to DOM manipulation by browser translators
    const isTranslatorError = 
      error.message.includes('removeChild') ||
      error.message.includes('Node') ||
      error.message.includes('not a child') ||
      error.name === 'NotFoundError';

    if (isTranslatorError) {
      // Just log the warning, don't break the app
      console.warn('Browser translator conflict:', error, errorInfo);
      return;
    }

    // For other errors, log them normally
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <h1>Oops! Something went wrong</h1>
          <p>Please refresh the page and try again.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

