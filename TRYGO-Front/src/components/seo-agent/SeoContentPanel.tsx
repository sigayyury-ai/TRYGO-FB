import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSeoAgentContentIdeasStore } from "@/store/useSeoAgentContentIdeasStore";
import { useSeoAgentBacklogStore } from "@/store/useSeoAgentBacklogStore";
import { ContentIdeasList } from "./content/ContentIdeasList";
import { CustomIdeaForm } from "./content/CustomIdeaForm";
import LoaderSpinner from "@/components/LoaderSpinner";
import { useToast } from "@/hooks/use-toast";
import { ContentIdeaDto, ContentCategory, ContentIdeaType } from "@/api/getSeoAgentContentIdeas";
import { BacklogContentType } from "@/api/getSeoAgentBacklog";

interface SeoContentPanelProps {
  projectId: string;
  hypothesisId?: string;
}

export const SeoContentPanel = ({ projectId, hypothesisId }: SeoContentPanelProps) => {
  const {
    contentIdeas,
    loading: ideasLoading,
    error: ideasError,
    getContentIdeas,
    addToBacklog,
    dismissIdea,
    createCustomIdea,
  } = useSeoAgentContentIdeasStore();
  
  const { getBacklog } = useSeoAgentBacklogStore();
  const { toast } = useToast();
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      console.log("SeoContentPanel: Loading content ideas for projectId:", projectId, "hypothesisId:", hypothesisId);
      getContentIdeas(projectId, hypothesisId);
    }
  }, [projectId, hypothesisId, getContentIdeas]);

  const handleAddToBacklog = async (idea: ContentIdeaDto) => {
    setActionLoading(true);
    try {
      // ContentIdeaType and BacklogContentType have the same enum values
      await addToBacklog(
        idea.id,
        idea.title,
        idea.description,
        idea.contentType as BacklogContentType,
        idea.clusterId
      );
      
      // Refresh backlog to show new item
      await getBacklog(projectId, hypothesisId);
      
      toast({
        title: "Success",
        description: `"${idea.title}" added to backlog`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add idea to backlog",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (idea: ContentIdeaDto) => {
    setActionLoading(true);
    try {
      await dismissIdea(idea.id);
      toast({
        title: "Dismissed",
        description: `"${idea.title}" has been dismissed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss idea",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCustomIdea = async (data: {
    title: string;
    description?: string;
    category: ContentCategory;
    contentType: ContentIdeaType;
  }) => {
    setActionLoading(true);
    try {
      const newIdea = await createCustomIdea({
        projectId,
        hypothesisId,
        ...data,
      });
      
      if (newIdea) {
        toast({
          title: "Success",
          description: "Custom content idea created",
        });
        setShowCustomForm(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom idea",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Show all ideas (no filtering for now, matching prototype)
  const filteredIdeas = contentIdeas;

  if (ideasLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
      {/* Header */}
      <div className="content-header">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Content Production</h3>
          <p className="text-sm text-gray-600">
            Auto-generated blog ideas grouped by strategic intent. Move entries into backlog or publish-ready queue в один клик.
          </p>
        </div>
      </div>

      {ideasError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800 font-medium">
              {ideasError}
            </p>
            {ideasError.includes("not available") && (
              <p className="text-xs text-yellow-600 mt-2">
                The SEO Agent backend API is being developed. The UI is ready and will work once the API is deployed.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Ideas List - Grouped by categories */}
      <ContentIdeasList
        ideas={filteredIdeas}
        onAddToBacklog={handleAddToBacklog}
        onDismiss={handleDismiss}
        loading={actionLoading}
      />

      {/* Custom Toggle Button */}
      <div 
        className="custom-toggle inline-flex items-center gap-2 cursor-pointer text-blue-600 text-sm hover:text-blue-700"
        onClick={() => setShowCustomForm(!showCustomForm)}
      >
        <span className="text-lg">＋</span>
        <span>Add custom piece</span>
      </div>

      {/* Custom Idea Form */}
      {showCustomForm && (
        <CustomIdeaForm
          projectId={projectId}
          hypothesisId={hypothesisId}
          onSubmit={handleCreateCustomIdea}
          onCancel={() => setShowCustomForm(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};
