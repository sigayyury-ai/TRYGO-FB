/**
 * Cookie-based state management for active project and hypothesis IDs
 * Replaces Zustand stores for global state management
 */

import Cookies from 'js-cookie';

const COOKIE_PROJECT_ID = 'activeProjectId';
const COOKIE_HYPOTHESIS_ID = 'activeHypothesisId';
const COOKIE_SELECTED_SEGMENT_ID = 'activeCustomerSegmentId';
const COOKIE_EXPIRES_DAYS = 365;

/**
 * Get the active project ID from cookies
 * @returns Project ID string or null if not set
 */
export function getActiveProjectId(): string | null {
  return Cookies.get(COOKIE_PROJECT_ID) || null;
}

/**
 * Get the active hypothesis ID from cookies
 * @returns Hypothesis ID string or null if not set
 */
export function getActiveHypothesisId(): string | null {
  return Cookies.get(COOKIE_HYPOTHESIS_ID) || null;
}

/**
 * Get both active project and hypothesis IDs
 * @returns Object with projectId and hypothesisId (can be null)
 */
export function getActiveIds(): { projectId: string | null; hypothesisId: string | null } {
  return {
    projectId: getActiveProjectId(),
    hypothesisId: getActiveHypothesisId(),
  };
}

/**
 * Dispatch a custom event to notify components about cookie changes
 */
function dispatchCookieChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cookiechange'));
  }
}

/**
 * Set the active project ID in cookies
 * @param projectId - Project ID to set (null to remove)
 */
export function setActiveProjectId(projectId: string | null): void {
  if (!projectId || projectId.trim() === '') {
    Cookies.remove(COOKIE_PROJECT_ID);
  } else {
    Cookies.set(COOKIE_PROJECT_ID, projectId, { expires: COOKIE_EXPIRES_DAYS });
  }
  dispatchCookieChange();
}

/**
 * Set the active hypothesis ID in cookies
 * @param hypothesisId - Hypothesis ID to set (null to remove)
 */
export function setActiveHypothesisId(hypothesisId: string | null): void {
  if (!hypothesisId || hypothesisId.trim() === '') {
    Cookies.remove(COOKIE_HYPOTHESIS_ID);
  } else {
    Cookies.set(COOKIE_HYPOTHESIS_ID, hypothesisId, { expires: COOKIE_EXPIRES_DAYS });
  }
  dispatchCookieChange();
}

/**
 * Set both active project and hypothesis IDs
 * @param projectId - Project ID to set
 * @param hypothesisId - Hypothesis ID to set
 */
export function setActiveIds(projectId: string | null, hypothesisId: string | null): void {
  setActiveProjectId(projectId);
  setActiveHypothesisId(hypothesisId);
}

/**
 * Get the active customer segment ID from cookies
 * @returns Segment ID string or null if not set
 */
export function getActiveCustomerSegmentId(): string | null {
  return Cookies.get(COOKIE_SELECTED_SEGMENT_ID) || null;
}

/**
 * Set the active customer segment ID in cookies
 * @param segmentId - Segment ID to set (null to remove)
 */
export function setActiveCustomerSegmentId(segmentId: string | null): void {
  if (!segmentId || segmentId.trim() === '') {
    Cookies.remove(COOKIE_SELECTED_SEGMENT_ID);
  } else {
    Cookies.set(COOKIE_SELECTED_SEGMENT_ID, segmentId, { expires: COOKIE_EXPIRES_DAYS });
  }
  dispatchCookieChange();
}

/**
 * Clear both active project and hypothesis IDs
 */
export function clearActiveIds(): void {
  Cookies.remove(COOKIE_PROJECT_ID);
  Cookies.remove(COOKIE_HYPOTHESIS_ID);
  Cookies.remove(COOKIE_SELECTED_SEGMENT_ID);
}

