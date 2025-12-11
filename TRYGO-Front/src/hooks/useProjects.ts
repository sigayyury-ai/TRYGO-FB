/**
 * Hook for loading and managing projects
 * Uses cookies for active project ID instead of Zustand store
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProjectsQuery, ProjectDto } from '@/api/getProjects';
import Cookies from 'js-cookie';
import { getActiveProjectId, setActiveProjectId } from '@/utils/activeState';
import { useActiveProjectId } from './useActiveIds';

const COOKIE_PROJECT_ID = 'activeProjectId';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  
  // Используем реактивный хук для чтения activeProjectId
  const activeProjectIdFromCookie = useActiveProjectId();

  const loadProjects = useCallback(async () => {
    // Check if token exists before making request
    const token = Cookies.get('token');
    if (!token) {
      setLoading(false);
      setError(null);
      return;
    }

    // Prevent multiple simultaneous requests using ref
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await getProjectsQuery();
      
      const data = result?.data;
      const queryError = result?.error;
      
      if (queryError) {
        console.error('[useProjects] Query error:', queryError);
        throw queryError;
      }
      
      if (!data) {
        console.error('[useProjects] No data in response');
        throw new Error('No data in response');
      }
      
      const loadedProjects = data?.getProjects || [];

      // Восстанавливаем из cookies (читаем напрямую, не через хук, чтобы избежать циклов)
      const savedProjectId = getActiveProjectId();
      let foundActiveProject: ProjectDto | null = null;

      if (savedProjectId) {
        // Ищем сохраненный проект в свежих данных из API
        const found = loadedProjects.find(p => p.id === savedProjectId);
        if (found) {
          foundActiveProject = found;
        } else {
          // Сохраненный проект не найден в API - очищаем cookie
          setActiveProjectId(null);
        }
      }

      // Если не нашли в cookies или cookies пуст, берем первый проект
      if (!foundActiveProject && loadedProjects.length > 0) {
        foundActiveProject = loadedProjects[0];
        // Сохраняем в cookies
        setActiveProjectId(foundActiveProject.id);
      }

      setProjects(loadedProjects);
      setActiveProject(foundActiveProject);
      setLoading(false);
      setError(null);
      isLoadingRef.current = false;
    } catch (err: unknown) {
      let errorMessage = 'Failed to load projects';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error('[useProjects] Error loading projects:', err);
      setError(errorMessage);
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // Убрали все зависимости, используем ref для предотвращения множественных вызовов

  const setActive = useCallback((projectId: string) => {
    if (!projectId || projectId.trim() === '') {
      setActiveProjectId(null);
      setActiveProject(null);
      return;
    }

    const project = projects.find((p) => p.id === projectId);
    if (project) {
      // Сохраняем в cookies
      setActiveProjectId(projectId);
      setActiveProject(project);
    }
  }, [projects]);

  // Обновляем activeProject когда изменяется activeProjectId из cookie или загружаются проекты
  // Используем useRef для отслеживания предыдущего значения, чтобы избежать лишних обновлений
  const prevActiveProjectIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Только обновляем если ID действительно изменился
    if (projects.length > 0 && activeProjectIdFromCookie && activeProjectIdFromCookie !== prevActiveProjectIdRef.current) {
      const found = projects.find(p => p.id === activeProjectIdFromCookie);
      if (found && found.id !== activeProject?.id) {
        setActiveProject(found);
        prevActiveProjectIdRef.current = activeProjectIdFromCookie;
      }
    } else if (!activeProjectIdFromCookie && activeProject) {
      // Не очищаем сразу, возможно cookie еще не установлен
      prevActiveProjectIdRef.current = null;
    }
  }, [activeProjectIdFromCookie, projects, activeProject]);

  useEffect(() => {
    loadProjects();
  }, []); // Load once on mount

  return {
    projects,
    activeProject,
    loading,
    error,
    loadProjects,
    setActiveProject: setActive,
  };
}

