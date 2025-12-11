import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Play, X, Plus, Clock } from "lucide-react";
import { BacklogIdeaDto, BacklogStatus, BacklogContentType } from "@/api/getSeoAgentBacklog";
import { useSeoAgentBacklogStore } from "@/store/useSeoAgentBacklogStore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getContentItemByBacklogIdeaQuery } from "@/api/getContentItemByBacklogIdea";
import { publishToWordPressMutation } from "@/api/publishToWordPress";

interface MonthlyScheduleProps {
  projectId: string;
  hypothesisId?: string;
  weeklyPublishCount: number;
  preferredDays: string[];
  backlogItems: BacklogIdeaDto[];
  onScheduleItem?: (item: BacklogIdeaDto) => void;
  onBacklogUpdated?: () => void; // Callback to refresh backlog after changes
}

export interface MonthlyScheduleRef {
  openScheduleDialog: (item: BacklogIdeaDto) => void;
}

interface ScheduledItem {
  id: string;
  title: string;
  date: Date;
  backlogItemId: string;
  contentType: BacklogContentType;
  description?: string;
  status?: BacklogStatus; // Include status for visual distinction
}

const getWeeks = (): Date[][] => {
  const weeks: Date[][] = [];
  const today = new Date();
  const currentWeekStart = new Date(today);
  // Start of week (Monday = 0)
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  currentWeekStart.setDate(today.getDate() + diff);
  currentWeekStart.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() + i * 7);
    
    const week: Date[] = [];
    for (let j = 0; j < 7; j++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + j);
      week.push(day);
    }
    weeks.push(week);
  }
  
  return weeks;
};

const getPreferredDaysNumbers = (preferredDays: string[]): number[] => {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  
  return preferredDays.map(day => dayMap[day] ?? 2).filter(num => num !== undefined);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatWeekRange = (week: Date[]): string => {
  const start = week[0];
  const end = week[6];
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const MonthlySchedule = forwardRef<MonthlyScheduleRef, MonthlyScheduleProps>(({
  projectId,
  hypothesisId,
  weeklyPublishCount,
  preferredDays,
  backlogItems,
  onScheduleItem,
  onBacklogUpdated,
}, ref) => {
  const { updateBacklogItem } = useSeoAgentBacklogStore();
  const { toast } = useToast();
  const weeks = useMemo(() => getWeeks(), []);
  const preferredDayNumbers = useMemo(() => getPreferredDaysNumbers(preferredDays), [preferredDays]);
  
  // Get scheduled items from backlog (include SCHEDULED, IN_PROGRESS, and COMPLETED)
  // IN_PROGRESS items are those that are being published
  // COMPLETED items are those that have been published (should stay visible in sprint)
  const scheduledBacklogItems = useMemo(() => {
    const filtered = backlogItems.filter(item => 
      item.status === BacklogStatus.SCHEDULED || 
      item.status === BacklogStatus.IN_PROGRESS ||
      item.status === BacklogStatus.COMPLETED
    );
    console.log("📅 [SPRINT_FILTER] Фильтрация элементов для спринта:", {
      total: backlogItems.length,
      scheduled: backlogItems.filter(i => i.status === BacklogStatus.SCHEDULED).length,
      inProgress: backlogItems.filter(i => i.status === BacklogStatus.IN_PROGRESS).length,
      completed: backlogItems.filter(i => i.status === BacklogStatus.COMPLETED).length,
      filtered: filtered.length
    });
    return filtered;
  }, [backlogItems]);
  
  // Get pending items for selection
  const allPendingItems = useMemo(() =>
    backlogItems.filter(item => item.status === BacklogStatus.PENDING),
    [backlogItems]
  );

  // Track which items have content ready
  const [contentReadyItems, setContentReadyItems] = useState<Set<string>>(new Set());

  // Check which pending items have content ready
  useEffect(() => {
    const checkContentItems = async () => {
      const readySet = new Set<string>();
      for (const item of allPendingItems) {
        try {
          const { data } = await getContentItemByBacklogIdeaQuery(item.id);
          if (data?.contentItemByBacklogIdea) {
            readySet.add(item.id);
          }
        } catch (error) {
          // Ignore errors - content item might not exist
        }
      }
      setContentReadyItems(readySet);
    };
    checkContentItems();
  }, [allPendingItems]);

  // Filter pending items to show only those with content ready
  const pendingItems = useMemo(() =>
    allPendingItems.filter(item => contentReadyItems.has(item.id)),
    [allPendingItems, contentReadyItems]
  );
  
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [openDialog, setOpenDialog] = useState<{ weekIndex: number; slotIndex: number; item?: BacklogIdeaDto } | null>(null);
  const [openDateSelectionDialog, setOpenDateSelectionDialog] = useState<{ item: BacklogIdeaDto } | null>(null);
  const [postingItemId, setPostingItemId] = useState<string | null>(null);
  const [visibleWeeksCount, setVisibleWeeksCount] = useState<number>(1);

  // Debug: log when dialog state changes
  useEffect(() => {
    if (openDateSelectionDialog) {
      console.log("[MonthlySchedule] Date selection dialog opened:", {
        itemId: openDateSelectionDialog.item.id,
        itemTitle: openDateSelectionDialog.item.title
      });
    }
  }, [openDateSelectionDialog]);

  // Expose method to open schedule dialog from parent
  useImperativeHandle(ref, () => ({
    openScheduleDialog: (item: BacklogIdeaDto) => {
      console.log("[MonthlySchedule] openScheduleDialog called with item:", {
        id: item.id,
        title: item.title
      });
      // Open date selection dialog to let user choose from all available slots
      setOpenDateSelectionDialog({ item });
      console.log("[MonthlySchedule] Date selection dialog state set");
    },
  }));
  
  // Convert scheduled backlog items to ScheduledItem format
  useEffect(() => {
    const items: ScheduledItem[] = scheduledBacklogItems
      .map((item, index) => {
        let scheduledDate: Date;
        if (item.scheduledDate) {
          scheduledDate = new Date(item.scheduledDate);
        } else {
          // Assign to next available preferred day slot
          // Distribute items across weeks, starting from first week
          const weekIndex = Math.min(Math.floor(index / weeklyPublishCount), 3); // Max 4 weeks (0-3)
          const slotIndex = index % weeklyPublishCount;
          const week = weeks[weekIndex];
          const preferredDaysInWeek = getPreferredDaysInWeek(week);
          
          if (preferredDaysInWeek[slotIndex]) {
            scheduledDate = preferredDaysInWeek[slotIndex];
          } else {
            // Fallback: assign to first available preferred day in the first week
            const today = new Date();
            scheduledDate = findNextPreferredDay(today, preferredDayNumbers);
          }
        }
        
        return {
      id: item.id,
      title: item.title,
          date: scheduledDate,
      backlogItemId: item.id,
          contentType: item.contentType,
          description: item.description,
          status: item.status, // Include status to show visual difference
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    setScheduledItems(items);
  }, [scheduledBacklogItems, preferredDayNumbers, weeks, weeklyPublishCount, preferredDays]);

  const findNextPreferredDay = (fromDate: Date, preferredDays: number[]): Date => {
    const date = new Date(fromDate);
    date.setHours(0, 0, 0, 0);
    
    // Find next preferred day within next 28 days
    for (let i = 0; i < 28; i++) {
      if (preferredDays.includes(date.getDay())) {
        return date;
      }
      date.setDate(date.getDate() + 1);
    }
    
    // Fallback to tomorrow if no preferred day found
    const tomorrow = new Date(fromDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const getPreferredDaysInWeek = (week: Date[]): Date[] => {
    return week
      .filter(day => preferredDayNumbers.includes(day.getDay()))
      .slice(0, weeklyPublishCount)
      .sort((a, b) => a.getTime() - b.getTime());
  };

  const getScheduledItemForSlot = (week: Date[], slotDate: Date): ScheduledItem | undefined => {
    const item = scheduledItems.find(item => {
      const itemWeekStart = week[0].getTime();
      const itemWeekEnd = week[6].getTime() + 24 * 60 * 60 * 1000;
      const itemTime = item.date.getTime();
      const matches = itemTime >= itemWeekStart && itemTime < itemWeekEnd && isSameDay(item.date, slotDate);
      
      return matches;
    });
    
    
    return item;
  };

  const handlePostNow = async (item: ScheduledItem) => {
    if (postingItemId === item.id) return; // Prevent double-click
    
    console.log("🚀 [PUBLISH] ===== НАЧАЛО ПУБЛИКАЦИИ =====");
    console.log("🚀 [PUBLISH] Материал:", {
      itemId: item.id,
      backlogItemId: item.backlogItemId,
      title: item.title,
      currentStatus: item.status,
      scheduledDate: item.date.toISOString(),
      projectId,
      hypothesisId
    });
    
    setPostingItemId(item.id);
    try {

      // Get content item ID from backlog idea
      console.log("🚀 [PUBLISH] Шаг 1: Получение content item для backlog:", item.backlogItemId);
      const { data: contentData } = await getContentItemByBacklogIdeaQuery(item.backlogItemId);
      if (!contentData?.contentItemByBacklogIdea) {
        console.error("🚀 [PUBLISH] ❌ Content item не найден!");
        throw new Error("Content item not found. Please generate content first.");
      }

      const contentItemId = contentData.contentItemByBacklogIdea.id;
      console.log("🚀 [PUBLISH] ✅ Content item найден:", contentItemId);

      toast({
        title: "Publishing...",
        description: `Publishing "${item.title}" to WordPress`,
      });

      // Call actual publish API
      console.log("🚀 [PUBLISH] Шаг 2: Вызов API публикации в WordPress...");
      const { data: publishData, errors } = await publishToWordPressMutation({
        contentItemId,
        projectId,
        hypothesisId,
        status: "publish"
      });

      if (errors || !publishData?.publishToWordPress) {
        console.error("🚀 [PUBLISH] ❌ Ошибка API публикации:", errors);
        throw new Error(errors?.[0]?.message || "Failed to publish to WordPress");
      }

      const result = publishData.publishToWordPress;
      
      // CRITICAL: Check if WordPress confirmed publication
      if (!result.success) {
        console.error("🚀 [PUBLISH] ❌ Публикация не удалась:", result.error);
        throw new Error(result.error || "Publishing failed");
      }
      
      // CRITICAL: Verify we got explicit confirmation from WordPress
      if (!result.wordPressPostId || !result.wordPressPostUrl) {
        console.error("🚀 [PUBLISH] ❌ WordPress не вернул подтверждение публикации!");
        console.error("🚀 [PUBLISH] Ответ от WordPress:", result);
        throw new Error("WordPress did not confirm publication. Missing post ID or URL.");
      }

      console.log("🚀 [PUBLISH] ✅ WordPress подтвердил публикацию!", {
        wordPressPostId: result.wordPressPostId,
        wordPressPostUrl: result.wordPressPostUrl
      });

      // ONLY NOW update status - after explicit WordPress confirmation
      // Update status to IN_PROGRESS only after successful publication
      // Keep IN_PROGRESS status so item stays visible in sprint (not archived)
      console.log("🚀 [PUBLISH] Шаг 3: Обновление статуса на IN_PROGRESS (после подтверждения от WordPress)...");
      console.log("🚀 [PUBLISH] До обновления - статус был:", item.status);
      await updateBacklogItem(
        item.backlogItemId,
        item.title,
        item.description,
        item.contentType,
        BacklogStatus.IN_PROGRESS, // Keep in sprint after publishing
        item.clusterId,
        item.date.toISOString() // Keep scheduledDate so it stays in sprint
      );
      console.log("🚀 [PUBLISH] ✅ Статус обновлен на IN_PROGRESS (остается в спринте)");
      console.log("🚀 [PUBLISH] ===== ПУБЛИКАЦИЯ ЗАВЕРШЕНА УСПЕШНО =====");

      toast({
        title: "Success",
        description: result.wordPressPostUrl 
          ? `"${item.title}" published successfully! View: ${result.wordPressPostUrl}`
          : `"${item.title}" published successfully!`,
      });
    } catch (error: any) {
      console.error("🚀 [PUBLISH] ===== ОШИБКА ПУБЛИКАЦИИ =====");
      console.error("🚀 [PUBLISH] Ошибка:", error);
      console.error("🚀 [PUBLISH] Детали ошибки:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      console.error("🚀 [PUBLISH] Материал остается в спринте со статусом SCHEDULED");
      console.error("🚀 [PUBLISH] ===== КОНЕЦ ОШИБКИ =====");
      
      const errorMessage = error.message || "Failed to publish item";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // IMPORTANT: Don't change status back to PENDING on error
      // Keep it as SCHEDULED so user can retry
      // The item should remain in the schedule
    } finally {
      setPostingItemId(null);
    }
  };

  const handleRemoveFromPlan = async (itemId: string) => {
    console.log("🗑️ [REMOVE] ===== УДАЛЕНИЕ ИЗ СПРИНТА =====");
    console.log("🗑️ [REMOVE] Item ID:", itemId);
    
    try {
      const item = backlogItems.find(i => i.id === itemId);
      if (item) {
        console.log("🗑️ [REMOVE] Найден материал:", {
          id: item.id,
          title: item.title,
          currentStatus: item.status,
          scheduledDate: item.scheduledDate
        });
        
        // Allow removal even for published items - user can return them to backlog for revision
        if (item.status === BacklogStatus.IN_PROGRESS) {
          console.log("🗑️ [REMOVE] ⚠️ Удаление опубликованного материала (возврат в беклог на доработку)...");
        }
        
        console.log("🗑️ [REMOVE] Обновление статуса на PENDING (возврат в беклог)...");
        // Change status back to PENDING and clear scheduledDate
        // This will make the item appear in Backlog Ideas again
        await updateBacklogItem(
          item.id,
          item.title,
          item.description,
          item.contentType,
          BacklogStatus.PENDING,
          item.clusterId,
          null // Clear scheduledDate
        );
        console.log("🗑️ [REMOVE] ✅ Статус обновлен на PENDING - элемент вернется в Backlog Ideas");
        
        setScheduledItems(items => items.filter(i => i.id !== itemId));
        console.log("🗑️ [REMOVE] ✅ Удален из локального состояния спринта");
        
        // Refresh backlog to show the item in Backlog Ideas
        if (onBacklogUpdated) {
          console.log("🗑️ [REMOVE] Обновление беклога для отображения элемента...");
          await onBacklogUpdated();
          console.log("🗑️ [REMOVE] ✅ Беклог обновлен - элемент должен появиться в Backlog Ideas");
        }
        
        console.log("🗑️ [REMOVE] ===== УДАЛЕНИЕ ЗАВЕРШЕНО - ЭЛЕМЕНТ В БЕКЛОГЕ =====");
        
        toast({
          title: "Removed from plan",
          description: item.status === BacklogStatus.IN_PROGRESS 
            ? "Published item moved back to backlog for revision"
            : "Item moved back to backlog and will appear in Backlog Ideas",
        });
      } else {
        console.warn("🗑️ [REMOVE] ⚠️ Материал не найден в backlogItems!");
      }
    } catch (error: any) {
      console.error("🗑️ [REMOVE] ===== ОШИБКА УДАЛЕНИЯ =====");
      console.error("🗑️ [REMOVE] Ошибка:", error);
      console.error("🗑️ [REMOVE] ===== КОНЕЦ ОШИБКИ =====");
      
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleAddFromBacklog = async (
    weekIndex: number,
    slotIndex: number,
    backlogItem: BacklogIdeaDto,
    slotDate: Date
  ) => {
      console.log("➕ [ADD_TO_SPRINT] ===== ДОБАВЛЕНИЕ В СПРИНТ =====");
      console.log("➕ [ADD_TO_SPRINT] Материал:", {
        itemId: backlogItem.id,
        itemTitle: backlogItem.title,
        currentStatus: backlogItem.status,
        slotDate: slotDate.toISOString(),
        weekIndex,
        slotIndex
      });
      
      try {
        // Update backlog item status to SCHEDULED with scheduledDate
        console.log("➕ [ADD_TO_SPRINT] Шаг 1: Обновление статуса на SCHEDULED...");
        await updateBacklogItem(
          backlogItem.id,
          backlogItem.title,
          backlogItem.description,
          backlogItem.contentType,
          BacklogStatus.SCHEDULED,
          backlogItem.clusterId,
          slotDate.toISOString()
        );
        console.log("➕ [ADD_TO_SPRINT] ✅ Статус обновлен на SCHEDULED");
        
      // Add to local state with the scheduled date
        console.log("➕ [ADD_TO_SPRINT] Шаг 2: Добавление в локальное состояние спринта...");
        const newItem: ScheduledItem = {
          id: backlogItem.id,
          title: backlogItem.title,
        date: slotDate,
          backlogItemId: backlogItem.id,
        contentType: backlogItem.contentType,
        description: backlogItem.description,
        status: BacklogStatus.SCHEDULED, // New items are scheduled
        };
      setScheduledItems(items => [...items, newItem].sort((a, b) => a.date.getTime() - b.date.getTime()));
        console.log("➕ [ADD_TO_SPRINT] ✅ Добавлен в локальное состояние спринта");
        console.log("➕ [ADD_TO_SPRINT] ===== ДОБАВЛЕНИЕ ЗАВЕРШЕНО =====");
        
        toast({
        title: "Scheduled",
        description: `"${backlogItem.title}" scheduled for ${formatDate(slotDate)}`,
        });
      
      setOpenDialog(null);
      } catch (error: any) {
        console.error("➕ [ADD_TO_SPRINT] ===== ОШИБКА ДОБАВЛЕНИЯ =====");
        console.error("➕ [ADD_TO_SPRINT] Ошибка:", error);
        console.error("➕ [ADD_TO_SPRINT] Детали:", {
          message: error.message,
          stack: error.stack
        });
        console.error("➕ [ADD_TO_SPRINT] ===== КОНЕЦ ОШИБКИ =====");
        
        toast({
          title: "Error",
          description: error.message || "Failed to schedule item",
          variant: "destructive",
        });
    }
  };

  const visibleWeeks = useMemo(() => weeks.slice(0, visibleWeeksCount), [weeks, visibleWeeksCount]);
  const hasMoreWeeks = visibleWeeksCount < weeks.length;
  const nextWeek = hasMoreWeeks ? weeks[visibleWeeksCount] : null;

  return (
    <div className="space-y-2">
      {visibleWeeks.map((week, weekIndex) => {
        const preferredDaysInWeek = getPreferredDaysInWeek(week);

        return (
          <Card key={weekIndex} className="overflow-hidden">
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  <span className="font-semibold text-xs">
                    Week {weekIndex + 1}: {formatWeekRange(week)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Array.from({ length: weeklyPublishCount }).map((_, slotIndex) => {
                  const slotDate = preferredDaysInWeek[slotIndex];
                  const scheduledItem = slotDate ? getScheduledItemForSlot(week, slotDate) : undefined;
                  
                  return (
                    <div
                      key={slotIndex}
                      className={cn(
                        "border rounded-lg p-2 min-h-[80px] transition-all",
                        scheduledItem
                          ? scheduledItem.status === BacklogStatus.IN_PROGRESS
                            ? "bg-green-50 border-green-300" // Published or publishing
                            : "bg-blue-50 border-blue-200" // Scheduled
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {scheduledItem ? (
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <h4 className="font-medium text-xs truncate">{scheduledItem.title}</h4>
                                {scheduledItem.status === BacklogStatus.IN_PROGRESS && (
                                  <Badge variant="default" className="text-[9px] px-1.5 py-0.5 bg-green-600 text-white font-semibold shadow-sm">
                                    ✓ Published
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                  {scheduledItem.contentType}
                                </Badge>
                              </div>
                              {scheduledItem.description && (
                                <p className="text-[10px] text-gray-600 line-clamp-1 mb-1">
                                  {scheduledItem.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{formatDate(scheduledItem.date)}</span>
                              </div>
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePostNow(scheduledItem)}
                                disabled={postingItemId === scheduledItem.id}
                                className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700"
                                title="Publish now"
                              >
                                {postingItemId === scheduledItem.id ? (
                                  <Clock className="h-2.5 w-2.5 animate-spin" />
                                ) : (
                                <Play className="h-2.5 w-2.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromPlan(scheduledItem.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title={scheduledItem.status === BacklogStatus.IN_PROGRESS 
                                  ? "Remove from sprint and return to backlog for revision" 
                                  : "Remove from plan and return to backlog"}
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : slotDate ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs space-y-1.5 min-h-[80px]">
                          <div className="text-center">
                            <div className="text-[10px] font-medium text-gray-500 mb-0.5">
                              {formatDate(slotDate)}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Available slot
                            </div>
                          </div>
                              <Dialog 
                                open={openDialog?.weekIndex === weekIndex && openDialog?.slotIndex === slotIndex}
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setOpenDialog(null);
                                  }
                                  // Don't auto-add item - let user choose the date
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenDialog({ weekIndex, slotIndex })}
                                className="h-6 text-[10px] px-2"
                                    disabled={pendingItems.length === 0}
                                  >
                                    <Plus className="h-2.5 w-2.5 mr-0.5" />
                                    Add Item
                                  </Button>
                                </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                                  <DialogHeader>
                                <DialogTitle>Schedule Content</DialogTitle>
                                    <DialogDescription>
                                  Choose an item to schedule for {formatDate(slotDate)}
                                    </DialogDescription>
                                  </DialogHeader>
                              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                    {pendingItems.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm">No content-ready items available</p>
                                    <p className="text-xs mt-2">Only items with generated content can be scheduled. Generate content in the Backlog tab first.</p>
                                  </div>
                                    ) : (
                                      pendingItems.map((item) => (
                                    <Card 
                                      key={item.id} 
                                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                          <CardContent
                                            className="p-3"
                                            onClick={async () => {
                                          await handleAddFromBacklog(weekIndex, slotIndex, item, slotDate);
                                            }}
                                          >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                                            {item.description && (
                                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                                {item.description}
                                              </p>
                                            )}
                                            <div className="flex gap-2">
                                              <Badge variant="secondary" className="text-xs">
                                                {item.contentType}
                                              </Badge>
                                              {item.clusterId && (
                                                <Badge variant="outline" className="text-xs">
                                                  From Cluster
                                                </Badge>
                                              )}
                                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                                Content Ready
                                              </Badge>
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-shrink-0"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                        </div>
                          ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-[10px] min-h-[80px]">
                          No slot available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {hasMoreWeeks && nextWeek && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleWeeksCount(prev => prev + 1)}
            className="h-7 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1.5" />
            Show next date: {formatWeekRange(nextWeek)}
          </Button>
        </div>
      )}

      {/* Date Selection Dialog - for choosing date when approving content */}
      <Dialog 
        open={!!openDateSelectionDialog}
        onOpenChange={(open) => {
          console.log("[MonthlySchedule] Date selection dialog onOpenChange:", open);
          if (!open) {
            setOpenDateSelectionDialog(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Date for Scheduling</DialogTitle>
            <DialogDescription>
              {openDateSelectionDialog?.item 
                ? `Choose an available date to schedule "${openDateSelectionDialog.item.title}"`
                : "Choose an available date to schedule content"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {(() => {
              const dialogItem = openDateSelectionDialog?.item;
              console.log("[MonthlySchedule] Rendering date selection dialog", {
                hasItem: !!dialogItem,
                itemId: dialogItem?.id,
                itemTitle: dialogItem?.title,
                pendingItemsCount: pendingItems.length,
                scheduledItemsCount: scheduledItems.length,
                openDateSelectionDialog: openDateSelectionDialog
              });

              // Get all available slots across all weeks
              const availableSlots: Array<{ weekIndex: number; slotIndex: number; date: Date }> = [];
              const preferredDayNumbers = getPreferredDaysNumbers(preferredDays);
              
              for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
                const week = weeks[weekIndex];
                const preferredDaysInWeek = getPreferredDaysInWeek(week);
                
                for (let slotIndex = 0; slotIndex < Math.min(weeklyPublishCount, preferredDaysInWeek.length); slotIndex++) {
                  const slotDate = preferredDaysInWeek[slotIndex];
                  const existingItem = scheduledItems.find(item => 
                    isSameDay(item.date, slotDate)
                  );
                  
                  if (!existingItem && slotDate) {
                    availableSlots.push({ weekIndex, slotIndex, date: slotDate });
                  }
                }
              }
              
              console.log("[MonthlySchedule] Available slots found:", availableSlots.length);
              
              if (availableSlots.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No available slots</p>
                    <p className="text-xs mt-2">All schedule slots are filled. Please remove an item first.</p>
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSlots.map((slot, index) => {
                    const week = weeks[slot.weekIndex];
                    return (
                      <Card
                        key={index}
                        className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={async () => {
                          const dialogItem = openDateSelectionDialog?.item;
                          if (dialogItem) {
                            console.log("[MonthlySchedule] Date selected, scheduling item:", {
                              itemId: dialogItem.id,
                              itemTitle: dialogItem.title,
                              slotDate: slot.date.toISOString(),
                              weekIndex: slot.weekIndex,
                              slotIndex: slot.slotIndex
                            });
                            // Use the item directly from dialog, don't require it to be in pendingItems
                            await handleAddFromBacklog(slot.weekIndex, slot.slotIndex, dialogItem, slot.date);
                            setOpenDateSelectionDialog(null);
                          } else {
                            console.error("[MonthlySchedule] No item in dialog when date selected!");
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm mb-1">
                                {formatDate(slot.date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Week {slot.weekIndex + 1}: {formatWeekRange(week)}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
