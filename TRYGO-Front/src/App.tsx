import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HypothesisProvider } from "./hooks/use-hypothesis";
import GoogleOAuthProvider from "./providers/GoogleOAuthProvider/GoogleOAuthProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Research from "./pages/Research";
import Person from "./pages/Person";
import Hypotheses from "./pages/Hypotheses";
import CustomerSegmentsPage from "./pages/CustomerSegmentsPage";
import NotFound from "./pages/NotFound";

import { useUserStore } from "./store/useUserStore";
import { useProjectStore } from "./store/useProjectStore";
import { useHypothesisStore } from "./store/useHypothesisStore";
import { useSocketStore } from "./store/useSocketStore";
import Cookies from "js-cookie";
import CustomerChannelsPage from "./pages/CustomerChannelsPage";
import Validation from "./pages/Validation";
import Packing from "./pages/Packing";
import Branding from "./pages/Branding";
import GTM from "./pages/GTM";
import PitchMaterials from "./pages/PitchMaterials";
import Features from "./pages/Features";
import Settings from "./pages/Settings";
import SeoAgentPage from "./pages/SeoAgentPage";
import { JoyRideProvider } from "./providers/JoyRideProvider/JoyRideProvider";
import { RequireProject } from "./components/RequireProject";
import { Layout } from "./components/Layout";
import UploadCustomerInterviewsModal from "./components/UploadCustomerInterviewsModal";
import UploadJtbdInterviewsModal from "./components/UploadJtbdInterviewsModal";
import GTMDetails from "./pages/GTMDetails";
import SubscriptionExpiredModal from "./components/SubscriptionExpiredModal";
import useSubscription from "./hooks/use-subscription";
import HotjarProvider from "./providers/HotjarProvider/HotjarProvider";

const queryClient = new QueryClient();

const App = () => {
  const initializeAuth = useUserStore((state) => state.initializeAuth);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const isLoadingAuth = useUserStore((state) => state.isLoading);
  const getProjects = useProjectStore((state) => state.getProjects);
  const projectsLoading = useProjectStore((state) => state.loading);
  const activeProject = useProjectStore((state) => state.activeProject);
  const getHypotheses = useHypothesisStore((state) => state.getHypotheses);
  const { isTrialExpired, needsUpgrade, subscription, isSubscriptionActive, isLoading: subscriptionLoading } = useSubscription();
  const { initSocket } = useSocketStore();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Socket.IO after authentication
  useEffect(() => {
    if (isAuthenticated && !isLoadingAuth) {
      const token = Cookies.get("token");
      
      if (token) {
        // Initialize socket after auth is confirmed
        initSocket(token);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoadingAuth]);

  // Fetch projects after authentication is confirmed
  useEffect(() => {
    if (isAuthenticated && !isLoadingAuth && !projectsLoading) {
      // Wait a bit for token to be synced to cookies after login
      const timer = setTimeout(() => {
        getProjects().catch((error) => {
          console.error('Failed to load projects:', error);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoadingAuth]);

  useEffect(() => {
    if (activeProject?.id) {
      getHypotheses(activeProject.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]); // Виконується тільки при зміні activeProject.id

  return (
    <GoogleOAuthProvider>
      <QueryClientProvider client={queryClient}>
        <HypothesisProvider>
          <TooltipProvider>
            <HotjarProvider />
            <Toaster />
            <Sonner />
            <UploadCustomerInterviewsModal />
            <UploadJtbdInterviewsModal />
          
          {/* Subscription Modals */}
         
        
          <SubscriptionExpiredModal
            isOpen={!subscriptionLoading && isTrialExpired && !isSubscriptionActive}
            type="trial-expired"
          />
          <SubscriptionExpiredModal
            isOpen={!subscriptionLoading && subscription && !isSubscriptionActive && !isTrialExpired}
            type="subscription-inactive"
          />
          
          <BrowserRouter>
            <JoyRideProvider />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <RequireProject>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/research"
                element={
                  <RequireProject>
                    <Layout>
                      <Research />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/person"
                element={
                  <RequireProject>
                    <Layout>
                      <Person />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/hypotheses"
                element={
                  <RequireProject>
                    <Layout>
                      <Hypotheses />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/validation"
                element={
                  <RequireProject>
                    <Layout>
                      <Validation />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/packing"
                element={
                  <RequireProject>
                    <Layout>
                      <Packing />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/branding"
                element={
                  <RequireProject>
                    <Layout>
                      <Branding />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/seo-agent"
                element={
                  <RequireProject>
                    <Layout>
                      <SeoAgentPage />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/gtm"
                element={
                  <RequireProject>
                    <Layout>
                      <GTM />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/gtm/:id"
                element={
                  <RequireProject>
                    <Layout>
                      <GTMDetails />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/materials"
                element={
                  <RequireProject>
                    <Layout>
                      <PitchMaterials />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/segments"
                element={
                  <RequireProject>
                    <Layout>
                      <CustomerSegmentsPage />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/channels"
                element={
                  <RequireProject>
                    <Layout>
                      <CustomerChannelsPage />
                    </Layout>
                  </RequireProject>
                }
              />
              <Route
                path="/features"
                element={
                  <Layout>
                    <Features />
                  </Layout>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireProject>
                    <Layout>
                      <Settings />
                    </Layout>
                  </RequireProject>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </HypothesisProvider>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
