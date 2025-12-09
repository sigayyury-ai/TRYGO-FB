import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { ContentIdeaDto, ContentIdeaStatus, ContentCategory } from "@/api/getSeoAgentContentIdeas";
import { cn } from "@/lib/utils";

const categoryLabels: Record<ContentCategory, string> = {
  [ContentCategory.PAINS]: "Article by pains",
  [ContentCategory.GOALS]: "Article by goals",
  [ContentCategory.TRIGGERS]: "Article by triggers",
  [ContentCategory.PRODUCT_FEATURES]: "Commercial page – feature",
  [ContentCategory.BENEFITS]: "Commercial page – benefit",
  [ContentCategory.FAQS]: "FAQ article",
  [ContentCategory.INFORMATIONAL]: "Informational article",
};

interface ContentIdeaCardProps {
  idea: ContentIdeaDto;
  onAddToBacklog: (idea: ContentIdeaDto) => void;
  onDismiss: (idea: ContentIdeaDto) => void;
  loading?: boolean;
}

export const ContentIdeaCard = ({
  idea,
  onAddToBacklog,
  onDismiss,
  loading = false,
}: ContentIdeaCardProps) => {
  const isAdded = idea.status === ContentIdeaStatus.ADDED_TO_BACKLOG;
  const isDismissed = idea.dismissed || idea.status === ContentIdeaStatus.DISMISSED;

  if (isDismissed) {
    return null;
  }

  // Determine format label based on contentType
  const formatLabel = idea.contentType === "ARTICLE" 
    ? "Blog article" 
    : idea.contentType === "COMMERCIAL_PAGE"
    ? "Commercial page"
    : "Landing page";

  // Category chip color classes matching prototype
  const categoryChipClass = {
    [ContentCategory.PAINS]: "bg-red-50 text-red-800",
    [ContentCategory.GOALS]: "bg-green-50 text-green-800",
    [ContentCategory.TRIGGERS]: "bg-yellow-50 text-yellow-800",
    [ContentCategory.PRODUCT_FEATURES]: "bg-blue-50 text-blue-800",
    [ContentCategory.BENEFITS]: "bg-blue-50 text-blue-800",
    [ContentCategory.FAQS]: "bg-gray-50 text-gray-800",
    [ContentCategory.INFORMATIONAL]: "bg-gray-50 text-gray-800",
  }[idea.category] || "bg-gray-50 text-gray-800";

  return (
    <div
      className={cn(
        "idea-card bg-white rounded-xl p-4 shadow-sm border border-gray-100",
        "flex flex-col gap-2 relative transition-all",
        isAdded && "bg-green-50 border-green-200"
      )}
      data-category={idea.category}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="idea-title text-[15px] font-semibold text-gray-900 mb-1">
            {idea.title}
          </div>
          {idea.description && (
            <div className="idea-desc text-[13px] text-gray-600 mb-2">
              {idea.description}
            </div>
          )}
          <div className="idea-tags flex gap-2 flex-wrap text-[11px] uppercase tracking-wide">
            <span className="format-chip px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-800">
              {formatLabel}
            </span>
            <span className={cn("category-chip px-2.5 py-1.5 rounded-full", categoryChipClass)}>
              {categoryLabels[idea.category] || idea.category}
            </span>
          </div>
        </div>
        <div className="idea-actions flex gap-2 items-center flex-shrink-0">
          {!isAdded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddToBacklog(idea)}
              disabled={loading}
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Add to backlog"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {isAdded && (
            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Added
            </Badge>
          )}
          {!isAdded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(idea)}
              disabled={loading}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
              title="Dismiss idea"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

