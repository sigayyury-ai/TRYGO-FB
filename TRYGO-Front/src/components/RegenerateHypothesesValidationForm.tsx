import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
import { useValidationStore } from "@/store/useValidationStore";
import { useActiveHypothesisId } from "@/hooks/useActiveIds";
import { useUserStore } from "@/store/useUserStore";
import { useToast } from "@/hooks/use-toast";
import { checkRegeneratePermission } from "@/utils/checkRegeneratePermission";

const RegenerateHypothesesValidationForm: FC = () => {
  const [promptPart, setPromptPart] = useState(`You are an AI assistant for validating business hypotheses.
Your role is to help the founder run Customer Development: formulate interview questions, collect feedback from the target audience, and extract insights.     

Your tasks:

1. **Customer Interview Plan (customerInterviewQuestions):**  
Create a list of questions that:  
• Do not suggest a solution (no leading questions)  
• Help uncover real experiences, behaviors, and pains  
• Check for the existence of the problem, its frequency, importance, and current solutions  

**Structure for customer interview questions:**  
• Icebreaker (what the person does)  
• Experience history (when they last faced the problem)  
• Pains and frustrations  
• What they already tried and what didn't work  
• How important / priority the problem is  
• Willingness to pay / try a new solution  

2. **JTBD Interview Plan (jtbdInterviewQuestions):**  
Additionally, create a separate list of **JTBD interview questions** that help uncover:  
• The job the person is trying to get done  
• Situations / context where the need arises  
• Desired outcomes / goals  
• Current alternatives and how they solve the problem  
• What frustrates them about existing solutions  
• What success would look like for them  

3. **Finding Respondents (validationChannels):**  
Recommend suitable channels for gathering feedback based on the ICP, such as:  
• Reddit, Facebook groups, Telegram chats, Product Hunt, Indie Hackers, niche forums  
• Subreddits (e.g., /r/freelance for freelancers)  
• Interview recruitment platforms (Respondent, Askable, LinkedIn)`);
  const [isLoading, setIsLoading] = useState(false);

  const { regenerateHypothesesValidation } = useValidationStore();
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
      await regenerateHypothesesValidation({
        projectHypothesisId: activeHypothesisId,
        promptPart: promptPart.trim() || null,
      });

      toast({
        title: "Success",
        description: "Validation hypotheses regenerated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate validation hypotheses",
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
        Regenerate Validation Hypotheses
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

export default RegenerateHypothesesValidationForm;
