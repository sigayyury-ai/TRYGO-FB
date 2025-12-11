import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoPlanPanel } from "./SeoPlanPanel";
import { SeoSemanticsPanel } from "./SeoSemanticsPanel";
import { SeoContentPanel } from "./SeoContentPanel";
import { SeoAnalyticsPanel } from "./SeoAnalyticsPanel";
import { SeoPostingSettingsPanel } from "./SeoPostingSettingsPanel";
import { SubscriptionBanner } from "./SubscriptionBanner";

interface SeoAgentConsoleProps {
  projectId: string;
  hypothesisId: string; // Required, not optional
}

const VALID_TABS = ["plan", "content", "semantics", "analytics", "settings"] as const;
type TabValue = typeof VALID_TABS[number];

export const SeoAgentConsole = ({ projectId, hypothesisId }: SeoAgentConsoleProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL hash or default to "plan"
  const getTabFromUrl = (): TabValue => {
    const hash = location.hash.replace("#", "");
    if (hash && VALID_TABS.includes(hash as TabValue)) {
      return hash as TabValue;
    }
    return "plan";
  };

  const [activeTab, setActiveTab] = useState<TabValue>(getTabFromUrl());

  // Update tab when URL hash changes
  useEffect(() => {
    const tab = getTabFromUrl();
    setActiveTab(tab);
  }, [location.hash]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
    navigate(`#${tab}`, { replace: true });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <SubscriptionBanner />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1 w-full">
        <TabsList className="grid w-full grid-cols-5 mt-4 mb-6 bg-white border border-gray-200 shadow-sm">
          <TabsTrigger 
            value="plan"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Plan
          </TabsTrigger>
          <TabsTrigger 
            value="content"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Content
          </TabsTrigger>
          <TabsTrigger 
            value="semantics"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Semantics
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="plan" className="mt-0">
            {activeTab === "plan" && <SeoPlanPanel projectId={projectId} hypothesisId={hypothesisId} />}
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            {activeTab === "content" && <SeoContentPanel projectId={projectId} hypothesisId={hypothesisId} />}
          </TabsContent>

          <TabsContent value="semantics" className="mt-0">
            {activeTab === "semantics" && <SeoSemanticsPanel projectId={projectId} hypothesisId={hypothesisId} />}
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            {activeTab === "analytics" && <SeoAnalyticsPanel projectId={projectId} hypothesisId={hypothesisId} />}
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            {activeTab === "settings" && <SeoPostingSettingsPanel projectId={projectId} hypothesisId={hypothesisId} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
