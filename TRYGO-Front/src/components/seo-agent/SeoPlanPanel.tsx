import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlySchedule } from "./plan/MonthlySchedule";
import { BacklogPanel } from "./plan/BacklogPanel";
import LoaderSpinner from "@/components/LoaderSpinner";
import { BacklogStatus, BacklogIdeaDto, getSeoAgentBacklogQuery } from "@/api/getSeoAgentBacklog";
import { getSeoAgentPostingSettingsQuery, PostingSettingsDto } from "@/api/getSeoAgentPostingSettings";

interface SeoPlanPanelProps {
  projectId: string;
  hypothesisId: string; // Required, not optional
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

  // Load backlog from API - обернуто в useCallback
  const loadBacklog = useCallback(async () => {
    if (!projectId || !hypothesisId) return;
    
    setBacklogLoading(true);
    setBacklogError(null);
    try {
      const { data } = await getSeoAgentBacklogQuery(projectId, hypothesisId);
      const items = data?.seoAgentBacklog || [];
      
      // Log queue status for debugging
      const scheduledItems = items.filter(item => item.status === BacklogStatus.SCHEDULED);
      const inProgressItems = items.filter(item => item.status === BacklogStatus.IN_PROGRESS);
      const pendingItems = items.filter(item => item.status === BacklogStatus.PENDING);
      
      console.log("📊 [STATUS_CHECK] ===== ПРОВЕРКА СТАТУСОВ =====");
      console.log("📊 [STATUS_CHECK] Общая статистика:", {
        total: items.length,
        scheduled: scheduledItems.length,
        inProgress: inProgressItems.length,
        pending: pendingItems.length
      });
      
      if (scheduledItems.length > 0) {
        console.log("📊 [STATUS_CHECK] 📅 Запланированные материалы (SCHEDULED):", scheduledItems.map(item => ({
          id: item.id,
          title: item.title,
          date: item.scheduledDate,
          status: item.status
        })));
      }
      
      if (inProgressItems.length > 0) {
        console.log("📊 [STATUS_CHECK] 🚀 Опубликованные материалы (IN_PROGRESS):", inProgressItems.map(item => ({
          id: item.id,
          title: item.title,
          date: item.scheduledDate,
          status: item.status
        })));
      }
      
      if (pendingItems.length > 0) {
        console.log("📊 [STATUS_CHECK] ⏳ В ожидании (PENDING):", pendingItems.length, "материалов");
      }
      
      console.log("📊 [STATUS_CHECK] ===== ПРОВЕРКА ЗАВЕРШЕНА =====");
      
      setBacklogItems(items);
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
  }, [projectId, hypothesisId]);

  // Load settings from API - обернуто в useCallback
  const loadSettings = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    if (projectId && hypothesisId) {
      loadBacklog();
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, hypothesisId]); // loadBacklog and loadSettings are stable (useCallback with deps), no need to include

  // Calculate counts before conditional return (needed for useEffect)
  const scheduledCount = backlogItems.filter(
    item => item.status === BacklogStatus.SCHEDULED
  ).length;
  const inProgressCount = backlogItems.filter(
    item => item.status === BacklogStatus.IN_PROGRESS
  ).length;
  const completedCount = backlogItems.filter(
    item => item.status === BacklogStatus.COMPLETED
  ).length;
  const pendingCount = backlogItems.filter(
    item => item.status === BacklogStatus.PENDING
  ).length;
  
  // Items in sprint = scheduled + in_progress + completed (not shown in backlog)
  const inSprintCount = scheduledCount + inProgressCount + completedCount;
  
  // Log current sprint status - MUST be before conditional return to maintain hook order
  useEffect(() => {
    console.log("📊 [SPRINT_STATUS] ===== ТЕКУЩЕЕ СОСТОЯНИЕ СПРИНТА =====");
    console.log("📊 [SPRINT_STATUS] Всего элементов в беклоге:", backlogItems.length);
    console.log("📊 [SPRINT_STATUS] В спринте:", inSprintCount, {
      scheduled: scheduledCount,
      inProgress: inProgressCount,
      completed: completedCount
    });
    console.log("📊 [SPRINT_STATUS] В беклоге (PENDING):", pendingCount);
    
    if (scheduledCount > 0) {
      const scheduledItems = backlogItems.filter(item => item.status === BacklogStatus.SCHEDULED);
      console.log("📊 [SPRINT_STATUS] 📅 Запланированные материалы:", scheduledItems.map(i => ({
        id: i.id,
        title: i.title,
        scheduledDate: i.scheduledDate
      })));
    }
    
    if (inProgressCount > 0) {
      const inProgressItems = backlogItems.filter(item => item.status === BacklogStatus.IN_PROGRESS);
      console.log("📊 [SPRINT_STATUS] 🚀 Опубликованные материалы:", inProgressItems.map(i => ({
        id: i.id,
        title: i.title,
        scheduledDate: i.scheduledDate
      })));
    }
    
    if (completedCount > 0) {
      const completedItems = backlogItems.filter(item => item.status === BacklogStatus.COMPLETED);
      console.log("📊 [SPRINT_STATUS] ✅ Завершенные материалы:", completedItems.map(i => ({
        id: i.id,
        title: i.title
      })));
    }
    
    console.log("📊 [SPRINT_STATUS] ===== КОНЕЦ СТАТУСА =====");
  }, [backlogItems, inSprintCount, scheduledCount, inProgressCount, completedCount, pendingCount]);

  if (backlogLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderSpinner />
      </div>
    );
  }

  const weeklyPublishCount = settings?.weeklyPublishCount || 2;
  const preferredDays = settings?.preferredDays || ["Tuesday", "Thursday"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Content Plan</h2>
        <p className="text-gray-600">
          Manage your monthly SEO content publication schedule
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">In Sprint:</span>
            <span className="font-semibold text-blue-600">{inSprintCount}</span>
            <span className="text-xs text-gray-400">
              ({scheduledCount} scheduled, {inProgressCount} published, {completedCount} completed)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">In Backlog:</span>
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
            onBacklogUpdated={loadBacklog}
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
              console.log("[SeoPlanPanel] onScheduleItem called", {
                itemId: item.id,
                itemTitle: item.title,
                hasScheduleRef: !!scheduleRef.current
              });
              // Trigger schedule dialog in MonthlySchedule
              if (scheduleRef.current) {
                console.log("[SeoPlanPanel] Calling scheduleRef.current.openScheduleDialog");
                scheduleRef.current.openScheduleDialog(item);
              } else {
                console.error("[SeoPlanPanel] scheduleRef.current is null! Dialog cannot be opened.");
              }
            }}
            onBacklogUpdated={async () => {
              console.log("🔄 [BACKLOG_UPDATE] Обновление беклога после изменений...");
              await loadBacklog();
              console.log("🔄 [BACKLOG_UPDATE] ✅ Беклог обновлен");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
