import { useMemo } from "react";
import { ContentIdeaDto, ContentCategory } from "@/api/getSeoAgentContentIdeas";
import { ContentIdeaCard } from "./ContentIdeaCard";

interface ContentIdeasListProps {
  ideas: ContentIdeaDto[];
  onAddToBacklog: (idea: ContentIdeaDto) => void;
  onDismiss: (idea: ContentIdeaDto) => void;
  loading?: boolean;
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
  loading = false,
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

  const hasAnyIdeas = useMemo(() => {
    return Object.values(groupedIdeas).some(categoryIdeas => categoryIdeas.length > 0);
  }, [groupedIdeas]);

  if (!hasAnyIdeas) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm font-medium mb-2">No content ideas available</p>
        <p className="text-xs">Ideas will be generated based on your clusters and project context</p>
      </div>
    );
  }

  return (
    <div className="content-ideas flex flex-col gap-4">
      {categoryOrder.map((category) => {
        const categoryIdeas = groupedIdeas[category];
        if (categoryIdeas.length === 0) return null;

        return (
          <div
            key={category}
            className="idea-section rounded-xl border border-blue-100 bg-blue-50/30 p-4 flex flex-col gap-4"
            data-category={category}
          >
            {/* Section Header */}
            <div className="idea-header flex justify-between items-center gap-3 flex-wrap">
              <h4 className="text-base font-semibold text-gray-900 m-0">
                {categoryLabels[category]}
              </h4>
              <span className="text-sm text-gray-600">
                {categoryIdeas.length} {categoryIdeas.length === 1 ? "suggestion" : "suggestions"}
              </span>
            </div>

            {/* Ideas List */}
            <div className="idea-list flex flex-col gap-3">
              {categoryIdeas.map((idea) => (
                <ContentIdeaCard
                  key={idea.id}
                  idea={idea}
                  onAddToBacklog={onAddToBacklog}
                  onDismiss={onDismiss}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

