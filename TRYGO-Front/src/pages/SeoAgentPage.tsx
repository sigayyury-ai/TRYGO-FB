import { useSeoAgentEnabled } from "@/config/featureFlags";
import { SeoAgentConsole } from "@/components/seo-agent/SeoAgentConsole";
import LoaderSpinner from "@/components/LoaderSpinner";
import { useActiveProjectId, useActiveHypothesisId } from "@/hooks/useActiveIds";

const SeoAgentPage = () => {
  const seoAgentEnabled = useSeoAgentEnabled();
  
  // Используем простые хуки для получения ID из cookies, как в GTM и Validation
  const activeProjectId = useActiveProjectId();
  const activeHypothesisId = useActiveHypothesisId();

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

  // Если нет projectId или hypothesisId, показываем загрузку (как в GTM/Validation)
  if (!activeProjectId || !activeHypothesisId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full h-full">
      <h1 className="text-2xl font-bold mb-4">SEO Agent Workspace</h1>
      <SeoAgentConsole 
        projectId={activeProjectId}
        hypothesisId={activeHypothesisId}
      />
    </div>
  );
};

export default SeoAgentPage;
