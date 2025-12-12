import { useUserStore } from "@/store/useUserStore";
import { Navigate } from "react-router-dom";

const Index = () => {
  const isLoggedIn = useUserStore((state) => state.isAuthenticated);
  const hasInitializedProject = useUserStore(
    (state) => state.hasInitializedProject
  );

  if (isLoggedIn && hasInitializedProject) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/auth" replace />;
  }
};

export default Index;
