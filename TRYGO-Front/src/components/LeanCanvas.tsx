import { FC, useState, useEffect } from "react";
import { Tag } from "lucide-react";
import {
  ProblemIcon,
  SolutionIcon,
  CustomerSegmentsIcon,
  KeyMetricsIcon,
  ChannelsIcon,
  CostStructureIcon,
  RevenueStreamsIcon,
  UnfairAdvantageIcon,
} from "./icons/CanvasIcons";
import EditableList from "./EditableList";
import EditableText from "./EditableText";
import ChannelsList from "./ChannelsList";
import CustomerSegments from "./CustomerSegments";
import RegenerateHypothesesCoreForm from "./RegenerateHypothesesCoreForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import {
  CustomerSegmentDto,
  ChannelDto,
} from "@/api/getHypothesesCore";
import LoaderSpinner from "@/components/LoaderSpinner";
import { useToast } from "@/hooks/use-toast";
import { ChangeHypothesesCoreInput } from "@/api/changeHypothesesCore";

const LeanCanvas: FC = () => {
  const [problems, setProblems] = useState<string[]>([]);
  const [solutions, setSolutions] = useState<string[]>([]);
  const [uniqueProposition, setUniqueProposition] = useState("");
  const [keyMetrics, setKeyMetrics] = useState<string[]>([]);
  const [unfairAdvantages, setUnfairAdvantages] = useState<string[]>([]);
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [customerSegments, setCustomerSegments] = useState<
    CustomerSegmentDto[]
  >([]);
  const [costStructure, setCostStructure] = useState("");
  const [revenueStream, setRevenueStream] = useState("");

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { activeProject } = useProjects();
  const { activeHypothesis } = useHypotheses({ projectId: activeProject?.id });
  const wasAutoRefreshed = useHypothesesCoreStore(
    (state) => state.wasAutoRefreshed
  );

  const {
    coreData,
    loading: coreLoading,
    error: coreError,
    getHypothesesCore,
    changeHypothesesCore,
  } = useHypothesesCoreStore();


  useEffect(() => {
    if (activeHypothesis?.id) {
      getHypothesesCore(activeHypothesis.id);
    }
  }, [activeHypothesis?.id, getHypothesesCore]);

  useEffect(() => {
    if (coreData) {
      setProblems(coreData.problems || []);
      setSolutions(coreData.solutions || []);
      setUniqueProposition(coreData.uniqueProposition || "");
      setKeyMetrics(coreData.keyMetrics || []);
      setUnfairAdvantages(coreData.unfairAdvantages || []);
      setChannels(coreData.channels || []);
      setCustomerSegments(coreData.customerSegments || []);
      setCostStructure(coreData.costStructure || "");
      setRevenueStream(coreData.revenueStream || "");
    }
  }, [coreData]);

  const handleSaveChanges = async (
    data?: Partial<ChangeHypothesesCoreInput>
  ) => {
    if (!coreData?.id || !activeHypothesis?.id) return;

    try {
      await changeHypothesesCore({
        id: coreData.id,
        problems,
        solutions,
        uniqueProposition,
        keyMetrics,
        unfairAdvantages,
        channels,
        customerSegments,
        costStructure,
        revenueStream,
        ...data,
      });

      toast({
        title: "Changes saved",
        description: "Your Lean Canvas has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (wasAutoRefreshed) {
      toast({
        title: "Changes saved",
        description: "Your Lean Canvas has been updated successfully",
      });
      useHypothesesCoreStore.setState({ wasAutoRefreshed: false });
    }
  }, [wasAutoRefreshed]);

  const handleProblemsChange = async (items: string[]) => {
    setProblems(items);
    await handleSaveChanges({ problems: items });
  };

  const handleSolutionsChange = async (items: string[]) => {
    setSolutions(items);
    await handleSaveChanges({ solutions: items });
  };

  const handleUniquePropositionChange = async (text: string) => {
    setUniqueProposition(text);
    await handleSaveChanges({ uniqueProposition: text });
  };

  const handleKeyMetricsChange = async (items: string[]) => {
    setKeyMetrics(items);
    await handleSaveChanges({ keyMetrics: items });
  };

  const handleUnfairAdvantagesChange = async (items: string[]) => {
    setUnfairAdvantages(items);
    await handleSaveChanges({ unfairAdvantages: items });
  };

  const handleChannelsChange = async (items: ChannelDto[]) => {
    setChannels(items);
    await handleSaveChanges({ channels: items });
  };

  const handleCostStructureChange = async (text: string) => {
    setCostStructure(text);
    await handleSaveChanges({ costStructure: text });
  };

  const handleRevenueStreamChange = async (text: string) => {
    setRevenueStream(text);
    await handleSaveChanges({ revenueStream: text });
  };

  const handleCustomerSegmentsChange = (items: CustomerSegmentDto[]) => {
    setCustomerSegments(items);

    if (!coreData?.id || !activeHypothesis?.id) return;

    const updatedData = {
      id: coreData.id,
      problems,
      solutions,
      uniqueProposition,
      keyMetrics,
      unfairAdvantages,
      channels,
      customerSegments: items,
      costStructure,
      revenueStream,
    };

    changeHypothesesCore(updatedData)
      .then(() => {
        toast({
          title: "Changes saved",
          description: "Customer segments updated successfully",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to save customer segments",
          variant: "destructive",
        });
      });
  };

  if (coreLoading || !activeHypothesis?.id) {
    return (
      <div className="flex justify-center py-10">
        <LoaderSpinner />
      </div>
    );
  }

  // useEffect(() => {
  //   useHypothesisStore.persist.clearStorage();
  //   useHypothesesCoreStore.persist.clearStorage();
  //   useHypothesesCoreStore.setState({
  //     coreData: null
  //   })
  //   useHypothesisStore.setState({
  //     activeHypothesis: null,
  //     hypotheses: [],
  //   });
  // }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full">
      <div className="w-full">
        {/* Regenerate form */}
        <div className="p-4">
          <RegenerateHypothesesCoreForm />
        </div>

        {/* Canvas header with current hypothesis */}
        {activeHypothesis && (
          <div className="bg-blue-50 border-b border-blue-100 p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-blue-800">
                Active Hypothesis: {activeHypothesis.title}
              </h2>
              <p className="text-sm text-blue-600 mt-1">
                {activeHypothesis.description}
              </p>
            </div>
            {/* <button
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button> */}
          </div>
        )}

        {/* First Row: Problem, Solution, UVP */}
        <div
          className={`${
            isMobile ? "flex flex-col" : "grid grid-cols-3"
          } border-b border-gray-200`}
        >
          <div className="border-r border-gray-200 p-4" id="core-problem">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <ProblemIcon className="h-5 w-5 mr-2 text-gray-800" />
              1. Problem
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              List your top 1-3 problems.
            </p>
            <EditableList
              initialItems={problems}
              onItemsChange={handleProblemsChange}
            />
          </div>

          <div className="border-r border-gray-200 p-4" id="core-solution">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <SolutionIcon className="h-5 w-5 mr-2 text-gray-800" />
              4. Solution
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Outline a possible solution for each problem.
            </p>
            <EditableList
              initialItems={solutions}
              onItemsChange={handleSolutionsChange}
            />
          </div>

          <div className="p-4">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <Tag className="h-5 w-5 mr-2 text-gray-800" />
              3. Unique Value Proposition
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Single, clear compelling message that states why you are
              different.
            </p>
            <EditableText
              initialText={uniqueProposition}
              onTextChange={handleUniquePropositionChange}
            />
          </div>
        </div>

        {/* Second Row: Metrics, Advantage, Channels, Customers */}
        <div
          className={`${
            isMobile ? "flex flex-col" : "grid grid-cols-4"
          } border-b border-gray-200`}
        >
          <div className="border-r border-gray-200 p-4">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <KeyMetricsIcon className="h-5 w-5 mr-2 text-gray-800" />
              5. Key Metrics
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              List the numbers that tell you how your business is doing.
            </p>
            <EditableList
              initialItems={keyMetrics}
              onItemsChange={handleKeyMetricsChange}
            />
          </div>

          <div className="border-r border-gray-200 p-4">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <UnfairAdvantageIcon className="h-5 w-5 mr-2 text-gray-800" />
              9. Unfair Advantage
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Something that cannot easily be bought or copied.
            </p>
            <EditableList
              initialItems={unfairAdvantages}
              onItemsChange={handleUnfairAdvantagesChange}
            />
          </div>

          <div className="border-r border-gray-200 p-4" id="core-channels">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <ChannelsIcon className="h-5 w-5 mr-2 text-gray-800" />
              6. Channels
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              List your path to customers (inbound or outbound).
            </p>
            <ChannelsList
              initialChannels={channels}
              onChannelsChange={handleChannelsChange}
            />
          </div>

          <div className="p-4">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <CustomerSegmentsIcon className="h-5 w-5 mr-2 text-gray-800" />
              2. Customer Segments
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              List your target customers and users.
            </p>
            <CustomerSegments
              initialSegments={customerSegments}
              onSegmentsChange={handleCustomerSegmentsChange}
            />
          </div>
        </div>

        {/* Third Row: Cost, Revenue */}
        <div className={`${isMobile ? "flex flex-col" : "grid grid-cols-2"}`}>
          <div className="border-r border-gray-200 p-4">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <CostStructureIcon className="h-5 w-5 mr-2 text-gray-800" />
              7. Cost Structure
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              List your fixed and variable costs.
            </p>
            <EditableText
              initialText={costStructure || coreData?.costStructure || ""}
              onTextChange={handleCostStructureChange}
            />
          </div>

          <div className="p-4">
            <h3 className="text-xl font-bold mb-2 flex items-center uppercase">
              <RevenueStreamsIcon className="h-5 w-5 mr-2 text-gray-800" />
              8. Revenue Streams
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              List your sources of revenue.
            </p>
            <EditableText
              initialText={revenueStream || coreData?.revenueStream || ""}
              onTextChange={handleRevenueStreamChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeanCanvas;
