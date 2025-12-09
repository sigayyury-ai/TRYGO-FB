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

interface MonthlyScheduleProps {
  projectId: string;
  hypothesisId?: string;
  weeklyPublishCount: number;
  preferredDays: string[];
  backlogItems: BacklogIdeaDto[];
  onScheduleItem?: (item: BacklogIdeaDto) => void;
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
}, ref) => {
  const { updateBacklogItem } = useSeoAgentBacklogStore();
  const { toast } = useToast();
  const weeks = useMemo(() => getWeeks(), []);
  const preferredDayNumbers = useMemo(() => getPreferredDaysNumbers(preferredDays), [preferredDays]);
  
  // Get scheduled items from backlog
  const scheduledBacklogItems = useMemo(() => 
    backlogItems.filter(item => item.status === BacklogStatus.SCHEDULED),
    [backlogItems]
  );
  
  // Get pending items for selection
  const pendingItems = useMemo(() =>
    backlogItems.filter(item => item.status === BacklogStatus.PENDING),
    [backlogItems]
  );
  
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [openDialog, setOpenDialog] = useState<{ weekIndex: number; slotIndex: number; item?: BacklogIdeaDto } | null>(null);
  const [postingItemId, setPostingItemId] = useState<string | null>(null);

  // Expose method to open schedule dialog from parent
  useImperativeHandle(ref, () => ({
    openScheduleDialog: (item: BacklogIdeaDto) => {
      // Find first available slot
      const weeks = getWeeks();
      const preferredDayNumbers = getPreferredDaysNumbers(preferredDays);
      
      for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
        const week = weeks[weekIndex];
        const preferredDaysInWeek = week.filter(day => 
          preferredDayNumbers.includes(day.getDay())
        );
        
        for (let slotIndex = 0; slotIndex < Math.min(weeklyPublishCount, preferredDaysInWeek.length); slotIndex++) {
          const slotDate = preferredDaysInWeek[slotIndex];
          const existingItem = scheduledItems.find(item => 
            isSameDay(item.date, slotDate)
          );
          
          if (!existingItem && slotDate) {
            // Open dialog for this slot with the item pre-selected
            setOpenDialog({ weekIndex, slotIndex, item });
            return;
          }
        }
      }
      
      // If no slot found, show message
      toast({
        title: "No available slots",
        description: "All schedule slots are filled. Please remove an item first.",
        variant: "destructive",
      });
    },
  }));
  
  // Convert scheduled backlog items to ScheduledItem format
  useEffect(() => {
    console.log('[MonthlySchedule] Scheduled backlog items:', scheduledBacklogItems.length);
    console.log('[MonthlySchedule] Scheduled backlog items data:', scheduledBacklogItems);
    console.log('[MonthlySchedule] Weeks:', weeks.map(w => ({ start: w[0].toISOString(), end: w[6].toISOString() })));
    console.log('[MonthlySchedule] Preferred days:', preferredDays);
    console.log('[MonthlySchedule] Weekly publish count:', weeklyPublishCount);
    
    const items: ScheduledItem[] = scheduledBacklogItems
      .map((item, index) => {
        let scheduledDate: Date;
        if (item.scheduledDate) {
          scheduledDate = new Date(item.scheduledDate);
          console.log(`[MonthlySchedule] Item ${item.title} has explicit scheduledDate:`, scheduledDate.toISOString());
        } else {
          // Assign to next available preferred day slot
          // Distribute items across weeks, starting from first week
          const weekIndex = Math.min(Math.floor(index / weeklyPublishCount), 3); // Max 4 weeks (0-3)
          const slotIndex = index % weeklyPublishCount;
          const week = weeks[weekIndex];
          const preferredDaysInWeek = getPreferredDaysInWeek(week);
          
          console.log(`[MonthlySchedule] Item ${item.title} - weekIndex: ${weekIndex}, slotIndex: ${slotIndex}, preferredDaysInWeek:`, preferredDaysInWeek.map(d => d.toISOString()));
          
          if (preferredDaysInWeek[slotIndex]) {
            scheduledDate = preferredDaysInWeek[slotIndex];
          } else {
            // Fallback: assign to first available preferred day in the first week
            const today = new Date();
            scheduledDate = findNextPreferredDay(today, preferredDayNumbers);
            console.log(`[MonthlySchedule] Item ${item.title} - using fallback date:`, scheduledDate.toISOString());
          }
        }
        
        console.log(`[MonthlySchedule] Item ${item.title} final scheduled date:`, scheduledDate.toISOString());
        
        return {
          id: item.id,
          title: item.title,
          date: scheduledDate,
          backlogItemId: item.id,
          contentType: item.contentType,
          description: item.description,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    console.log('[MonthlySchedule] Converted scheduled items:', items.length);
    items.forEach(item => {
      console.log(`  - ${item.title}: ${item.date.toISOString()}`);
    });
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
      
      if (matches) {
        console.log('[MonthlySchedule] Found item for slot:', {
          slotDate: slotDate.toISOString(),
          itemDate: item.date.toISOString(),
          itemTitle: item.title,
          weekStart: new Date(itemWeekStart).toISOString(),
          weekEnd: new Date(itemWeekEnd).toISOString(),
        });
      }
      
      return matches;
    });
    
    if (!item && scheduledItems.length > 0) {
      console.log('[MonthlySchedule] No item found for slot:', {
        slotDate: slotDate.toISOString(),
        weekStart: week[0].toISOString(),
        weekEnd: week[6].toISOString(),
        scheduledItems: scheduledItems.map(i => ({ title: i.title, date: i.date.toISOString() })),
      });
    }
    
    return item;
  };

  const handlePostNow = async (item: ScheduledItem) => {
    if (postingItemId === item.id) return; // Prevent double-click
    
    setPostingItemId(item.id);
    try {
      // TODO: Implement actual post now action via API
      // For now, we'll just show a toast
      toast({
        title: "Publishing...",
        description: `Publishing "${item.title}" now`,
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update status to IN_PROGRESS
      // Note: scheduledDate is not sent to backend yet (not supported)
      await updateBacklogItem(
        item.backlogItemId,
        item.title,
        item.description,
        item.contentType,
        BacklogStatus.IN_PROGRESS,
        undefined
        // TODO: Add scheduledDate when backend supports it
        // item.date.toISOString()
      );
      
      toast({
        title: "Success",
        description: `"${item.title}" is being published`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish item",
        variant: "destructive",
      });
    } finally {
      setPostingItemId(null);
    }
  };

  const handleRemoveFromPlan = async (itemId: string) => {
    try {
      const item = backlogItems.find(i => i.id === itemId);
      if (item) {
        // Change status back to PENDING
        // Note: scheduledDate is not sent to backend yet (not supported)
        await updateBacklogItem(
          item.id,
          item.title,
          item.description,
          item.contentType,
          BacklogStatus.PENDING,
          item.clusterId
          // TODO: Add scheduledDate when backend supports it
          // undefined // Clear scheduledDate
        );
        setScheduledItems(items => items.filter(i => i.id !== itemId));
        toast({
          title: "Removed from plan",
          description: "Item moved back to backlog",
        });
      }
    } catch (error) {
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
    try {
      // Update backlog item status to SCHEDULED
      // Note: scheduledDate is not sent to backend yet (not supported)
      // We store it locally in the component state
      await updateBacklogItem(
        backlogItem.id,
        backlogItem.title,
        backlogItem.description,
        backlogItem.contentType,
        BacklogStatus.SCHEDULED,
        backlogItem.clusterId
        // TODO: Add scheduledDate when backend supports it
        // slotDate.toISOString()
      );
      
      // Add to local state with the scheduled date
      const newItem: ScheduledItem = {
        id: backlogItem.id,
        title: backlogItem.title,
        date: slotDate,
        backlogItemId: backlogItem.id,
        contentType: backlogItem.contentType,
        description: backlogItem.description,
      };
      setScheduledItems(items => [...items, newItem].sort((a, b) => a.date.getTime() - b.date.getTime()));
      
      toast({
        title: "Scheduled",
        description: `"${backlogItem.title}" scheduled for ${formatDate(slotDate)}`,
      });
      
      setOpenDialog(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule item",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {weeks.map((week, weekIndex) => {
        const preferredDaysInWeek = getPreferredDaysInWeek(week);
        
        return (
          <Card key={weekIndex} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-sm">
                    Week {weekIndex + 1}: {formatWeekRange(week)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: weeklyPublishCount }).map((_, slotIndex) => {
                  const slotDate = preferredDaysInWeek[slotIndex];
                  const scheduledItem = slotDate ? getScheduledItemForSlot(week, slotDate) : undefined;
                  
                  return (
                    <div
                      key={slotIndex}
                      className={cn(
                        "border rounded-lg p-4 min-h-[120px] transition-all",
                        scheduledItem
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {scheduledItem ? (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{scheduledItem.title}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {scheduledItem.contentType}
                                </Badge>
                              </div>
                              {scheduledItem.description && (
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                  {scheduledItem.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(scheduledItem.date)}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePostNow(scheduledItem)}
                                disabled={postingItemId === scheduledItem.id}
                                className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-700"
                                title="Publish now"
                              >
                                {postingItemId === scheduledItem.id ? (
                                  <Clock className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromPlan(scheduledItem.id)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Remove from plan"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : slotDate ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm space-y-3 min-h-[120px]">
                          <div className="text-center">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              {formatDate(slotDate)}
                            </div>
                            <div className="text-xs text-gray-400">
                              Available slot
                            </div>
                          </div>
                          <Dialog 
                            open={openDialog?.weekIndex === weekIndex && openDialog?.slotIndex === slotIndex}
                            onOpenChange={(open) => {
                              if (!open) {
                                setOpenDialog(null);
                              } else if (openDialog?.item && open) {
                                // Auto-select pre-selected item when dialog opens
                                const preSelectedItem = openDialog.item;
                                const itemInList = pendingItems.find(i => i.id === preSelectedItem.id);
                                if (itemInList && slotDate) {
                                  handleAddFromBacklog(weekIndex, slotIndex, itemInList, slotDate);
                                  setOpenDialog(null);
                                }
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenDialog({ weekIndex, slotIndex })}
                                className="h-8 text-xs"
                                disabled={pendingItems.length === 0}
                              >
                                <Plus className="h-3 w-3 mr-1" />
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
                                    <p className="text-sm">No pending items available</p>
                                    <p className="text-xs mt-2">Add items from the Semantics or Content tabs</p>
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
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs min-h-[120px]">
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
      
      <div className="text-xs text-gray-500 mt-4 space-y-1 bg-gray-50 p-3 rounded-lg">
        <p>• {weeklyPublishCount} publish slot{weeklyPublishCount !== 1 ? "s" : ""} per week ({preferredDays.join(" & ")}) with supporting social content.</p>
        <p>• Deliverables sync to the TRYGO calendar so owners receive reminders automatically.</p>
        <p>• Switch tabs for semantic clustering, content drafts, and performance analytics once available.</p>
      </div>
    </div>
  );
});
