import { Button } from "@/components/ui/button";
import { Rocket, Info } from "lucide-react";
import AIAssistantChat from "@/components/AIAssistantChat";
import { useGtmStore } from "@/store/useGtmStore";
import LoaderSpinner from "@/components/LoaderSpinner";
import EditableText from "@/components/EditableText";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { useEffect } from "react";
import GtmTable from "@/components/GtmTable";
import RegenerateHypothesesGtmForm from "@/components/RegenerateHypothesesGtmForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

const GTM = () => {
  const activeHypothesisId = useHypothesisStore(
    (state) => state.activeHypothesis.id
  );

  const loading = useGtmStore((state) => state.loading);
  const hypothesesGtm = useGtmStore((state) => state.hypothesesGtm);
  const getHypothesesGtm = useGtmStore((state) => state.getHypothesesGtm);
  const createHypothesesGtm = useGtmStore((state) => state.createHypothesesGtm);

  useEffect(() => {
    if (activeHypothesisId) {
      getHypothesesGtm(activeHypothesisId);
    }
  }, [activeHypothesisId]);

  return (
    <>
      <div className="min-h-screen bg-research-gradient bg-grid-pattern flex flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderSpinner />
          </div>
        ) : !hypothesesGtm ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Rocket className="w-12 h-12 text-blue-600" />
              </div>

              <p className="text-blue-700 text-lg max-w-xl mx-auto">
                The data for the “GTM” page hasn’t been generated yet. Generate
                it now
              </p>

              <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed">
                Data generation takes about 30 seconds. If you've already
                started the process, please wait until it's completed
              </p>

              {/* Banner with links to Core and ICP pages */}
              <div className="mt-6 max-w-lg mx-auto">
                <Alert className="border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Please check the data on the{" "}
                    <Link 
                      to="/dashboard" 
                      className="font-medium text-amber-900 underline hover:text-amber-700 transition-colors"
                    >
                      Core
                    </Link>{" "}
                    page and the{" "}
                    <Link 
                      to="/person" 
                      className="font-medium text-amber-900 underline hover:text-amber-700 transition-colors"
                    >
                      ICP
                    </Link>{" "}
                    page before generating the GTM
                  </AlertDescription>
                </Alert>
              </div>

              <Button
                variant={"default"}
                size="sm"
                disabled={loading}
                onClick={() => {
                  createHypothesesGtm(activeHypothesisId);
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
                <Rocket className="h-6 w-6 mr-2 text-blue-500" />
                <h1 className="text-2xl font-bold text-blue-900">
                  GTM Channels
                </h1>
              </div>
            </div>

            {/* Regenerate form */}
            <RegenerateHypothesesGtmForm />

            <div className="space-y-6">
              <div
                className="border border-gray-200 rounded-lg p-4 relative bg-white "
                onClick={() => {}}
              >
                <GtmTable hypothesesGtm={hypothesesGtm} />
              </div>
            </div>
          </div>
        )}
        {hypothesesGtm && <AIAssistantChat />}
      </div>
    </>
  );
};

export default GTM;
