import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
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

  // Category chip color classes matching prototype exactly
  const categoryChipClass = {
    [ContentCategory.PAINS]: "bg-[#ffecec] text-[#b43838]",
    [ContentCategory.GOALS]: "bg-[#e9f7ef] text-[#1b7d4a]",
    [ContentCategory.TRIGGERS]: "bg-[#fff3df] text-[#a56205]",
    [ContentCategory.PRODUCT_FEATURES]: "bg-[#eef3ff] text-[#1f3d7a]",
    [ContentCategory.BENEFITS]: "bg-[#eef3ff] text-[#1f3d7a]",
    [ContentCategory.FAQS]: "bg-[#f1f5fb] text-[#3c4f6c]",
    [ContentCategory.INFORMATIONAL]: "bg-[#f1f5fb] text-[#3c4f6c]",
  }[idea.category] || "bg-[#f1f5fb] text-[#3c4f6c]";

  return (
    <div
      className={cn(
        "idea-card bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(14,35,64,0.05)] border border-gray-100",
        "flex flex-col gap-[10px] relative transition-all",
        isAdded && "bg-green-50 border-green-200"
      )}
      data-category={idea.category}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="idea-title text-[15px] font-semibold text-[#0b1f33] mb-1">
            {idea.title}
          </div>
          {idea.description && (
            <div className="idea-desc text-[13px] text-[#465b73] mb-2">
              {idea.description}
            </div>
          )}
          <div className="idea-tags flex gap-2 flex-wrap text-[11px] uppercase tracking-[0.08em]">
            <span className="format-chip px-[10px] py-[6px] rounded-full bg-[#eef3ff] text-[#1f3d7a]">
              {formatLabel}
            </span>
            <span className={cn("category-chip px-[10px] py-[6px] rounded-full", categoryChipClass)}>
              {categoryLabels[idea.category] || idea.category}
            </span>
          </div>
        </div>
        <div className="idea-actions flex gap-2 items-center flex-shrink-0">
          {!isAdded && (
            <button
              onClick={() => onAddToBacklog(idea)}
              disabled={loading}
              className="icon-button publish h-[30px] w-[30px] rounded-lg border border-[#d2deeb] bg-[rgba(255,255,255,0.92)] text-[#355b85] hover:bg-[#0b59ff] hover:border-[#0b59ff] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[13px] transition-all duration-150"
              title="Add to backlog"
            >
              ↗
            </button>
          )}
          {isAdded && (
            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Added
            </Badge>
          )}
          {!isAdded && (
            <button
              onClick={() => onDismiss(idea)}
              disabled={loading}
              className="icon-button delete h-[30px] w-[30px] rounded-lg border border-[#d2deeb] bg-[rgba(255,255,255,0.92)] text-[#b13434] hover:bg-[#f55e5e] hover:border-[#f55e5e] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[13px] transition-all duration-150"
              title="Dismiss idea"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

