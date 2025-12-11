// import { createRoot } from 'react-dom/client'
// import App from './App.tsx'
// import './index.css'

// createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ApolloProvider } from '@apollo/client';
import { client } from './config/apollo/client';
import ErrorBoundary from './components/ErrorBoundary';
import { initTranslationErrorHandlers, isTranslationError } from './utils/translationErrorHandler';
import { initFrontendLogger } from './utils/frontendLogger';

// Initialize global handlers for translation errors
initTranslationErrorHandlers();

// Initialize frontend logger (sends logs to backend)
// Frontend logger disabled by default to prevent memory leaks in Cursor/Electron
// Uncomment to enable: initFrontendLogger();
// Or enable conditionally: if (import.meta.env.DEV) initFrontendLogger();

// Suppress React removeChild errors caused by browser translators
const originalConsoleError = console.error;
console.error = (...args) => {
  const firstArg = args[0];
  
  if (typeof firstArg === 'string' && isTranslationError(firstArg)) {
    // Silently ignore translator-related errors
    return;
  }
  
  if (firstArg instanceof Error && isTranslationError(firstArg)) {
    // Silently ignore translator-related errors
    return;
  }
  
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </ErrorBoundary>
);
