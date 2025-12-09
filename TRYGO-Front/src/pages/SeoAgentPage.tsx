import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { useSeoAgentEnabled } from "@/config/featureFlags";
import { SeoAgentConsole } from "@/components/seo-agent/SeoAgentConsole";

const SeoAgentPage = () => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const activeHypothesis = useHypothesisStore((state) => state.activeHypothesis);
  const seoAgentEnabled = useSeoAgentEnabled();

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

  // RequireProject уже проверяет наличие проектов,
  // но добавим дополнительную проверку для безопасности
  if (!activeProject) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col flex-1 w-full h-full">
      <h1 className="text-2xl font-bold mb-4">SEO Agent Workspace</h1>
      <SeoAgentConsole 
        projectId={activeProject.id}
        hypothesisId={activeHypothesis?.id}
      />
    </div>
  );
};

export default SeoAgentPage;

