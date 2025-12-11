import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { useResearchStore } from "@/store/useResearchStore";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { useUserStore } from "@/store/useUserStore";
import { useToast } from "@/hooks/use-toast";
import { checkRegeneratePermission } from "@/utils/checkRegeneratePermission";

const RegenerateResearchForm: FC = () => {
  const [promptPart, setPromptPart] = useState(`You are an expert in competitive analysis and product packaging.

Step 1. Find and analyze the top 5–7 competitors operating in a similar niche and with a similar business model. For each competitor, gather:

Competitors – company name and website.  
Competitors Lead Magnets – free offers to attract clients (e.g., free trial, checklist, webinar).  
Competitors CTA – main calls-to-action (button texts, lead form copy).  
Competitors Offers – main offers (core value proposition, pricing, unique features).  
Negative Competitor Review Clients – recurring negative client reviews (at least 3–5).  
Positive Reviews – recurring positive client reviews (at least 3–5).  
Channels – promotion channels (SEO, social media, advertising, email, etc.).  
Competitive Differentiation – how they stand out in the market.  

Step 2. Perform a SWOT analysis based on comparison with our product:

UVP — key unique value proposition.  
Solutions — what solutions we provide, and how they are better/worse than competitors.  
Unfair Advantages — unique advantages that competitors don't have.  

Identify:  
Strengths – our strengths relative to competitors.  
Weaknesses – our weaknesses relative to competitors.  
Opportunities – market opportunities we can use, including:  
• product improvements based on recurring competitor negative reviews;  
• unmet audience needs;  
• new trends or channels.  
Threats – threats to our product.  

Finally, form a Summary — a concise conclusion with key findings from the competitive analysis (5–7 sentences). 

Response must be in human-readable format.`);
  const [isLoading, setIsLoading] = useState(false);

  const { regenerateHypothesesMarketResearch } = useResearchStore();
  const { activeHypothesis } = useHypothesisStore();
  const { userData } = useUserStore();
  const { toast } = useToast();

  // Check if user has permission to see regenerate form
  if (!checkRegeneratePermission(userData?.email)) {
    return null;
  }

  const handleRegenerate = async () => {
    if (!activeHypothesis?.id) {
      toast({
        title: "Error",
        description: "No active hypothesis found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await regenerateHypothesesMarketResearch({
        projectHypothesisId: activeHypothesis.id,
        promptPart: promptPart.trim() || null,
      });

      toast({
        title: "Success",
        description: "Market research hypotheses regenerated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate market research hypotheses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-blue-200 rounded-lg p-4 mb-6 bg-blue-50">
      <h3 className="font-medium text-blue-800 mb-3 flex items-center">
        <RefreshCw className="h-4 w-4 mr-2" />
        Regenerate Market Research Hypotheses
      </h3>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="promptPart"
            className="block text-sm font-medium text-blue-700 mb-1"
          >
            Prompt
          </label>
          <Textarea
            id="promptPart"
            value={promptPart}
            onChange={(e) => setPromptPart(e.target.value)}
            className="border-blue-300 focus:border-blue-500"
            placeholder="Enter regeneration prompt..."
            rows={8}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegenerateResearchForm;
