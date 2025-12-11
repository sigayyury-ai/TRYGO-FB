import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LeanCanvas from "@/components/LeanCanvas";
import Header from "@/components/Header";
import AIAssistantChat from "@/components/AIAssistantChat";
import { useUserStore } from "@/store/useUserStore";
import LoaderSpinner from "@/components/LoaderSpinner";
import { useProjectStore } from "@/store/useProjectStore";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { GenerateProjectModal } from "@/components/GenerateProjectModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const [showGenerateProject, setShowGenerateProject] = useState(false);
  const [hasLoadedProjects, setHasLoadedProjects] = useState(false);
  const { isAuthenticated, initializeAuth, userData, isLoading } =
    useUserStore();
  const {
    getProjects,
    activeProject,
    projects,
    loading: projectsLoading,
  } = useProjectStore();

  const { coreData } = useHypothesesCoreStore();
  const { error: hypothesesError } = useHypothesisStore();

  useEffect(() => {
    const checkAuthAndProjects = async () => {
      try {
        if (!isAuthenticated) {
          await initializeAuth();
        }

        await getProjects();

        const currentProjects = useProjectStore.getState().projects;
        setHasLoadedProjects(true);
        
        // Если проектов нет, показываем модалку генерации проекта
        if (currentProjects.length === 0) {
          setShowGenerateProject(true);
        }
      } catch (error) {
        navigate("/error");
      }
    };

    checkAuthAndProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Виконується тільки один раз при монтуванні

  // Дополнительная проверка при изменении списка проектов
  // Показуємо модалку тільки після першого завантаження проектів
  useEffect(() => {
    if (hasLoadedProjects && !projectsLoading && projects.length === 0) {
      setShowGenerateProject(true);
    }
  }, [projects.length, projectsLoading, hasLoadedProjects]); // Використовуємо projects.length замість projects

  if (isLoading || projectsLoading) {
    return (
      <div>
        <LoaderSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
        <motion.main
          className="px-4 py-8 pt-24 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full mx-auto">
            {hypothesesError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{hypothesesError}</AlertDescription>
              </Alert>
            )}
            
            <motion.div
              className="flex items-center justify-between mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-blue-900">Core Canvas</h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="shadow-lg rounded-lg overflow-hidden"
            >
              <LeanCanvas />
            </motion.div>
          </div>
        </motion.main>

        {/* AI Assistant Chat */}
        <AIAssistantChat />
      </div>

      {/* Generate Project Modal */}
      <GenerateProjectModal
        isOpen={showGenerateProject}
        onClose={() => {
          // Не дозволяємо закрити модалку, якщо немає проектів
          if (projects.length === 0) {
            return;
          }
          setShowGenerateProject(false);
        }}
      />
    </>
  );
};

export default Dashboard;
