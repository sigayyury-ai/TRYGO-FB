import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LeanCanvas from "@/components/LeanCanvas";
import Header from "@/components/Header";
import AIAssistantChat from "@/components/AIAssistantChat";
import { useUserStore } from "@/store/useUserStore";
import LoaderSpinner from "@/components/LoaderSpinner";
import { useProjects } from "@/hooks/useProjects";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import { useHypotheses } from "@/hooks/useHypotheses";
import { GenerateProjectModal } from "@/components/GenerateProjectModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const [showGenerateProject, setShowGenerateProject] = useState(false);
  const [hasCheckedProjects, setHasCheckedProjects] = useState(false);
  const { isAuthenticated, initializeAuth, userData, isLoading, hasInitializedProject } =
    useUserStore();
  const {
    activeProject,
    projects,
    loading: projectsLoading,
    loadProjects,
  } = useProjects();

  const { coreData } = useHypothesesCoreStore();
  const { error: hypothesesError } = useHypotheses({ projectId: activeProject?.id, projects });

  useEffect(() => {
    const checkAuthAndProjects = async () => {
      try {
        if (!isAuthenticated) {
          await initializeAuth();
        }

        await loadProjects();
      } catch (error) {
        navigate("/error");
      }
    };

    checkAuthAndProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Виконується тільки один раз при монтуванні

  // Показуємо модалку онбординга тільки якщо проект ще не був сгенерирован
  // Використовуємо hasInitializedProject з userStore, який синхронізований з isProjectGenerated з БД
  useEffect(() => {
    // Перевіряємо тільки якщо:
    // 1. Авторизація завершена (!isLoading)
    // 2. Завантаження проектів завершено (!projectsLoading)
    // 3. Ще не перевіряли (!hasCheckedProjects)
    // Важливо: не показуємо модалку, поки йде завантаження
    if (!isLoading && !projectsLoading && !hasCheckedProjects) {
      setHasCheckedProjects(true);
      // Показуємо модалку тільки якщо проект ще не був сгенерирован (isProjectGenerated === false)
      // hasInitializedProject синхронізований з isProjectGenerated з БД
      if (!hasInitializedProject) {
        // Додаємо невелику затримку, щоб уникнути мигання модалки
        const timer = setTimeout(() => {
          setShowGenerateProject(true);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // Якщо проект вже сгенерирован, закриваємо модалку
        setShowGenerateProject(false);
      }
    }
  }, [isLoading, projectsLoading, hasCheckedProjects, hasInitializedProject]);

  // Закриваємо модалку, якщо проект був сгенерирован
  useEffect(() => {
    if (hasInitializedProject && showGenerateProject) {
      setShowGenerateProject(false);
    }
  }, [hasInitializedProject, showGenerateProject]);

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
      {/* Показуємо модалку онбординга тільки якщо проект ще не був сгенерирован */}
      {!projectsLoading && !isLoading && (
        <GenerateProjectModal
          isOpen={showGenerateProject}
          onClose={() => {
            // Не дозволяємо закрити модалку, якщо проект ще не сгенерирован
            if (!hasInitializedProject) {
              return;
            }
            setShowGenerateProject(false);
          }}
        />
      )}
    </>
  );
};

export default Dashboard;
