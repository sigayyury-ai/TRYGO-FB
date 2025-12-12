import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ContentIdeasList } from "./content/ContentIdeasList";
import { CustomIdeaForm } from "./content/CustomIdeaForm";
import LoaderSpinner from "@/components/LoaderSpinner";
import { useToast } from "@/hooks/use-toast";
import { ContentIdeaDto, ContentCategory, ContentIdeaType, getSeoAgentContentIdeasQuery } from "@/api/getSeoAgentContentIdeas";
import { BacklogContentType } from "@/api/getSeoAgentBacklog";
import { generateContentIdeasMutation } from "@/api/generateContentIdeas";
import { addContentIdeaToBacklogMutation } from "@/api/addContentIdeaToBacklog";
import { dismissContentIdeaMutation } from "@/api/dismissContentIdea";
import { createCustomContentIdeaMutation, CreateCustomContentIdeaInput } from "@/api/createCustomContentIdea";

// Category labels matching ContentIdeasList
const categoryLabels: Record<ContentCategory, string> = {
  [ContentCategory.PAINS]: "Articles by pains",
  [ContentCategory.GOALS]: "Articles by goals",
  [ContentCategory.TRIGGERS]: "Articles by triggers",
  [ContentCategory.PRODUCT_FEATURES]: "Commercial pages: product features",
  [ContentCategory.BENEFITS]: "Commercial pages: benefits",
  [ContentCategory.FAQS]: "FAQ articles",
  [ContentCategory.INFORMATIONAL]: "Informational articles",
};

interface SeoContentPanelProps {
  projectId: string;
  hypothesisId: string; // Required, not optional
}

export const SeoContentPanel = ({ projectId, hypothesisId }: SeoContentPanelProps) => {
  const [contentIdeas, setContentIdeas] = useState<ContentIdeaDto[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState<ContentCategory | null>(null);

  // Load content ideas from API - обернуто в useCallback
  const loadContentIdeas = useCallback(async () => {
    if (!projectId) {
      return;
    }
    
    if (!hypothesisId) {
      setIdeasError("Please select a hypothesis first");
      setContentIdeas([]);
      return;
    }
    
    setIdeasLoading(true);
    setIdeasError(null);
    // Clear old ideas before loading new ones to prevent stale data
    setContentIdeas([]);
    try {
      const { data } = await getSeoAgentContentIdeasQuery(projectId, hypothesisId);
      
      const ideas = data?.seoAgentContentIdeas || [];
      
      setContentIdeas(ideas);
    } catch (error: unknown) {
      console.error("[SeoContentPanel] ❌ Error loading content ideas:", error);
      let errorMessage = "Failed to load content ideas";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("[SeoContentPanel] Error message:", errorMessage);
        console.error("[SeoContentPanel] Error stack:", error.stack);
      }
      setIdeasError(errorMessage);
    } finally {
      setIdeasLoading(false);
    }
  }, [projectId, hypothesisId]);

  useEffect(() => {
    if (projectId && hypothesisId) {
      loadContentIdeas();
    } else {
      // Очищаем данные, если нет projectId или hypothesisId
      setContentIdeas([]);
      setIdeasError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, hypothesisId]); // loadContentIdeas is stable (useCallback with deps), no need to include

  const handleAddToBacklog = async (idea: ContentIdeaDto) => {
    setActionLoading(true);
    try {
      await addContentIdeaToBacklogMutation({
        contentIdeaId: idea.id,
        title: idea.title,
        description: idea.description,
        contentType: idea.contentType as BacklogContentType,
        clusterId: idea.clusterId,
      });
      
      // Reload content ideas to update status
      await loadContentIdeas();
      
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
      await dismissContentIdeaMutation(idea.id);
      
      // Reload content ideas to remove dismissed item
      await loadContentIdeas();
      
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

  const handleGenerateAll = useCallback(async () => {
    if (!hypothesisId) {
      toast({
        title: "Error",
        description: "Hypothesis ID is required",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple simultaneous calls
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    try {
      await generateContentIdeasMutation({ projectId, hypothesisId });
      await loadContentIdeas();
      toast({
        title: "Success",
        description: "Content ideas generated successfully",
      });
    } catch (error) {
      console.error("[SeoContentPanel] Error generating all ideas:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content ideas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }, [projectId, hypothesisId, actionLoading, loadContentIdeas, toast]);

  const handleCreateCustomIdea = async (data: {
    title: string;
    description?: string;
    category: ContentCategory;
    contentType: ContentIdeaType;
  }) => {
    setActionLoading(true);
    try {
      const input: CreateCustomContentIdeaInput = {
        projectId,
        hypothesisId,
        ...data,
      };
      
      const { data: response } = await createCustomContentIdeaMutation({ input });
      
      if (response?.createCustomContentIdea) {
        // Reload content ideas to show new item
        await loadContentIdeas();
        
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

  // Memoize category generation handler to prevent function recreation on every render
  const handleGenerateForCategory = useCallback(async (category: ContentCategory) => {
    if (!hypothesisId) return;
    
    setGeneratingCategory(category);
    setActionLoading(true);
    try {
      await generateContentIdeasMutation({ projectId, hypothesisId, category });
      await loadContentIdeas();
      toast({
        title: "Success",
        description: `Ideas for ${categoryLabels[category]} generated successfully`,
      });
    } catch (error) {
      console.error("[SeoContentPanel] Error generating ideas:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content ideas";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setGeneratingCategory(null);
    }
  }, [projectId, hypothesisId, loadContentIdeas]);

  // Show all ideas (no filtering for now, matching prototype)
  const filteredIdeas = contentIdeas;
  
  // Removed excessive logging useEffect - was causing performance issues

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
      <div className="content-header flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Content Production</h3>
          <p className="text-sm text-gray-600">
            Auto-generated blog and commercial page ideas grouped by strategic intent. Move entries into backlog или публикацию одним кликом.
          </p>
        </div>
        {hypothesisId && (
          <button
            onClick={handleGenerateAll}
            disabled={actionLoading || ideasLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {actionLoading ? "Generating..." : "Generate Ideas"}
          </button>
        )}
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

      {/* Debug info */}
      {contentIdeas.length === 0 && !ideasLoading && !ideasError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ No ideas loaded. Check console for details.
          </p>
        </div>
      )}

      {/* Content Ideas List - Grouped by categories */}
      <ContentIdeasList
        ideas={filteredIdeas}
        onAddToBacklog={handleAddToBacklog}
        onDismiss={handleDismiss}
        onGenerateForCategory={hypothesisId ? handleGenerateForCategory : undefined}
        loading={actionLoading}
        generatingCategory={generatingCategory}
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
