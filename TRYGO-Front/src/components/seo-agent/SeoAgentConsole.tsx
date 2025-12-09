import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoPlanPanel } from "./SeoPlanPanel";
import { SeoSemanticsPanel } from "./SeoSemanticsPanel";
import { SeoContentPanel } from "./SeoContentPanel";
import { SeoAnalyticsPanel } from "./SeoAnalyticsPanel";
import { SeoPostingSettingsPanel } from "./SeoPostingSettingsPanel";
import { SubscriptionBanner } from "./SubscriptionBanner";

interface SeoAgentConsoleProps {
  projectId: string;
  hypothesisId?: string;
}

export const SeoAgentConsole = ({ projectId, hypothesisId }: SeoAgentConsoleProps) => {
  return (
    <div className="flex flex-col h-full w-full">
      <SubscriptionBanner />
      
      <Tabs defaultValue="plan" className="flex flex-col flex-1 w-full">
        <TabsList className="grid w-full grid-cols-5 mt-4 mb-6 bg-white border border-gray-200 shadow-sm">
          <TabsTrigger 
            value="plan"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Plan
          </TabsTrigger>
          <TabsTrigger 
            value="semantics"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Semantics
          </TabsTrigger>
          <TabsTrigger 
            value="content"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:font-semibold"
          >
            Content
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
            <SeoPlanPanel projectId={projectId} hypothesisId={hypothesisId} />
          </TabsContent>

          <TabsContent value="semantics" className="mt-0">
            <SeoSemanticsPanel projectId={projectId} hypothesisId={hypothesisId} />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <SeoContentPanel projectId={projectId} hypothesisId={hypothesisId} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <SeoAnalyticsPanel projectId={projectId} hypothesisId={hypothesisId} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SeoPostingSettingsPanel projectId={projectId} hypothesisId={hypothesisId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

