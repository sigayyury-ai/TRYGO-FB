import { FC, useState, useEffect } from "react";
import { Loader, Lock, Search, Users } from "lucide-react";
import { useResearchStore } from "@/store/useResearchStore";
import { useActiveHypothesisId } from "@/hooks/useActiveIds";
import { Button } from "@/components/ui/button";
import EditableText from "@/components/EditableText";
import LoaderSpinner from "@/components/LoaderSpinner";
import AIAssistantChat from "@/components/AIAssistantChat";
import RegenerateResearchForm from "@/components/RegenerateResearchForm";
import useSubscription from "@/hooks/use-subscription";
import UpgradeModal from "@/components/UpgradeModal";
import { useUserStore } from "@/store/useUserStore";

const Research: FC = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeatureAccess, currentPlan } = useSubscription();
  const hasResearchAccess = hasFeatureAccess('research');
  
  const activeHypothesisId = useActiveHypothesisId();

  const loading = useResearchStore((state) => state.loading);

  const hypothesesMarketResearchData = useResearchStore(
    (state) => state.hypothesesMarketResearchData
  );

  const getHypothesesMarketResearch = useResearchStore(
    (state) => state.getHypothesesMarketResearch
  );
  const createHypothesesMarketResearch = useResearchStore(
    (state) => state.createHypothesesMarketResearch
  );
  const changeHypothesesMarketResearch = useResearchStore(
    (state) => state.changeHypothesesMarketResearch
  );


  useEffect(() => {
    if (activeHypothesisId) {
      getHypothesesMarketResearch(activeHypothesisId);
    }
  }, [activeHypothesisId, getHypothesesMarketResearch]);

  return (
    <div className="min-h-screen bg-validation-gradient bg-grid-pattern flex flex-col">
      {loading ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader className="w-16 h-16 text-blue-600 animate-spin" />
            </div>
            <p className="text-blue-700 text-xl max-w-xl mx-auto font-semibold mb-2">
              Generating Market Research...
            </p>
            <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed">
              This process takes about 30-60 seconds. Please wait while we analyze the market and generate comprehensive research data.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-64 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
            <p className="mt-4 text-sm text-blue-600">
              Analyzing competitors, market trends, and opportunities...
            </p>
          </div>
        </div>
      ) : !hypothesesMarketResearchData ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Search className="w-12 h-12 text-blue-600" />
            </div>

            <p className="text-blue-700 text-lg max-w-xl mx-auto">
              The data for the "Research" page hasn't been generated yet.
              Generate it now
            </p>

            <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed">
              Data generation takes about 30-60 seconds. If you've already started
              the process, please wait until it's completed
            </p>

            <Button
              variant={"default"}
              size="sm"
              disabled={loading || !activeHypothesisId}
              onClick={() => {
                if (!hasResearchAccess) {
                  setShowUpgradeModal(true);
                  return;
                }
                
                if (!activeHypothesisId) {
                  return;
                }
                
                createHypothesesMarketResearch(activeHypothesisId);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Data
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 pt-24 w-full max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center">
              <Search className="h-6 w-6 mr-2 text-blue-500" />
              <h1 className="text-2xl font-bold text-blue-900">
                Market Research Summary
              </h1>
            </div>
          </div>
          
          {/* Regenerate form */}
          <RegenerateResearchForm />
          
          <div className="space-y-6">
            <div
              className="border border-gray-200 rounded-lg p-4 relative bg-white hover:bg-blue-50 cursor-pointer"
              onClick={() => {}}
            >
              <EditableText
                initialText={hypothesesMarketResearchData.summary ?? ""}
                onTextChange={(newText) => {
                  changeHypothesesMarketResearch(newText);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {hypothesesMarketResearchData && <AIAssistantChat />}
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="market research"
        reason={`Market research is not available for the ${currentPlan} plan. Upgrade your plan to generate market research data.`}
      />
    </div>
  );
};

export default Research;
