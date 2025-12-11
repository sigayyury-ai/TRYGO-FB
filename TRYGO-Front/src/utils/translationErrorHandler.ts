/**
 * Translation Error Handler
 * 
 * This utility helps handle errors that occur when browser translation tools
 * (Google Translate, Microsoft Translator, etc.) modify the DOM while React
 * is trying to update it.
 * 
 * These errors typically include:
 * - "Failed to execute 'removeChild' on 'Node'"
 * - "The node to be removed is not a child of this node"
 * - NotFoundError exceptions
 */

/**
 * Check if an error is related to browser translation tools
 */
export const isTranslationError = (error: Error | string): boolean => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? '' : error.name;

  const translationErrorPatterns = [
    'removeChild',
    'not a child',
    'NotFoundError',
    'Node',
    'Failed to execute',
  ];

  return (
    translationErrorPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    ) || errorName === 'NotFoundError'
  );
};

/**
 * Initialize global error handlers for translation errors
 */
export const initTranslationErrorHandlers = (): void => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && isTranslationError(event.reason)) {
      console.warn('Translation-related promise rejection (suppressed):', event.reason);
      event.preventDefault();
    }
  });

  // Handle global errors
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (error && isTranslationError(error)) {
      console.warn('Translation-related error (suppressed):', error);
      return true; // Prevent default error handling
    }

    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }

    return false;
  };
};

/**
 * Safe wrapper for React operations that might conflict with translations
 */
export const safeReactOperation = async <T>(
  operation: () => T | Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error && isTranslationError(error)) {
      console.warn('Translation conflict during React operation (recovered):', error);
      return fallbackValue;
    }
    throw error; // Re-throw non-translation errors
  }
};

