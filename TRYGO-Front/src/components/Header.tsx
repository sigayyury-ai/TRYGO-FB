import { FC, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Search,
  Lightbulb,
  CheckCircle,
  Package,
  Palette,
  Rocket,
  FileText,
  Plus,
  Edit,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/store/useUserStore";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import { useHypothesesPersonProfileStore } from "@/store/useHypothesesPersonProfileStore";
import { useSocketStore } from "@/store/useSocketStore";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { AddHypothesesModal } from "./AddHypothesesModal";
import { EditHypothesisModal } from "./EditHypothesisModal";
import { ProjectHypothesis } from "@/api/getProjectHypotheses";
import SubscriptionLimitsIndicator from "./SubscriptionLimitsIndicator";
import { GenerateProjectModal } from "./GenerateProjectModal";
import useSubscription from "@/hooks/use-subscription";
import UpgradeModal from "./UpgradeModal";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: FC<HeaderProps> = ({ onMenuClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHypothesis, setSelectedHypothesis] = useState<ProjectHypothesis | null>(null);
  const [isGenerateProjectOpen, setIsGenerateProjectOpen] = useState(false);
  const [showHypothesisUpgradeModal, setShowHypothesisUpgradeModal] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1200px)");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = useUserStore((state) => state.isAuthenticated);
  const hasInitializedProject = useUserStore(
    (state) => state.hasInitializedProject
  );


  const logout = useUserStore((state) => state.logout);

  const { activeProject, projects, setActiveProject, loadProjects } = useProjects();
  const {
    hypotheses,
    activeHypothesis,
    loading: hypothesesLoading,
    error: hypothesesError,
    setActiveHypothesis,
    loadHypotheses,
  } = useHypotheses({ projectId: activeProject?.id, projects });
  const { canCreateHypothesis, currentPlan } = useSubscription();

  const handleLogout = async () => {
    // Clear all Zustand stores
    logout();
    useHypothesesCoreStore.persist.clearStorage();
    // Сбрасываем selectedSegmentId через clearActiveIds()
    useHypothesesCoreStore.setState({
      coreData: null,
    });
    useSocketStore.setState({ projectId: null });
    useUserStore.getState().setHasInitializedProject(false);
    
    // Clear active project and hypothesis from cookies
    const { clearActiveIds } = require('@/utils/activeState');
    clearActiveIds();

    // Clear all localStorage
    localStorage.clear();

    // Clear all sessionStorage
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    });

    // Clear IndexedDB
    try {
      const databases = await indexedDB.databases();
      databases.forEach((db) => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    } catch (error) {
      console.warn("Could not clear IndexedDB:", error);
    }

    // Clear Cache Storage
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    } catch (error) {
      console.warn("Could not clear Cache Storage:", error);
    }

    navigate("/");
    setIsMenuOpen(false);
  };

  const handleSetActive = (id: string) => {
    // Сбрасываем selectedSegmentId при смене гипотезы
    const { setActiveCustomerSegmentId } = require('@/utils/activeState');
    setActiveCustomerSegmentId(null);
    setActiveHypothesis(id);
    toast({
      title: "Hypothesis activated",
      description: "This hypothesis is now active across all pages.",
    });
  };

  const handleEditHypothesis = (hypothesis: ProjectHypothesis, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedHypothesis(hypothesis);
    setIsEditDialogOpen(true);
  };

  const handleProjectChange = (value: string) => {
    if (value === "create-new-project") {
      setIsGenerateProjectOpen(true);
    } else {
      setActiveProject(value);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleGetStartedClick = () => {
    navigate("/auth");
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Автоматично вибираємо перший проект, якщо жоден не вибраний
  useEffect(() => {
    if (projects && projects.length > 0 && !activeProject) {
      setActiveProject(projects[0].id);
    }
  }, [projects, activeProject, setActiveProject]);
  
  // Загружаем гипотезы при изменении активного проекта
  useEffect(() => {
    if (activeProject?.id) {
      loadHypotheses(activeProject.id);
    }
  }, [activeProject?.id, loadHypotheses]);


  return (
    <>
      <header
        className={`fixed bg-white/90 backdrop-blur-md top-0 left-0 right-0 z-50 border-b border-blue-100 shadow-sm px-[4px]`}
      >
        <div className="mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <div className="">
              <Link
                to={isLoggedIn ? "/dashboard" : "/"}
                className="flex items-center space-x-2"
              >
                
                <img src="/logo.png" alt="logo" width={24} height={24} className="rounded-sm flex items-center justify-center block" />
                {/* <div className="rounded-md bg-blue-600 p-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-5.412 7.002 1.616 7.168z"></path>
                  <path d="M14.5 21.029a6.082 6.082 0 0 1-7.002-8.618l7.002 1.616 1.617 7.002z"></path>
                </svg>
              </div> */}
                {/* <span className="font-bold text-xl text-blue-900">
                TRYGO
                <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  Beta
                </span>
              </span> */}
                <span className="flex items-center font-bold text-xl text-blue-900">
                  TRYGO
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 mt-3">
                    Beta
                  </span>
                </span>
              </Link>
            </div>

            {isLoggedIn && (
              <div className="flex items-center space-x-4 max-w-[400px]">
                {/* Project Dropdown - показуємо тільки якщо є проекти */}
                {projects && projects.length > 0 && (
                  <Select
                    value={activeProject?.id ?? ""}
                    onValueChange={handleProjectChange}
                  >
                    <SelectTrigger
                      className="border border-green-200/60 shadow-sm bg-green-50/30 hover:bg-green-50/50 px-3 py-2 text-base font-semibold gap-1 rounded-lg transition-colors min-w-[90px]"
                      useUpDownIcon
                    >
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title || `Project ${project.id}`}
                        </SelectItem>
                      ))}
                      <SelectItem
                        key="create-new-project"
                        value="create-new-project"
                        className="font-semibold text-green-600"
                      >
                        <div className="flex flex-row items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          <p>New Project</p>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Hypothesis Dropdown - показуємо тільки якщо є гіпотези */}
                {hypotheses && hypotheses.length > 0 && activeHypothesis && (
                  <div className="max-w-[400px]">
                <Select
                  value={activeHypothesis?.id ?? ""}
                  onValueChange={(value) => {
                    if (value === "create-new") {
                      // Check hypothesis limits before opening modal
                      if (!canCreateHypothesis(hypotheses.length)) {
                        setShowHypothesisUpgradeModal(true);
                      } else {
                        setIsAddDialogOpen(true);
                      }
                    } else {
                      handleSetActive(value);
                    }
                  }}
                >
                  <SelectTrigger
                    id="hypothesis-header"
                    className="border border-blue-200/60 shadow-sm bg-blue-50/30 hover:bg-blue-50/50 px-3 py-2 text-base font-semibold gap-1 rounded-lg transition-colors"
                    useUpDownIcon
                  >
                    <SelectValue placeholder="Select your hypotheses" />
                  </SelectTrigger>
                  <SelectContent>
                    {hypotheses.map((hyp, index) => (
                      <div key={hyp.id} className="relative">
                        <SelectItem 
                          value={hyp.id}
                          id={index === 0 ? "hypothesis-select" : undefined}
                          className="pr-12"
                        >
                          {hyp.title}
                        </SelectItem>
                        <button
                          onClick={(e) => handleEditHypothesis(hyp, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-blue-100 rounded-md bg-blue-50 border border-blue-200 transition-colors z-10"
                          type="button"
                        >
                          <Edit className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                        </button>
                      </div>
                    ))}
                    <SelectItem
                      key="create-new"
                      value="create-new"
                      className="font-semibold text-blue-600"
                      id="hypothesis-add"
                    >
                      <div className="flex flex-row items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        <p>Add Hypothesis</p>
                      </div>
                    </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                )}
              </div>
            )}
          </div>

          {!isMobile ? (
            <nav className="flex items-center space-x-1">
              {isLoggedIn ? (
                <>
                  <SubscriptionLimitsIndicator />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full overflow-hidden h-8 w-8 border"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full overflow-hidden h-8 w-8 border"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const productSection =
                        document.getElementById("features");
                      productSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-blue-700 hover:text-white hover:bg-blue-600"
                  >
                    Product
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const audienceSection =
                        document.getElementById("audience");
                      audienceSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-blue-700 hover:text-white hover:bg-blue-600"
                  >
                    Who It's For
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const processSection = document.getElementById("process");
                      processSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-blue-700 hover:text-white hover:bg-blue-600"
                  >
                    How It Works
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleGetStartedClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </nav>
          ) : (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                // onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <AddHypothesesModal
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
      />
      
      <EditHypothesisModal
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedHypothesis(null);
        }}
        hypothesis={selectedHypothesis}
      />
      
      <GenerateProjectModal
        isOpen={isGenerateProjectOpen}
        onClose={() => setIsGenerateProjectOpen(false)}
      />
      
      <UpgradeModal
        isOpen={showHypothesisUpgradeModal}
        onClose={() => setShowHypothesisUpgradeModal(false)}
        feature="hypothesis creation"
        reason={`You have reached the hypothesis limit for the ${currentPlan} plan. Upgrade your plan to create more hypotheses.`}
      />
    </>
  );
};

export default Header;
