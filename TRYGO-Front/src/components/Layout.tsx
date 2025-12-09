// Layout.tsx
import { useEffect, useState } from "react";
import Header from "./Header";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUserStore } from "@/store/useUserStore";
import { Sidebar } from "./Sidebar";

type LayoutProps = {
  children: React.ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useMediaQuery("(max-width: 1200px)");
  const isLoggedIn = useUserStore((state) => state.isAuthenticated);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed"; // щоб прибити body і не було дергання
      document.body.style.width = "100%";
      document.documentElement.style.overflowX = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.documentElement.style.overflowX = "";
    }
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
      {/* Сайдбар для desktop */}
      {isLoggedIn &&
        (!isMobile ? (
          <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r pt-16">
            <Sidebar />
          </div>
        ) : (
          <div
            className={`fixed inset-0 z-40 flex overflow-x-hidden ${
              sidebarOpen ? "" : "pointer-events-none"
            }`}
          >
            {/* overlay з плавною прозорістю */}
            <div
              className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
                sidebarOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setSidebarOpen(false)}
            />

            {/* сам сайдбар з плавним виїздом */}
            <div
              className={`relative z-50 w-64 h-full bg-white shadow-xl pt-16 overflow-y-auto
                          transform transition-transform duration-300 ease-in-out will-change-transform
                          ${
                            sidebarOpen ? "translate-x-0" : "-translate-x-full"
                          }`}
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        ))}

      <div className={`flex-1 flex flex-col ${!isMobile ? "ml-64" : ""}`}>
        <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
};
