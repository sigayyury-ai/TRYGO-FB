/**
 * React hooks for accessing active project and hypothesis IDs from cookies
 * Replaces direct Zustand store access for IDs
 * These hooks are reactive and update when cookies change
 */

import { useState, useEffect, useCallback } from 'react';
import { getActiveProjectId, getActiveHypothesisId, getActiveIds, getActiveCustomerSegmentId } from '@/utils/activeState';

/**
 * Hook to get active project ID from cookies (reactive)
 * Updates when cookies change
 */
export function useActiveProjectId(): string | null {
  const [projectId, setProjectId] = useState<string | null>(() => getActiveProjectId());

  useEffect(() => {
    // Check for cookie changes periodically
    const checkCookies = () => {
      const currentId = getActiveProjectId();
      setProjectId(prevId => {
        // Only update if value actually changed to prevent unnecessary re-renders
        if (currentId !== prevId) {
          return currentId;
        }
        return prevId;
      });
    };

    // Check immediately
    checkCookies();

    // Listen for storage events (when cookies are updated via document.cookie)
    const handleStorageChange = () => {
      checkCookies();
    };

    // Check periodically (every 1000ms) for cookie changes - reduced frequency to prevent performance issues
    const interval = setInterval(checkCookies, 1000);

    // Listen for custom cookie change events
    window.addEventListener('cookiechange', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cookiechange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty deps - only run once on mount

  return projectId;
}

/**
 * Hook to get active hypothesis ID from cookies (reactive)
 * Updates when cookies change
 */
export function useActiveHypothesisId(): string | null {
  const [hypothesisId, setHypothesisId] = useState<string | null>(() => getActiveHypothesisId());

  useEffect(() => {
    // Check for cookie changes periodically
    const checkCookies = () => {
      const currentId = getActiveHypothesisId();
      setHypothesisId(prevId => {
        // Only update if value actually changed to prevent unnecessary re-renders
        if (currentId !== prevId) {
          return currentId;
        }
        return prevId;
      });
    };

    // Check immediately
    checkCookies();

    // Listen for storage events (when cookies are updated via document.cookie)
    const handleStorageChange = () => {
      checkCookies();
    };

    // Check periodically (every 1000ms) for cookie changes - reduced frequency to prevent performance issues
    const interval = setInterval(checkCookies, 1000);

    // Listen for custom cookie change events
    window.addEventListener('cookiechange', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cookiechange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty deps - only run once on mount

  return hypothesisId;
}

/**
 * Hook to get active customer segment ID from cookies (reactive)
 * Updates when cookies change
 */
export function useActiveCustomerSegmentId(): string | null {
  const [segmentId, setSegmentId] = useState<string | null>(() => getActiveCustomerSegmentId());

  useEffect(() => {
    const checkCookies = () => {
      const currentId = getActiveCustomerSegmentId();
      setSegmentId(prevId => {
        if (currentId !== prevId) {
          return currentId;
        }
        return prevId;
      });
    };

    checkCookies();
    const interval = setInterval(checkCookies, 1000);
    const handleStorageChange = () => checkCookies();

    window.addEventListener('cookiechange', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cookiechange', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return segmentId;
}

/**
 * Hook to get both active project and hypothesis IDs from cookies (reactive)
 * Updates when cookies change
 */
export function useActiveIds(): { projectId: string | null; hypothesisId: string | null } {
  const projectId = useActiveProjectId();
  const hypothesisId = useActiveHypothesisId();

  return { projectId, hypothesisId };
}
