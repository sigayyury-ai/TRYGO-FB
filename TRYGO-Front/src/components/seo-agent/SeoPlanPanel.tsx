import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlySchedule } from "./plan/MonthlySchedule";
import { BacklogPanel } from "./plan/BacklogPanel";
import LoaderSpinner from "@/components/LoaderSpinner";
import { BacklogStatus, BacklogIdeaDto, getSeoAgentBacklogQuery } from "@/api/getSeoAgentBacklog";
import { getSeoAgentPostingSettingsQuery, PostingSettingsDto } from "@/api/getSeoAgentPostingSettings";

interface SeoPlanPanelProps {
  projectId: string;
  hypothesisId?: string;
}

export const SeoPlanPanel = ({ projectId, hypothesisId }: SeoPlanPanelProps) => {
  const [backlogItems, setBacklogItems] = useState<BacklogIdeaDto[]>([]);
  const [settings, setSettings] = useState<PostingSettingsDto | null>(null);
  const [backlogLoading, setBacklogLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [backlogError, setBacklogError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  
  // Ref to MonthlySchedule to trigger schedule dialog
  const scheduleRef = useRef<{ openScheduleDialog: (item: BacklogIdeaDto) => void } | null>(null);

  // Load backlog from API
  const loadBacklog = async () => {
    if (!projectId) return;
    
    setBacklogLoading(true);
    setBacklogError(null);
    try {
      const { data } = await getSeoAgentBacklogQuery(projectId, hypothesisId);
      setBacklogItems(data?.seoAgentBacklog || []);
    } catch (error: unknown) {
      console.error("Error loading backlog:", error);
      let errorMessage = "Failed to load backlog";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setBacklogError(errorMessage);
    } finally {
      setBacklogLoading(false);
    }
  };

  // Load settings from API
  const loadSettings = async () => {
    if (!projectId) return;
    
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const { data } = await getSeoAgentPostingSettingsQuery(projectId);
      setSettings(data?.seoAgentPostingSettings || null);
    } catch (error: unknown) {
      console.error("Error loading settings:", error);
      let errorMessage = "Failed to load settings";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setSettingsError(errorMessage);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadBacklog();
      loadSettings();
    }
  }, [projectId, hypothesisId]);

  if (backlogLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderSpinner />
      </div>
    );
  }

  const weeklyPublishCount = settings?.weeklyPublishCount || 2;
  const preferredDays = settings?.preferredDays || ["Tuesday", "Thursday"];

  const scheduledCount = backlogItems.filter(
    item => item.status === BacklogStatus.SCHEDULED
  ).length;
  const pendingCount = backlogItems.filter(
    item => item.status === BacklogStatus.PENDING
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Plan</h2>
        <p className="text-gray-600">
          Manage your monthly SEO content publication schedule
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Scheduled:</span>
            <span className="font-semibold text-blue-600">{scheduledCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Pending:</span>
            <span className="font-semibold text-gray-600">{pendingCount}</span>
          </div>
        </div>
      </div>

      {(backlogError || settingsError) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800 font-medium">
              {backlogError || settingsError}
            </p>
            {(backlogError?.includes("not available") || settingsError?.includes("not available")) && (
              <p className="text-xs text-yellow-600 mt-2">
                The SEO Agent backend API is being developed. The UI is ready and will work once the API is deployed.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Monthly Schedule</CardTitle>
          <CardDescription>
            4 weeks view with {weeklyPublishCount} publication slot{weeklyPublishCount !== 1 ? "s" : ""} per week
            {preferredDays.length > 0 && ` (${preferredDays.join(", ")})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlySchedule
            ref={scheduleRef}
            projectId={projectId}
            hypothesisId={hypothesisId}
            weeklyPublishCount={weeklyPublishCount}
            preferredDays={preferredDays}
            backlogItems={backlogItems}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backlog Ideas</CardTitle>
          <CardDescription>
            Ideas generated from Semantics tab - push items into sprint slots when ready to schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BacklogPanel
            projectId={projectId}
            hypothesisId={hypothesisId}
            backlogItems={backlogItems}
            onScheduleItem={(item) => {
              // Trigger schedule dialog in MonthlySchedule
              if (scheduleRef.current) {
                scheduleRef.current.openScheduleDialog(item);
              }
            }}
            onBacklogUpdated={loadBacklog}
          />
        </CardContent>
      </Card>
    </div>
  );
};
