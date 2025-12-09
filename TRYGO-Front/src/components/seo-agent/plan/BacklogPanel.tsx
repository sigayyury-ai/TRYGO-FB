import { useState, useMemo, useEffect, useRef } from "react";
import { BacklogIdeaDto, BacklogStatus, BacklogContentType } from "@/api/getSeoAgentBacklog";
import { Button } from "@/components/ui/button";
import { Plus, X, Edit2, Save, Search, Filter, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateContentForBacklogIdeaMutation } from "@/api/generateContentForBacklogIdea";
import { getContentItemByBacklogIdeaQuery } from "@/api/getContentItemByBacklogIdea";
import { ContentEditor } from "./ContentEditor";
import { updateSeoAgentBacklogItemMutation } from "@/api/updateSeoAgentBacklogItem";
import { deleteSeoAgentBacklogItemMutation } from "@/api/deleteSeoAgentBacklogItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BacklogPanelProps {
  projectId: string;
  hypothesisId?: string;
  backlogItems: BacklogIdeaDto[];
  onScheduleItem?: (item: BacklogIdeaDto) => void;
  onBacklogUpdated?: () => void;
}

interface ContentItem {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  outline?: string;
  status: string;
}

type SortOption = "newest" | "oldest" | "title";
type FilterOption = "all" | BacklogContentType;

export const BacklogPanel = ({ projectId, hypothesisId, backlogItems, onScheduleItem, onBacklogUpdated }: BacklogPanelProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [contentItemsMap, setContentItemsMap] = useState<Map<string, ContentItem>>(new Map());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState<{ item: BacklogIdeaDto } | null>(null);
  const scrollPositionRef = useRef<number | null>(null);

  // Check for existing content items on mount and when backlog items change
  useEffect(() => {
    const checkContentItems = async () => {
      const map = new Map<string, ContentItem>();
      for (const item of backlogItems.filter(i => i.status === BacklogStatus.PENDING)) {
        try {
          const { data } = await getContentItemByBacklogIdeaQuery(item.id);
          if (data?.contentItemByBacklogIdea) {
            map.set(item.id, {
              id: data.contentItemByBacklogIdea.id,
              title: data.contentItemByBacklogIdea.title,
              content: data.contentItemByBacklogIdea.content,
              imageUrl: data.contentItemByBacklogIdea.imageUrl,
              outline: data.contentItemByBacklogIdea.outline,
              status: data.contentItemByBacklogIdea.status,
            });
          }
        } catch (error) {
          // Ignore errors - content item might not exist
        }
      }
      setContentItemsMap(map);
    };
    checkContentItems();
  }, [backlogItems]);

  const displayedItems = useMemo(() => {
    let items = backlogItems.filter(item => item.status === BacklogStatus.PENDING);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply content type filter
    if (filterBy !== "all") {
      items = items.filter(item => item.contentType === filterBy);
    }
    
    // Apply sorting
    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return items;
  }, [backlogItems, searchQuery, sortBy, filterBy]);

  const handleEdit = (item: BacklogIdeaDto) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
  };

  const handleSave = async (item: BacklogIdeaDto) => {
    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "Title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateSeoAgentBacklogItemMutation(item.id, {
        title: editTitle,
        description: editDescription || undefined,
        contentType: item.contentType,
        status: item.status,
        clusterId: item.clusterId,
        scheduledDate: item.scheduledDate,
      });
      setEditingId(null);
      toast({
        title: "Success",
        description: "Backlog item updated",
      });
      // Reload backlog from API
      if (onBacklogUpdated) {
        onBacklogUpdated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleAddToPlan = (item: BacklogIdeaDto) => {
    // Call parent handler to open schedule dialog in MonthlySchedule
    if (onScheduleItem) {
      onScheduleItem(item);
    } else {
      // Fallback: show message
      toast({
        title: "Info",
        description: "Please select a date slot in the Monthly Schedule above to schedule this item",
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    // Save scroll position before deletion
    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;

    setLoading(true);
    try {
      await deleteSeoAgentBacklogItemMutation(itemId);
      
      toast({
        title: "Success",
        description: "Backlog item deleted",
      });
      // Reload backlog from API
      if (onBacklogUpdated) {
        onBacklogUpdated();
      }
    } catch (error) {
      scrollPositionRef.current = null; // Clear on error
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore scroll position after backlog items update
  useEffect(() => {
    if (scrollPositionRef.current !== null) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPositionRef.current!,
          behavior: 'instant'
        });
        scrollPositionRef.current = null; // Clear after restoring
      });
    }
  }, [backlogItems]);

  const handleGenerateContent = async (item: BacklogIdeaDto) => {
    console.log("[BacklogPanel] Starting content generation:", {
      backlogIdeaId: item.id,
      projectId,
      hypothesisId,
      itemTitle: item.title
    });
    
    setGeneratingId(item.id);
    try {
      const { data } = await generateContentForBacklogIdeaMutation({
        backlogIdeaId: item.id,
        projectId,
        hypothesisId,
      });
      
      console.log("[BacklogPanel] Content generation response:", data);

      if (data?.generateContentForBacklogIdea) {
        const contentItem = data.generateContentForBacklogIdea;
        const contentItemData: ContentItem = {
          id: contentItem.id,
          title: contentItem.title,
          content: contentItem.content || undefined,
          imageUrl: contentItem.imageUrl || undefined,
          outline: contentItem.outline || undefined,
          status: contentItem.status,
        };
        
        // Update content items map
        setContentItemsMap(prev => new Map(prev).set(item.id, contentItemData));
        
        // Open editor
        setEditingContent(contentItemData);
        toast({
          title: "Success",
          description: "Content generated and saved as draft",
        });
      }
    } catch (error: any) {
      console.error("[BacklogPanel] Content generation error:", error);
      console.error("[BacklogPanel] Error details:", {
        message: error.message,
        stack: error.stack,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleEditContent = (item: BacklogIdeaDto) => {
    const existingContent = contentItemsMap.get(item.id);
    if (existingContent) {
      setEditingContent(existingContent);
    } else {
      // If no content exists, generate it
      handleGenerateContent(item);
    }
  };

  if (displayedItems.length === 0 && backlogItems.filter(i => i.status === BacklogStatus.PENDING).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="mb-4">
          <Calendar className="h-12 w-12 mx-auto text-gray-300" />
        </div>
        <p className="text-sm font-medium mb-2">No backlog items yet</p>
        <p className="text-xs">Ideas from the Semantics tab will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search backlog items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={BacklogContentType.ARTICLE}>Articles</SelectItem>
              <SelectItem value={BacklogContentType.COMMERCIAL_PAGE}>Commercial</SelectItem>
              <SelectItem value={BacklogContentType.LANDING_PAGE}>Landing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">By Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      {displayedItems.length === 0 && backlogItems.filter(i => i.status === BacklogStatus.PENDING).length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No items match your search criteria
        </div>
      )}

      {/* Backlog Items */}
      <div className="space-y-3">
        {displayedItems.map((item) => (
          <Card 
            key={item.id} 
            className={cn(
              "transition-all",
              editingId === item.id && "ring-2 ring-blue-500"
            )}
          >
            <CardContent className="p-4">
              {editingId === item.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block text-gray-700">Title</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Item title"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block text-gray-700">Description</label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Item description"
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSave(item)}
                      disabled={loading}
                      className="h-8"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={loading}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.contentType}
                      </Badge>
                      {item.clusterId && (
                        <Badge variant="outline" className="text-xs">
                          From Cluster
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!contentItemsMap.has(item.id) ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleGenerateContent(item)}
                        className="h-8"
                        disabled={loading || generatingId === item.id}
                        title="Generate full content"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingId === item.id ? "Generating..." : "Generate"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContent(item)}
                        className="h-8"
                        disabled={loading}
                        title="Edit content"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit Content
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="h-8"
                      disabled={loading}
                      title="Edit item"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToPlan(item)}
                      className="h-8"
                      disabled={loading}
                      title="Schedule item"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={loading}
                      title="Delete item"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Info footer */}
      <div className="text-xs text-gray-500 mt-4 space-y-1 bg-gray-50 p-3 rounded-lg">
        <p>• Click "Generate" to create full article content and image for a backlog item.</p>
        <p>• Push backlog items into sprint slots when ready to schedule.</p>
        <p>• Editing a backlog entry updates the original cluster automatically.</p>
        <p>• {displayedItems.length} of {backlogItems.filter(i => i.status === BacklogStatus.PENDING).length} pending items shown</p>
      </div>

      {/* Content Editor Dialog */}
      {editingContent && (
        <ContentEditor
          contentItem={editingContent}
          projectId={projectId}
          hypothesisId={hypothesisId}
          onClose={() => {
            setEditingContent(null);
            // Refresh content items map after closing
            const checkContent = async () => {
              try {
                const { data } = await getContentItemByBacklogIdeaQuery(editingContent.id);
                if (data?.contentItemByBacklogIdea) {
                  setContentItemsMap(prev => {
                    const newMap = new Map(prev);
                    // Find backlog item ID by content item
                    const backlogItem = backlogItems.find(item => 
                      contentItemsMap.get(item.id)?.id === editingContent.id
                    );
                    if (backlogItem) {
                      newMap.set(backlogItem.id, {
                        id: data.contentItemByBacklogIdea.id,
                        title: data.contentItemByBacklogIdea.title,
                        content: data.contentItemByBacklogIdea.content,
                        imageUrl: data.contentItemByBacklogIdea.imageUrl,
                        outline: data.contentItemByBacklogIdea.outline,
                        status: data.contentItemByBacklogIdea.status,
                      });
                    }
                    return newMap;
                  });
                }
              } catch (error) {
                // Ignore errors
              }
            };
            checkContent();
          }}
          onApprove={() => {
            setEditingContent(null);
            toast({
              title: "Success",
              description: "Content approved and added to queue",
            });
          }}
        />
      )}
    </div>
  );
};
