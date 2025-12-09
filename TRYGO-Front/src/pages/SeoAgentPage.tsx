import { Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useSeoAgentEnabled } from "@/config/featureFlags";
import { SeoAgentConsole } from "@/components/seo-agent/SeoAgentConsole";
import LoaderSpinner from "@/components/LoaderSpinner";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { useProjectStore } from "@/store/useProjectStore";

const SeoAgentPage = () => {
  const seoAgentEnabled = useSeoAgentEnabled();
  
  // Используем Zustand stores вместо локального состояния
  const { 
    activeProject, 
    projects, 
    setActiveProject,
    getProjects,
    loading: projectsLoading
  } = useProjectStore();
  
  const { 
    activeHypothesis, 
    hypotheses, 
    setActiveHypothesis,
    getHypotheses,
    loading: hypothesesLoading
  } = useHypothesisStore();
  
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем проекты при монтировании (если еще не загружены)
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

        // Всегда загружаем проекты заново, чтобы убедиться, что данные актуальны
        await getProjects();
        
        // Получаем свежие данные из store после загрузки
        const freshProjects = useProjectStore.getState().projects;
        const freshActiveProject = useProjectStore.getState().activeProject;
        
        if (freshProjects.length === 0) {
          setError("No projects found. Please create a project first.");
          setInitialized(true);
          return;
        }

        // Проверяем, что activeProject существует в свежих данных
        if (freshActiveProject) {
          const exists = freshProjects.find(p => p.id === freshActiveProject.id);
          if (!exists) {
            console.warn("[SeoAgentPage] Active project not found in fresh data, selecting first project");
            if (freshProjects.length > 0) {
              setActiveProject(freshProjects[0].id);
            }
          }
        } else if (freshProjects.length > 0) {
          // Если нет активного проекта, выбираем первый
          setActiveProject(freshProjects[0].id);
        }
        
        setInitialized(true);
      } catch (err) {
        console.error("[SeoAgentPage] Error loading projects:", err);
        setError(err instanceof Error ? err.message : "Failed to load projects");
        setInitialized(true);
      }
    };

    if (!initialized) {
      loadData();
    }
  }, [initialized, getProjects, setActiveProject]);

  // Загружаем гипотезы при изменении проекта
  useEffect(() => {
    if (!activeProject || !initialized) return;

    const loadHypotheses = async () => {
      try {
        setError(null);
        
        // Загружаем гипотезы через store, если их еще нет для этого проекта
        const currentHypotheses = hypotheses.filter(h => h.projectId === activeProject.id);
        if (currentHypotheses.length === 0) {
          await getHypotheses(activeProject.id);
        }

        const updatedHypotheses = useHypothesisStore.getState().hypotheses.filter(h => h.projectId === activeProject.id);
        if (updatedHypotheses.length === 0) {
          setError("No hypotheses found for this project. Please create a hypothesis first.");
          return;
        }

        // Store автоматически выберет первую гипотезу, если активной нет
      } catch (err) {
        console.error("[SeoAgentPage] Error loading hypotheses:", err);
        setError(err instanceof Error ? err.message : "Failed to load hypotheses");
      }
    };

    loadHypotheses();
  }, [activeProject, initialized, getHypotheses]);

  // Валидация: проверяем, что не используем удаленные ID (только один раз при монтировании)
  // Используем useRef чтобы не создавать цикл обновлений
  const validationDoneRef = useRef(false);
  useEffect(() => {
    if (validationDoneRef.current) return; // Уже проверили
    
    const DELETED_PROJECT_ID = "686774b6773b5947fed60a78";
    const DELETED_HYPOTHESIS_ID = "686774c1773b5947fed60a7a";
    
    // Проверяем только если есть activeProject или activeHypothesis
    if (!activeProject && !activeHypothesis) return;
    
    if (activeProject?.id === DELETED_PROJECT_ID || activeHypothesis?.id === DELETED_HYPOTHESIS_ID) {
      validationDoneRef.current = true; // Помечаем, что уже обработали
      
      // Очищаем stores тихо
      setActiveProject("");
      setActiveHypothesis("");
      // Очищаем localStorage
      try {
        const projectStore = localStorage.getItem("project-store");
        if (projectStore) {
          const parsed = JSON.parse(projectStore);
          parsed.state.activeProject = null;
          localStorage.setItem("project-store", JSON.stringify(parsed));
        }
        const hypothesisStore = localStorage.getItem("hypothesis-store");
        if (hypothesisStore) {
          const parsed = JSON.parse(hypothesisStore);
          parsed.state.activeHypothesis = null;
          localStorage.setItem("hypothesis-store", JSON.stringify(parsed));
        }
      } catch (e) {
        // Silent fail
      }
      // НЕ перезагружаем автоматически - просто очищаем и пусть stores выберут новый проект
    } else {
      validationDoneRef.current = true; // Помечаем, что проверка пройдена
    }
  }, []); // Только при монтировании, БЕЗ зависимостей!

  // Check feature flag
  if (!seoAgentEnabled) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            SEO Agent недоступен
          </h2>
          <p className="text-gray-600">
            Эта функция временно недоступна. Попробуйте позже.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!initialized || projectsLoading || hypothesesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // No project or hypothesis
  if (!activeProject || !activeHypothesis) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validate hypothesis belongs to project
  if (activeHypothesis.projectId !== activeProject.id) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Data Mismatch</h2>
          <p className="text-gray-600 mb-4">
            Hypothesis does not belong to the selected project. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full h-full">
      <h1 className="text-2xl font-bold mb-4">SEO Agent Workspace</h1>
      {activeProject && activeHypothesis && (
        <SeoAgentConsole 
          projectId={activeProject.id}
          hypothesisId={activeHypothesis.id}
        />
      )}
    </div>
  );
};

export default SeoAgentPage;
