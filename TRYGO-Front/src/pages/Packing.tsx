import AIAssistantChat from "@/components/AIAssistantChat";
import EditableText from "@/components/EditableText";
import Header from "@/components/Header";
import LoaderSpinner from "@/components/LoaderSpinner";
import RegenerateHypothesesPackingForm from "@/components/RegenerateHypothesesPackingForm";
import { Button } from "@/components/ui/button";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { usePackingStore } from "@/store/usePackingStore";
import { Lock, Package } from "lucide-react";
import { useEffect, useState } from "react";
import useSubscription from "@/hooks/use-subscription";
import UpgradeModal from "@/components/UpgradeModal";

const Packing = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeatureAccess, currentPlan } = useSubscription();
  const hasPackingAccess = hasFeatureAccess('packing');
  
  const activeHypothesisId = useHypothesisStore(
    (state) => state.activeHypothesis.id
  );

  const loading = usePackingStore((state) => state.loading);

  const hypothesesPacking = usePackingStore((state) => state.hypothesesPacking);

  const getHypothesesPacking = usePackingStore(
    (state) => state.getHypothesesPacking
  );
  const createHypothesesPacking = usePackingStore(
    (state) => state.createHypothesesPacking
  );
  const changeHypothesesPacking = usePackingStore(
    (state) => state.changeHypothesesPacking
  );

  useEffect(() => {
    if (activeHypothesisId) {
      getHypothesesPacking(activeHypothesisId);
    }
  }, [activeHypothesisId]);

  return (
    <>
      <div className="min-h-screen bg-research-gradient bg-grid-pattern flex flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderSpinner />
          </div>
        ) : !hypothesesPacking ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Package className="w-12 h-12 text-blue-600" />
              </div>

              <p className="text-blue-700 text-lg max-w-xl mx-auto">
                The data for the “Packing” page hasn’t been generated yet.
                Generate it now
              </p>

              <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed">
                Data generation takes about 30 seconds. If you’ve already
                started the process, please wait until it’s completed
              </p>

              <Button
                variant={"default"}
                size="sm"
                disabled={loading}
                onClick={() => {
                  if (!hasPackingAccess) {
                    setShowUpgradeModal(true);
                  } else {
                    createHypothesesPacking(activeHypothesisId);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white mt-4"
              >
                {loading ? "Generating..." : "Generate Data"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-8 pt-24 w-full max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center">
                <Package className="h-6 w-6 mr-2 text-blue-500" />
                <h1 className="text-2xl font-bold text-blue-900">
                  Packing Summary
                </h1>
              </div>
            </div>
            
            {/* Regenerate form */}
            <RegenerateHypothesesPackingForm />
            
            <div className="space-y-6">
              <div
                className="border border-gray-200 rounded-lg p-4 relative bg-white hover:bg-blue-50 cursor-pointer"
                onClick={() => {}}
              >
                <EditableText
                  initialText={hypothesesPacking.summary ?? ""}
                  onTextChange={(newText) => {
                    changeHypothesesPacking(newText);
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {hypothesesPacking && <AIAssistantChat />}
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="packing analysis"
        reason={`Packing analysis is not available for the ${currentPlan} plan. Upgrade your plan to generate packing data.`}
      />
    </>
  );
};

export default Packing;
