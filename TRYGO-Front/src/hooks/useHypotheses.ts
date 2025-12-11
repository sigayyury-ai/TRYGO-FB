/**
 * Hook for loading and managing hypotheses
 * Uses cookies for active hypothesis ID instead of Zustand store
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getProjectHypothesesQuery,
  ProjectHypothesis,
} from '@/api/getProjectHypotheses';
import {
  changeProjectHypothesisMutation,
  ChangeProjectHypothesisInput,
} from '@/api/changeProjectHypothesis';
import { deleteProjectHypothesisMutation } from '@/api/deleteProjectHypothesis';
import { getActiveHypothesisId, setActiveHypothesisId } from '@/utils/activeState';

interface UseHypothesesOptions {
  projectId?: string;
  projects?: Array<{ id: string; createdAt?: string | Date }>;
}

export function useHypotheses(options: UseHypothesesOptions = {}) {
  const { projectId, projects = [] } = options;
  const [hypotheses, setHypotheses] = useState<ProjectHypothesis[]>([]);
  const [activeHypothesis, setActiveHypothesis] = useState<ProjectHypothesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHypotheses = useCallback(async (targetProjectId: string) => {
    if (!targetProjectId) {
      setHypotheses([]);
      setActiveHypothesis(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await getProjectHypothesesQuery(targetProjectId);
      const loadedHypotheses = data.getProjectHypotheses || [];

      // Перевіряємо чи проект новостворений і чи прийшов порожній масив гіпотез
      if (loadedHypotheses.length === 0) {
        const currentProject = projects.find(p => p.id === targetProjectId);

        // Якщо проект новий (створений менше 5 хвилин тому) і гіпотез немає
        if (currentProject && (currentProject as any).createdAt) {
          const projectAge = Date.now() - new Date((currentProject as any).createdAt).getTime();
          const fiveMinutes = 5 * 60 * 1000;

          if (projectAge < fiveMinutes) {
            // Це новий проект без гіпотез - це помилка генерації
            setHypotheses([]);
            setLoading(false);
            setError('Unfortunately something went wrong with project generation, попробуйте создать новый аккаунт');
            setActiveHypothesis(null);
            return;
          }
        }
      }

      // Восстанавливаем из cookies
      const savedHypothesisId = getActiveHypothesisId();
      let foundActiveHypothesis: ProjectHypothesis | null = null;

      if (savedHypothesisId) {
        // Ищем сохраненную гипотезу в свежих данных из API
        const found = loadedHypotheses.find(h => h.id === savedHypothesisId && h.projectId === targetProjectId);
        if (found) {
          foundActiveHypothesis = found;
        } else {
          // Сохраненная гипотеза не найдена или принадлежит другому проекту - очищаем cookie
          setActiveHypothesisId(null);
        }
      }

      // Если не нашли в cookies или cookies пуст, берем первую гипотезу
      if (!foundActiveHypothesis && loadedHypotheses.length > 0) {
        foundActiveHypothesis = loadedHypotheses[0];
        // Сохраняем в cookies
        setActiveHypothesisId(foundActiveHypothesis.id);
      }

      setHypotheses(loadedHypotheses);
      setActiveHypothesis(foundActiveHypothesis);
      setLoading(false);
    } catch (err: unknown) {
      let errorMessage = 'Failed to load hypotheses';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, [projects]);

  const setActive = useCallback((hypothesisId: string) => {
    if (!hypothesisId || hypothesisId.trim() === '') {
      setActiveHypothesisId(null);
      setActiveHypothesis(null);
      return;
    }

    const hypothesis = hypotheses.find((h) => h.id === hypothesisId);
    if (hypothesis) {
      // Сохраняем в cookies
      setActiveHypothesisId(hypothesisId);
      setActiveHypothesis(hypothesis);
    }
  }, [hypotheses]);

  const changeHypothesis = useCallback(async (input: ChangeProjectHypothesisInput) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await changeProjectHypothesisMutation({
        input: {
          id: input.id,
          title: input.title,
          description: input.description,
        },
      });

      const updatedHypothesis = data.changeProjectHypothesis;

      setHypotheses((prev) =>
        prev.map((h) => (h.id === input.id ? updatedHypothesis : h))
      );
      setLoading(false);

      if (activeHypothesis?.id === input.id) {
        setActiveHypothesis(updatedHypothesis);
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to update hypothesis';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, [activeHypothesis]);

  const deleteHypothesis = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProjectHypothesisMutation({
        deleteProjectHypothesisId: id,
      });

      setHypotheses((prev) => prev.filter((h) => h.id !== id));
      setLoading(false);

      if (activeHypothesis?.id === id) {
        const remaining = hypotheses.filter((h) => h.id !== id);
        setActiveHypothesis(remaining[0] || null);
        if (remaining[0]) {
          setActiveHypothesisId(remaining[0].id);
        } else {
          setActiveHypothesisId(null);
        }
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to delete hypothesis';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, [activeHypothesis, hypotheses]);

  useEffect(() => {
    if (projectId) {
      loadHypotheses(projectId);
    } else {
      setHypotheses([]);
      setActiveHypothesis(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Убираем loadHypotheses из зависимостей, чтобы избежать бесконечного цикла

  return {
    hypotheses,
    activeHypothesis,
    loading,
    error,
    loadHypotheses,
    setActiveHypothesis: setActive,
    changeHypothesis,
    deleteHypothesis,
  };
}

