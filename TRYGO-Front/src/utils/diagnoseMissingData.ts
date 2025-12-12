/**
 * Diagnostic utility to check why ICP, Validation, GTM, and Hypotheses data is not loading
 * 
 * Usage in browser console:
 * import { diagnoseMissingData } from '@/utils/diagnoseMissingData';
 * diagnoseMissingData().then(result => console.log(result));
 * 
 * Or as a standalone script:
 * const diagnosis = await window.__DEBUG_STORES__?.diagnoseMissingData?.();
 */

import Cookies from 'js-cookie';
import { getActiveProjectId, getActiveHypothesisId } from './activeState';

export interface DiagnosisResult {
  timestamp: string;
  issues: Array<{
    level: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    details?: any;
    suggestion?: string;
  }>;
  summary: {
    activeProjectId: string | null;
    activeHypothesisId: string | null;
    hasProjects: boolean;
    hasHypotheses: boolean;
    hasIcpData: boolean;
    hasValidationData: boolean;
    hasGtmData: boolean;
  };
}

/**
 * Diagnose why data is not loading
 */
export async function diagnoseMissingData(): Promise<DiagnosisResult> {
  const issues: DiagnosisResult['issues'] = [];
  const summary: DiagnosisResult['summary'] = {
    activeProjectId: null,
    activeHypothesisId: null,
    hasProjects: false,
    hasHypotheses: false,
    hasIcpData: false,
    hasValidationData: false,
    hasGtmData: false,
  };

  // 1. Check cookies
  const projectId = getActiveProjectId();
  const hypothesisId = getActiveHypothesisId();
  
  summary.activeProjectId = projectId;
  summary.activeHypothesisId = hypothesisId;

  if (!projectId) {
    issues.push({
      level: 'error',
      category: 'activeProject',
      message: 'Active project ID is not set in cookies',
      suggestion: 'Select a project from the project selector in the header',
    });
  }

  if (!hypothesisId) {
    issues.push({
      level: 'error',
      category: 'activeHypothesis',
      message: 'Active hypothesis ID is not set in cookies',
      suggestion: projectId 
        ? 'Wait for hypotheses to load, or manually select a hypothesis'
        : 'Select a project first, then wait for hypotheses to load',
    });
  }

  // 2. Check if we can access stores (browser console context)
  try {
    const stores = (window as any).__DEBUG_STORES__;
    if (!stores) {
      issues.push({
        level: 'warning',
        category: 'debug',
        message: 'Debug stores not available - cannot check project/hypothesis state',
        suggestion: 'Refresh the page and try again',
      });
    } else {
      // Try to get project store state
      try {
        // This might not work in all contexts, so we wrap it
        const projectStore = (window as any).useProjectStore?.getState?.();
        if (projectStore) {
          summary.hasProjects = (projectStore.projects?.length || 0) > 0;
          
          if (!summary.hasProjects) {
            issues.push({
              level: 'error',
              category: 'projects',
              message: 'No projects found in store',
              suggestion: 'Check if you are logged in and have created a project',
            });
          }
        }
      } catch (e) {
        // Store might not be available
      }
    }
  } catch (e) {
    // Ignore - we're just trying to get additional context
  }

  // 3. Check GraphQL queries (if we have IDs)
  if (projectId) {
    try {
      // Try to fetch hypotheses
      const { QUERY } = await import('@/config/apollo/client');
      const { GET_PROJECT_HYPOTHESES } = await import('@/api/getProjectHypotheses');
      
      const { data, error } = await QUERY({
        query: GET_PROJECT_HYPOTHESES,
        variables: { projectId },
        fetchPolicy: 'network-only',
      });

      if (error) {
        issues.push({
          level: 'error',
          category: 'graphql',
          message: `GraphQL error when fetching hypotheses: ${error.message}`,
          details: error,
          suggestion: 'Check network connection and backend status',
        });
      } else {
        const hypotheses = data?.getProjectHypotheses || [];
        summary.hasHypotheses = hypotheses.length > 0;

        if (hypotheses.length === 0) {
          issues.push({
            level: 'error',
            category: 'hypotheses',
            message: `No hypotheses found for project ${projectId}`,
            suggestion: 'Generate hypotheses for this project, or check if the project ID is correct',
          });
        } else {
          // Check if active hypothesis ID matches one of the loaded hypotheses
          if (hypothesisId) {
            const foundHypothesis = hypotheses.find((h: any) => h.id === hypothesisId);
            if (!foundHypothesis) {
              issues.push({
                level: 'error',
                category: 'hypothesis-mismatch',
                message: `Active hypothesis ID ${hypothesisId} not found in project hypotheses`,
                details: {
                  availableHypothesisIds: hypotheses.map((h: any) => h.id),
                },
                suggestion: 'Select a valid hypothesis from the hypothesis selector',
              });
            } else {
              // Hypothesis found - check related data
              await checkRelatedData(hypothesisId, summary, issues);
            }
          }
        }
      }
    } catch (e: any) {
      issues.push({
        level: 'error',
        category: 'graphql',
        message: `Failed to check hypotheses: ${e.message}`,
        details: e,
        suggestion: 'Check if GraphQL client is properly configured',
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    issues,
    summary,
  };
}

/**
 * Check if ICP, Validation, and GTM data exists for a hypothesis
 */
async function checkRelatedData(
  hypothesisId: string,
  summary: DiagnosisResult['summary'],
  issues: DiagnosisResult['issues']
) {
  try {
    const { QUERY } = await import('@/config/apollo/client');
    
    // Check ICP data
    try {
      const { GET_ALL_HYPOTHESES_PERSON_PROFILES } = await import('@/api/hypothesesPersonProfile');
      const { data } = await QUERY({
        query: GET_ALL_HYPOTHESES_PERSON_PROFILES,
        variables: { projectHypothesisId: hypothesisId },
        fetchPolicy: 'network-only',
      });
      
      const profiles = data?.getAllHypothesesPersonProfiles || [];
      summary.hasIcpData = profiles.length > 0;
      
      if (!summary.hasIcpData) {
        issues.push({
          level: 'warning',
          category: 'icp',
          message: 'No ICP (Person Profile) data found for this hypothesis',
          suggestion: 'ICP data is generated separately. Check if it needs to be created.',
        });
      }
    } catch (e: any) {
      issues.push({
        level: 'warning',
        category: 'icp',
        message: `Failed to check ICP data: ${e.message}`,
      });
    }

    // Check Validation data
    try {
      const { GET_HYPOTHESES_VALIDATION } = await import('@/api/getHypothesesValidation');
      const { data } = await QUERY({
        query: GET_HYPOTHESES_VALIDATION,
        variables: { projectHypothesisId: hypothesisId },
        fetchPolicy: 'network-only',
      });
      
      summary.hasValidationData = !!data?.getHypothesesValidation;
      
      if (!summary.hasValidationData) {
        issues.push({
          level: 'warning',
          category: 'validation',
          message: 'No Validation data found for this hypothesis',
          suggestion: 'Click "Generate Data" button on the Validation page to create validation data',
        });
      }
    } catch (e: any) {
      issues.push({
        level: 'warning',
        category: 'validation',
        message: `Failed to check Validation data: ${e.message}`,
      });
    }

    // Check GTM data
    try {
      const { GET_HYPOTHESES_GTM } = await import('@/api/getHypothesesGtm');
      const { data } = await QUERY({
        query: GET_HYPOTHESES_GTM,
        variables: { projectHypothesisId: hypothesisId },
        fetchPolicy: 'network-only',
      });
      
      summary.hasGtmData = !!data?.getHypothesesGtm;
      
      if (!summary.hasGtmData) {
        issues.push({
          level: 'warning',
          category: 'gtm',
          message: 'No GTM data found for this hypothesis',
          suggestion: 'Click "Generate Data" button on the GTM page to create GTM data',
        });
      }
    } catch (e: any) {
      issues.push({
        level: 'warning',
        category: 'gtm',
        message: `Failed to check GTM data: ${e.message}`,
      });
    }
  } catch (e) {
    // Ignore import errors
  }
}

/**
 * Format diagnosis result for console output
 */
export function formatDiagnosis(result: DiagnosisResult): string {
  let output = '\n=== DATA LOADING DIAGNOSIS ===\n\n';
  
  output += `Timestamp: ${result.timestamp}\n\n`;
  
  output += 'SUMMARY:\n';
  output += `  Active Project ID: ${result.summary.activeProjectId || 'NOT SET'}\n`;
  output += `  Active Hypothesis ID: ${result.summary.activeHypothesisId || 'NOT SET'}\n`;
  output += `  Has Projects: ${result.summary.hasProjects ? 'YES' : 'NO'}\n`;
  output += `  Has Hypotheses: ${result.summary.hasHypotheses ? 'YES' : 'NO'}\n`;
  output += `  Has ICP Data: ${result.summary.hasIcpData ? 'YES' : 'NO'}\n`;
  output += `  Has Validation Data: ${result.summary.hasValidationData ? 'YES' : 'NO'}\n`;
  output += `  Has GTM Data: ${result.summary.hasGtmData ? 'YES' : 'NO'}\n\n`;
  
  if (result.issues.length === 0) {
    output += '✅ No issues found! Data should be loading correctly.\n';
  } else {
    output += `ISSUES FOUND (${result.issues.length}):\n\n`;
    
    const errors = result.issues.filter(i => i.level === 'error');
    const warnings = result.issues.filter(i => i.level === 'warning');
    const info = result.issues.filter(i => i.level === 'info');
    
    if (errors.length > 0) {
      output += '❌ ERRORS:\n';
      errors.forEach((issue, i) => {
        output += `  ${i + 1}. [${issue.category}] ${issue.message}\n`;
        if (issue.suggestion) {
          output += `     💡 ${issue.suggestion}\n`;
        }
      });
      output += '\n';
    }
    
    if (warnings.length > 0) {
      output += '⚠️  WARNINGS:\n';
      warnings.forEach((issue, i) => {
        output += `  ${i + 1}. [${issue.category}] ${issue.message}\n`;
        if (issue.suggestion) {
          output += `     💡 ${issue.suggestion}\n`;
        }
      });
      output += '\n';
    }
    
    if (info.length > 0) {
      output += 'ℹ️  INFO:\n';
      info.forEach((issue, i) => {
        output += `  ${i + 1}. [${issue.category}] ${issue.message}\n`;
      });
    }
  }
  
  output += '\n================================\n';
  
  return output;
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).diagnoseMissingData = async () => {
    const result = await diagnoseMissingData();
    console.log(formatDiagnosis(result));
    return result;
  };
}
