/**
 * Utility functions to get active project and hypothesis from cookies
 * with optional synchronization from API data
 * 
 * This is a temporary bridge to help migrate from Zustand stores to cookies
 */

import { getActiveProjectId, getActiveHypothesisId } from './activeState';
import { ProjectDto } from '@/api/getProjects';
import { ProjectHypothesis } from '@/api/getProjectHypotheses';

/**
 * Get active project object from a list of projects using cookie ID
 */
export function getActiveProjectFromList(projects: ProjectDto[]): ProjectDto | null {
  const projectId = getActiveProjectId();
  if (!projectId || projects.length === 0) {
    return null;
  }
  return projects.find(p => p.id === projectId) || null;
}

/**
 * Get active hypothesis object from a list of hypotheses using cookie ID
 */
export function getActiveHypothesisFromList(hypotheses: ProjectHypothesis[]): ProjectHypothesis | null {
  const hypothesisId = getActiveHypothesisId();
  if (!hypothesisId || hypotheses.length === 0) {
    return null;
  }
  return hypotheses.find(h => h.id === hypothesisId) || null;
}





