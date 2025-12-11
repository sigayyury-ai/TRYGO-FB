import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { useGtmStore } from "@/store/useGtmStore";
import { useActiveHypothesisId } from "@/hooks/useActiveIds";
import { useUserStore } from "@/store/useUserStore";
import { useToast } from "@/hooks/use-toast";
import { checkRegeneratePermission } from "@/utils/checkRegeneratePermission";

const RegenerateHypothesesGtmForm: FC = () => {
  const [promptPart, setPromptPart] = useState(`You are an expert in go to market strategy.  
Create Gtm based on the info that you know about project and hypothesis.
For each stage (stageValidate, stageBuildAudience, stageScale), create 3 channels.`);
  const [isLoading, setIsLoading] = useState(false);

  const { regenerateHypothesesGtm } = useGtmStore();
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
      await regenerateHypothesesGtm({
        projectHypothesisId: activeHypothesisId,
        promptPart: promptPart.trim() || null,
      });

      toast({
        title: "Success",
        description: "GTM hypotheses regenerated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate GTM hypotheses",
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
        Regenerate GTM Hypotheses
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
            rows={4}
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

export default RegenerateHypothesesGtmForm;
