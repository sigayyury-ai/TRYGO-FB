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

// Initialize global handlers for translation errors
initTranslationErrorHandlers();

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
