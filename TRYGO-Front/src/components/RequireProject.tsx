import { useProjectStore } from "@/store/useProjectStore";
import { useUserStore } from "@/store/useUserStore";
import LoaderSpinner from "./LoaderSpinner";

export const RequireProject = ({ children }: { children: React.ReactNode }) => {
  const loading = useProjectStore((state) => state.loading);
  const error = useProjectStore((state) => state.error);
  const getProjects = useProjectStore((state) => state.getProjects);
  const isLoadingAuth = useUserStore((state) => state.isLoading);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const projects = useProjectStore((state) => state.projects);

  // Show loading while auth is initializing
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderSpinner />
      </div>
    );
  }

  // If not authenticated, don't block - let App.tsx handle redirect
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Show loading only if we're actively loading projects AND have no projects yet
  // If we already have projects, don't block the UI
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderSpinner />
      </div>
    );
  }

  // Если есть ошибка, показываем ошибку
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Loading error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => getProjects()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
