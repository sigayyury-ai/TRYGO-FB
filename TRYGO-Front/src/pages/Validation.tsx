import AIAssistantChat from "@/components/AIAssistantChat";
import EditableList from "@/components/EditableList";
import EditableText from "@/components/EditableText";
import Header from "@/components/Header";
import { ProblemIcon } from "@/components/icons/CanvasIcons";
import LoaderSpinner from "@/components/LoaderSpinner";
import RegenerateHypothesesValidationForm from "@/components/RegenerateHypothesesValidationForm";
import { Button } from "@/components/ui/button";
import UploadeCustomerInterviewsModal from "@/components/UploadCustomerInterviewsModal";
import { useActiveProjectId, useActiveHypothesisId } from "@/hooks/useActiveIds";
import {
  toggleUploadCustomerInsightsModal,
  toggleUploadJtbdInsightsModal,
  useValidationStore,
} from "@/store/useValidationStore";
import {
  CheckCircle,
  Users,
  Lightbulb,
  Share2,
  HelpCircle,
  ClipboardList,
  FileText,
  Clipboard,
  Target,
  AlertCircle,
  MessageCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import useSubscription from "@/hooks/use-subscription";
import UpgradeModal from "@/components/UpgradeModal";

const Validation = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeatureAccess, currentPlan } = useSubscription();
  const hasValidationAccess = hasFeatureAccess('validation');
  
  // Получаем проект и активную гипотезу из cookies (без stores)
  const activeProjectId = useActiveProjectId();
  const activeHypothesisId = useActiveHypothesisId();

  const loading = useValidationStore((state) => state.loading);
  const hypothesesValidation = useValidationStore(
    (state) => state.hypothesesValidation
  );
  //   JSON.stringify(hypothesesValidation, null, 2)
  // );

  const getHypothesesValidation = useValidationStore(
    (state) => state.getHypothesesValidation
  );
  const createHypothesesValidation = useValidationStore(
    (state) => state.createHypothesesValidation
  );

  const changeHypothesesValidation = useValidationStore(
    (state) => state.changeHypothesesValidation
  );

  const changeCustomerInterview = async (
    customerInterviewQuestions: string[]
  ) => {
    await changeHypothesesValidation({ customerInterviewQuestions });
  };

  const changeCustomerInsights = async (insightsCustomerInterviews: string) => {
    await changeHypothesesValidation({ insightsCustomerInterviews });
  };

  const changeSummaryGoals = async (goals: string[]) => {
    if (!hypothesesValidation) return;

    const { pains, hypotheses, toneOfVoice } =
      hypothesesValidation.summaryInterview;

    await changeHypothesesValidation({
      summaryInterview: {
        goals,
        pains,
        hypotheses,
        toneOfVoice,
      },
    });
  };
  const changeSummaryPains = async (pains: string[]) => {
    if (!hypothesesValidation) return;
    const { goals, hypotheses, toneOfVoice } =
      hypothesesValidation.summaryInterview;

    await changeHypothesesValidation({
      summaryInterview: {
        goals,
        pains,
        hypotheses,
        toneOfVoice,
      },
    });
  };

  const changeSummaryHypotheses = async (hypothesesList: string[]) => {
    if (!hypothesesValidation) return;
    const { goals, pains, toneOfVoice } = hypothesesValidation.summaryInterview;

    await changeHypothesesValidation({
      summaryInterview: {
        goals,
        pains,
        hypotheses: hypothesesList,
        toneOfVoice,
      },
    });
  };

  const changeSummaryToneOfVoice = async (toneOfVoice: string) => {
    if (!hypothesesValidation) return;
    const { goals, pains, hypotheses } = hypothesesValidation.summaryInterview;

    await changeHypothesesValidation({
      summaryInterview: {
        goals,
        pains,
        hypotheses,
        toneOfVoice,
      },
    });
  };

  const handleUploadInterview = () => {
    if (!hasValidationAccess) {
      setShowUpgradeModal(true);
    } else {
      toggleUploadCustomerInsightsModal(true);
    }
  };

  // Загружаем контент валидации на основе activeHypothesisId из cookies
  useEffect(() => {
    if (activeHypothesisId) {
      getHypothesesValidation(activeHypothesisId);
    }
  }, [activeHypothesisId, getHypothesesValidation]);

  return (
    <>
      <div className="min-h-screen bg-research-gradient bg-grid-pattern flex flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderSpinner />
          </div>
        ) : !hypothesesValidation ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-blue-600" />
              </div>

              <p className="text-blue-700 text-lg max-w-xl mx-auto">
                The data for the “Validation” page hasn’t been generated yet.
                Generate it now
              </p>

              <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed">
                Data generation takes about 30 seconds. If you’ve already
                started the process, please wait until it’s completed
              </p>

              <Button
                variant={"default"}
                size="sm"
                disabled={loading || !activeHypothesisId}
                onClick={() => {
                  if (!hasValidationAccess) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  
                  if (!activeHypothesisId) {
                    return;
                  }
                  
                  createHypothesesValidation(activeHypothesisId);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Generate Data"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-8 pt-24 w-full mx-auto">
            <div className="mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-2 text-blue-500" />
                <h1 className="text-2xl font-bold text-blue-900">
                  Validation Recommendations
                </h1>
              </div>
            </div>

            {/* Regenerate form */}
            <RegenerateHypothesesValidationForm />

            <div className="flex justify-between h-screen gap-8 mb-24">
              <div className="flex flex-col gap-10 min-w-[250px] w-2/3">
                <div className="p-4 bg-white rounded-lg shadow-lg border-b border-blue-100">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 mr-2" />
                    <h2 className="font-bold">Upload Interview</h2>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Upload your customer interview to generate summary insights
                  </p>
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2"
                    disabled={loading}
                    onClick={handleUploadInterview}
                  >
                    Upload Interview
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-lg border-b border-blue-100">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 mr-2" />
                    <h2 className="font-bold">Customer Interview Questions</h2>
                  </div>
                  <EditableList
                    initialItems={
                      hypothesesValidation.customerInterviewQuestions
                    }
                    onItemsChange={changeCustomerInterview}
                  />
                </div>

              </div>
              <div className=" flex flex-col gap-16 min-w-[250px] h-full w-3/4">
                <div className="p-4 bg-white rounded-lg shadow-lg border-b border-blue-100">
                  <div className="flex items-center mb-2">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    <h2 className="font-bold">
                      Insights From Customer Interviews
                    </h2>
                  </div>
                  {hypothesesValidation.insightsCustomerInterviews && (
                    <EditableText
                      initialText={
                        hypothesesValidation.insightsCustomerInterviews
                      }
                      onTextChange={changeCustomerInsights}
                    />
                  )}
                </div>

                <div className="p-4 bg-white rounded-lg shadow-lg border-b border-blue-100">
                  <div className="flex items-center mb-2">
                    <Clipboard className="h-5 w-5 mr-2" />
                    <h2 className="font-bold">Summary Interview</h2>
                  </div>

                  {hypothesesValidation.summaryInterview ? (
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          <h2 className="font-bold">Goals</h2>
                        </div>

                        <EditableList
                          initialItems={
                            hypothesesValidation.summaryInterview.goals
                          }
                          onItemsChange={changeSummaryGoals}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <h2 className="font-bold">Pains</h2>
                        </div>

                        <EditableList
                          initialItems={
                            hypothesesValidation.summaryInterview.pains
                          }
                          onItemsChange={changeSummaryPains}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Zap className="h-5 w-5 mr-2" />
                          <h2 className="font-bold">Hypotheses</h2>
                        </div>

                        <EditableList
                          initialItems={
                            hypothesesValidation.summaryInterview.hypotheses
                          }
                          onItemsChange={changeSummaryHypotheses}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <MessageCircle className="h-5 w-5 mr-2" />
                          <h2 className="font-bold">Tone Of Voice</h2>
                        </div>

                        <EditableText
                          initialText={
                            hypothesesValidation.summaryInterview.toneOfVoice
                          }
                          onTextChange={changeSummaryToneOfVoice}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 text-lg">
                        Please, Upload Interview to see Summary Interview
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-[300px] h-full">
                <div
                  className="p-4 bg-white rounded-lg shadow-lg border-b border-blue-100"
                  style={{ minHeight: "calc(100% - 200px)" }}
                >
                  <div className="flex items-center mb-2">
                    <Share2 className="h-5 w-5 mr-2" />
                    <h2 className="font-bold">Channels For Validation</h2>
                  </div>
                  <EditableList
                    initialItems={hypothesesValidation.validationChannels}
                    onItemsChange={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {hypothesesValidation && <AIAssistantChat />}
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="validation analysis"
        reason={`Validation analysis is not available for the ${currentPlan} plan. Upgrade your plan to generate validation data and upload customer interviews.`}
      />
    </>
  );
};

export default Validation;
