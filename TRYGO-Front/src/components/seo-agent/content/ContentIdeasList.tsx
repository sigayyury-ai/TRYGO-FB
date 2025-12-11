import { useMemo } from "react";
import { ContentIdeaDto, ContentCategory } from "@/api/getSeoAgentContentIdeas";
import { ContentIdeaCard } from "./ContentIdeaCard";

interface ContentIdeasListProps {
  ideas: ContentIdeaDto[];
  onAddToBacklog: (idea: ContentIdeaDto) => void;
  onDismiss: (idea: ContentIdeaDto) => void;
  onGenerateForCategory?: (category: ContentCategory) => void;
  loading?: boolean;
  generatingCategory?: ContentCategory | null;
}

// Category labels matching the prototype
const categoryLabels: Record<ContentCategory, string> = {
  [ContentCategory.PAINS]: "Articles by pains",
  [ContentCategory.GOALS]: "Articles by goals",
  [ContentCategory.TRIGGERS]: "Articles by triggers",
  [ContentCategory.PRODUCT_FEATURES]: "Commercial pages: product features",
  [ContentCategory.BENEFITS]: "Commercial pages: benefits",
  [ContentCategory.FAQS]: "FAQ articles",
  [ContentCategory.INFORMATIONAL]: "Informational articles",
};

// Category order matching the prototype
const categoryOrder: ContentCategory[] = [
  ContentCategory.PAINS,
  ContentCategory.GOALS,
  ContentCategory.TRIGGERS,
  ContentCategory.PRODUCT_FEATURES,
  ContentCategory.BENEFITS,
  ContentCategory.FAQS,
  ContentCategory.INFORMATIONAL,
];

export const ContentIdeasList = ({
  ideas,
  onAddToBacklog,
  onDismiss,
  onGenerateForCategory,
  loading = false,
  generatingCategory = null,
}: ContentIdeasListProps) => {
  const groupedIdeas = useMemo(() => {
    const grouped: Record<ContentCategory, ContentIdeaDto[]> = {
      [ContentCategory.PAINS]: [],
      [ContentCategory.GOALS]: [],
      [ContentCategory.TRIGGERS]: [],
      [ContentCategory.PRODUCT_FEATURES]: [],
      [ContentCategory.BENEFITS]: [],
      [ContentCategory.FAQS]: [],
      [ContentCategory.INFORMATIONAL]: [],
    };

    ideas.forEach((idea) => {
      if (idea.category && grouped[idea.category]) {
        grouped[idea.category].push(idea);
      }
    });

    return grouped;
  }, [ideas]);

  return (
    <div className="content-ideas flex flex-col gap-4">
      {categoryOrder.map((category) => {
        const categoryIdeas = groupedIdeas[category];
        const isGenerating = generatingCategory === category;

        return (
          <div
            key={category}
            className="idea-section rounded-[14px] border border-[#d7e4f1] bg-[#f8fbff] p-[18px] flex flex-col gap-4"
            data-category={category}
          >
            {/* Section Header */}
            <div className="idea-header flex justify-between items-center gap-3 flex-wrap">
              <h4 className="text-base font-semibold text-[#0b1f33] m-0">
                {categoryLabels[category]}
              </h4>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#576b82]">
                  {categoryIdeas.length} {categoryIdeas.length === 1 ? "suggestion" : "suggestions"}
                </span>
                {onGenerateForCategory && (
                  <button
                    onClick={() => onGenerateForCategory(category)}
                    disabled={isGenerating || loading}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                )}
              </div>
            </div>

            {/* Ideas List */}
            <div className="idea-list flex flex-col gap-3">
              {categoryIdeas.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No ideas yet. Click "Generate" to create ideas for this category.
                </div>
              ) : (
                categoryIdeas.map((idea) => (
                  <ContentIdeaCard
                    key={idea.id}
                    idea={idea}
                    onAddToBacklog={onAddToBacklog}
                    onDismiss={onDismiss}
                    loading={loading}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

