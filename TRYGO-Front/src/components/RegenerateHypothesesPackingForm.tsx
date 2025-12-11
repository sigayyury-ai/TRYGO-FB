import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { usePackingStore } from "@/store/usePackingStore";
import { useActiveHypothesisId } from "@/hooks/useActiveIds";
import { useUserStore } from "@/store/useUserStore";
import { useToast } from "@/hooks/use-toast";
import { checkRegeneratePermission } from "@/utils/checkRegeneratePermission";

const RegenerateHypothesesPackingForm: FC = () => {
  const [promptPart, setPromptPart] = useState(`Create product packing based on the info that you know about project and hypothesis.  

The packing should be structured as follows:
1. Product Name & Slogan – clear product name and a short slogan.  
2. Short Description (Elevator Pitch / Value Proposition) – 2–3 sentences describing the core value.  
3. Key Benefits / Unique Features – list of main advantages and differentiators.  
4. Visual Style / Identity – description of how the product should look and feel.  
5. Tone of Voice – communication style guidelines.  
6. First Experience (Onboarding) – what happens during the first interaction.  
7. Social Proof – testimonials, statistics, or success cases.  
8. Gamification Features – elements of gamification that motivate users.  
9. Pricing / Plans – description of tariffs, trial, or payment logic.  
10. Communication – examples of marketing and in-app communication.`);
  const [isLoading, setIsLoading] = useState(false);

  const { regenerateHypothesesPacking } = usePackingStore();
  const activeHypothesisId = useActiveHypothesisId();
  const { userData } = useUserStore();
  const { toast } = useToast();

  // Check if user has permission to see regenerate form
  if (!checkRegeneratePermission(userData?.email)) {
    return null;
  }

  const handleRegenerate = async () => {
    if (!activeHypothesisId) {
      toast({
        title: "Error",
        description: "No active hypothesis found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await regenerateHypothesesPacking({
        projectHypothesisId: activeHypothesisId,
        promptPart: promptPart.trim() || null,
      });

      toast({
        title: "Success",
        description: "Packing hypotheses regenerated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate packing hypotheses",
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
        Regenerate Packing Hypotheses
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

export default RegenerateHypothesesPackingForm;
