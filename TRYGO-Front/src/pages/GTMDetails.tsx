import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Rocket,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  Play,
  Target,
  Lightbulb,
  BarChart3,
  Wrench,
  BookOpen,
  X,
  Plus,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LoaderSpinner from "@/components/LoaderSpinner";
import AIAssistantChat from "@/components/AIAssistantChat";
import EditableText from "@/components/EditableText";
import { useGtmStore, StageKeyType } from "@/store/useGtmStore";
import { StatusType } from "@/api/getHypothesesGtm";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import { useToast } from "@/hooks/use-toast";
import { GtmTypes } from "@/types/GtmType";
import {
  createHypothesesGtmDetailedChannel,
  HypothesesGtmDetailedChannel,
} from "@/api/createHypothesesGtmDetailedChannel";
import { getHypothesesGtmDetailedChannel } from "@/api/getHypothesesGtmDetailedChannel";
import { 
  changeHypothesesGtmDetailedChannel,
  ChangeHypothesesGtmDetailedChannelInput 
} from "@/api/changeHypothesesGtmDetailedChannel";
import { generateHypothesesGtmDetailedChannelContentIdea } from "@/api/generateHypothesesGtmDetailedChannelContentIdea";

const GTMDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stageKey = searchParams.get("key") || "";
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [detailedChannel, setDetailedChannel] =
    useState<HypothesesGtmDetailedChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Load collapsed sections from cookies or set defaults (all closed)
  const loadCollapsedSections = (): Record<string, boolean> => {
    try {
      const saved = document.cookie
        .split('; ')
        .find(row => row.startsWith('gtmDetailsCollapsed='))
        ?.split('=')[1];
      
      if (saved) {
        return JSON.parse(decodeURIComponent(saved));
      }
    } catch (error) {
      // Silent error handling
    }
    
    // Default: all sections closed
    return {
      preparation: true,
      tools: true,
      resources: true,
      content: true,
      actionPlan: true,
      metrics: true,
    };
  };

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(loadCollapsedSections);

  // Store hooks
  const { activeProject } = useProjects();
  const { activeHypothesis } = useHypotheses({ projectId: activeProject?.id });
  
  const hypothesesGtm = useGtmStore((state) => state.hypothesesGtm);
  const getHypothesesGtm = useGtmStore((state) => state.getHypothesesGtm);
  const storeLoading = useGtmStore((state) => state.loading);
  const coreData = useHypothesesCoreStore((state) => state.coreData);
  const getHypothesesCore = useHypothesesCoreStore(
    (state) => state.getHypothesesCore
  );
  const coreLoading = useHypothesesCoreStore((state) => state.loading);
  const handleChangeStatus = useGtmStore((state) => state.handleChangeStatus);

  // Get channel data from GTM store
  const stages = hypothesesGtm
    ? [
        hypothesesGtm.stageValidate,
        hypothesesGtm.stageBuildAudience,
        hypothesesGtm.stageScale,
      ]
    : [];

  const channel =
    stages
      .flatMap((stage) => stage?.channels ?? [])
      .find((ch) => String(ch?.id) === String(id)) || null;

  const customerSegments = coreData?.customerSegments || [];

  // Fetch detailed channel data
  const fetchDetailedChannel = async () => {
    if (!selectedSegmentId || !id) return;

    try {
      setLoading(true);
      const data = await getHypothesesGtmDetailedChannel({
        customerSegmentId: selectedSegmentId,
        hypothesesGtmChannelId: id,
      });
      setDetailedChannel(data);
    } catch (error) {
      setDetailedChannel(null);
    } finally {
      setLoading(false);
    }
  };

  // Generate detailed channel data
  const handleGenerateData = async () => {
    if (!selectedSegmentId || !id || !activeHypothesis?.id) {
      toast({
        title: "Error",
        description: "Missing required data for generation",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setGenerateError(null);
      const data = await createHypothesesGtmDetailedChannel({
        customerSegmentId: selectedSegmentId,
        hypothesesGtmChannelId: id,
        projectHypothesisId: activeHypothesis.id,
      });
      setDetailedChannel(data);
      toast({
        title: "Success",
        description: "Channel details generated successfully",
      });
    } catch (error) {
      setGenerateError("Failed to generate channel details. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate channel details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Save collapsed sections to cookies
  const saveCollapsedSections = (sections: Record<string, boolean>) => {
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1); // Expire in 1 year
      document.cookie = `gtmDetailsCollapsed=${encodeURIComponent(JSON.stringify(sections))}; expires=${expires.toUTCString()}; path=/`;
    } catch (error) {
      // Silent error handling
    }
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => {
      const newSections = {
        ...prev,
        [sectionKey]: !prev[sectionKey],
      };
      
      // Save to cookies
      saveCollapsedSections(newSections);
      
      return newSections;
    });
  };

  // Clean data from Apollo's __typename fields
  const cleanData = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanData);
    } else if (obj !== null && typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (key !== '__typename') {
          cleaned[key] = cleanData(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  // Update detailed channel data
  const updateDetailedChannel = async (updates: Partial<ChangeHypothesesGtmDetailedChannelInput>) => {
    if (!detailedChannel?.id) return;

    try {
      // Clean the updates from __typename fields
      const cleanedUpdates = cleanData(updates);
      
      const updatedData = await changeHypothesesGtmDetailedChannel({
        id: detailedChannel.id,
        ...cleanedUpdates,
      });
      setDetailedChannel(updatedData);
      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  // Generate new content idea
  const handleGenerateNewIdea = async () => {
    if (!selectedSegmentId || !id) {
      toast({
        title: "Error",
        description: "Missing required data for generation",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const newIdea = await generateHypothesesGtmDetailedChannelContentIdea({
        customerSegmentId: selectedSegmentId,
        hypothesesGtmChannelId: id,
      });

      if (detailedChannel) {
        const updatedIdeas = [...detailedChannel.contentIdeas, newIdea];
        await updateDetailedChannel({ contentIdeas: updatedIdeas });
      }

      toast({
        title: "Success",
        description: "New content idea generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new content idea",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (activeHypothesis?.id) {
      // Load both GTM data and core data (for customer segments)
      getHypothesesGtm(activeHypothesis.id);
      getHypothesesCore(activeHypothesis.id);
    }
  }, [activeHypothesis?.id, getHypothesesGtm, getHypothesesCore]);

  useEffect(() => {
    if (selectedSegmentId && id) {
      fetchDetailedChannel();
    }
  }, [selectedSegmentId, id]);

  // Auto-select first customer segment when data loads - default value is always the first item from array
  useEffect(() => {
    if (customerSegments.length > 0) {
      // Always set the first segment as default if no segment is selected or if the current selection is not in the list
      const currentSegmentExists = customerSegments.some(segment => segment.id === selectedSegmentId);
      if (!selectedSegmentId || !currentSegmentExists) {
        setSelectedSegmentId(customerSegments[0].id);
      }
    }
  }, [customerSegments, selectedSegmentId]);

  if (!channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
        <div className="flex flex-1 items-center justify-center mt-24">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Channel not found
            </h2>
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to GTM
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || storeLoading || coreLoading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
            <LoaderSpinner />
          </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
        <div className="px-4 py-8 pt-24 w-full">
        <div className="w-full max-w-7xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="mb-4 text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to GTM
            </Button>

          {/* Header with Channel Info - Always show */}
          <Card className="shadow-lg mb-6">
            <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-blue-900 mb-2">
                    {channel.name}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {detailedChannel ? "Detailed strategy and implementation plan" : "Generate detailed strategy for this channel"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-white">
                    {GtmTypes[channel.type]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Channel Data Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>KPI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ICP Segment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      {channel.name}
                    </TableCell>
                    <TableCell>{GtmTypes[channel.type]}</TableCell>
                    <TableCell className="max-w-xs">
                      {channel.description}
                    </TableCell>
                    <TableCell>{channel.kpis}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={channel.status}
                        onValueChange={(newValue) => {
                          handleChangeStatus(
                            stageKey as StageKeyType,
                            channel.id,
                            newValue as StatusType
                          );
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLANNED">Planned</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedSegmentId}
                        defaultValue={customerSegments.length > 0 ? customerSegments[0].id : ""}
                        onValueChange={setSelectedSegmentId}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Choose segment" />
                        </SelectTrigger>
                        <SelectContent>
                          {customerSegments.map((segment) => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {!detailedChannel ? (
            // Generate Data View
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-1 items-center justify-center px-4"
            >
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <Rocket className="w-12 h-12 text-blue-600" />
                </div>

                <h2 className="text-2xl font-bold text-blue-900 mb-4">
                  {generateError
                    ? "Generation Failed"
                    : "Generate Channel Strategy"}
                </h2>

                {generateError ? (
                  <>
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-lg mb-2">
                        {generateError}
                      </p>
                      <p className="text-red-600 text-sm">
                        Please check your connection and try again.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="default"
                        size="lg"
                        disabled={loading}
                        onClick={handleGenerateData}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loading ? "Generating..." : "Try Again"}
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setGenerateError(null)}
                        className="ml-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-blue-700 text-lg max-w-xl mx-auto mb-2">
                      The detailed strategy for this channel hasn't been
                      generated yet. Generate it now to see comprehensive
                      insights.
                    </p>

                    <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed mb-6">
                      Data generation takes about 30 seconds. If you've already
                      started the process, please wait until it's completed.
                    </p>

                    <Button
                      variant="default"
                      size="lg"
                      disabled={loading || !selectedSegmentId}
                      onClick={handleGenerateData}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? "Generating..." : "Generate Strategy"}
                    </Button>
                    
                    {!selectedSegmentId && (
                      <p className="mt-2 text-sm text-orange-600">
                        Please select a customer segment first
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            // Main Content - Channel Details
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >

              {/* Channel Strategy */}
              <Card className="shadow-lg">
                <CardHeader className="bg-green-50 rounded-t-lg border-b border-green-100">
                  <CardTitle className="text-green-900">
                    Channel Strategy
                  </CardTitle>
                  <CardDescription>
                    Comprehensive approach for this marketing channel
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    <EditableText
                      initialText={detailedChannel.channelStrategy}
                      onTextChange={(value) => updateDetailedChannel({ channelStrategy: value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Channel Preparation Tasks */}
              <Card className="shadow-lg">
                <CardHeader
                  className="bg-blue-50 rounded-t-lg border-b border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSection("preparation")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                      <CardTitle className="text-blue-900">
                        Channel Preparation
                      </CardTitle>
                    </div>
                    {collapsedSections.preparation ? (
                      <ChevronDown className="h-5 w-5 text-blue-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <CardDescription>
                    Tasks to prepare before launching this channel
                  </CardDescription>
                </CardHeader>
                {!collapsedSections.preparation && (
                  <CardContent className="p-6">
                      <div className="space-y-3">
                        {detailedChannel.channelPreparationTasks.map(
                          (task, index) => (
                            <div
                              key={task.id}
                              className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <button
                                onClick={() => {
                                  const updatedTasks = [...detailedChannel.channelPreparationTasks];
                                  updatedTasks[index] = { ...task, isCompleted: !task.isCompleted };
                                  updateDetailedChannel({ channelPreparationTasks: updatedTasks });
                                }}
                                className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                              >
                                {task.isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              <div className="flex-1">
                                <EditableText
                                  initialText={task.text}
                                  onTextChange={(value) => {
                                    const updatedTasks = [...detailedChannel.channelPreparationTasks];
                                    updatedTasks[index] = { ...task, text: value };
                                    updateDetailedChannel({ channelPreparationTasks: updatedTasks });
                                  }}
                                />
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Tools and Resources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tools */}
                <Card className="shadow-lg">
                  <CardHeader 
                    className="bg-purple-50 rounded-t-lg border-b border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                    onClick={() => toggleSection("tools")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="h-5 w-5 mr-2 text-purple-600" />
                        <CardTitle className="text-purple-900">Tools</CardTitle>
                      </div>
                      {collapsedSections.tools ? (
                        <ChevronDown className="h-5 w-5 text-purple-600" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <CardDescription>
                      Recommended tools for this channel
                    </CardDescription>
                  </CardHeader>
                  {!collapsedSections.tools && (
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {(Array.isArray(detailedChannel.tools) ? detailedChannel.tools : detailedChannel.tools.split('\n').filter(tool => tool.trim())).map((tool, index) => (
                          <div key={index} className="p-3 rounded-lg bg-purple-50 border border-purple-100 group relative">
                            <EditableText
                              initialText={tool.trim()}
                              onTextChange={(value) => {
                                const toolsArray = Array.isArray(detailedChannel.tools) 
                                  ? [...detailedChannel.tools] 
                                  : detailedChannel.tools.split('\n').filter(t => t.trim());
                                toolsArray[index] = value;
                                updateDetailedChannel({ tools: toolsArray.join('\n') });
                              }}
                            />
                            <button
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const toolsArray = Array.isArray(detailedChannel.tools) 
                                  ? [...detailedChannel.tools] 
                                  : detailedChannel.tools.split('\n').filter(t => t.trim());
                                toolsArray.splice(index, 1);
                                updateDetailedChannel({ tools: toolsArray.join('\n') });
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const toolsArray = Array.isArray(detailedChannel.tools) 
                              ? [...detailedChannel.tools] 
                              : detailedChannel.tools.split('\n').filter(t => t.trim());
                            toolsArray.push('New Tool');
                            updateDetailedChannel({ tools: toolsArray.join('\n') });
                          }}
                          className="w-full p-3 border-2 border-dashed border-purple-200 rounded-lg text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Tool
                        </button>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Resources */}
                <Card className="shadow-lg">
                  <CardHeader 
                    className="bg-amber-50 rounded-t-lg border-b border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={() => toggleSection('resources')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-amber-600" />
                        <CardTitle className="text-amber-900">Resources</CardTitle>
                      </div>
                      {collapsedSections.resources ? (
                        <ChevronDown className="h-5 w-5 text-amber-600" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <CardDescription>
                      Essential resources and materials
                    </CardDescription>
                  </CardHeader>
                  {!collapsedSections.resources && (
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {(Array.isArray(detailedChannel.resources) ? detailedChannel.resources : detailedChannel.resources.split('\n').filter(resource => resource.trim())).map((resource, index) => (
                          <div key={index} className="p-3 rounded-lg bg-amber-50 border border-amber-100 group relative">
                            <EditableText
                              initialText={resource.trim()}
                              onTextChange={(value) => {
                                const resourcesArray = Array.isArray(detailedChannel.resources) 
                                  ? [...detailedChannel.resources] 
                                  : detailedChannel.resources.split('\n').filter(r => r.trim());
                                resourcesArray[index] = value;
                                updateDetailedChannel({ resources: resourcesArray.join('\n') });
                              }}
                            />
                            <button
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const resourcesArray = Array.isArray(detailedChannel.resources) 
                                  ? [...detailedChannel.resources] 
                                  : detailedChannel.resources.split('\n').filter(r => r.trim());
                                resourcesArray.splice(index, 1);
                                updateDetailedChannel({ resources: resourcesArray.join('\n') });
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const resourcesArray = Array.isArray(detailedChannel.resources) 
                              ? [...detailedChannel.resources] 
                              : detailedChannel.resources.split('\n').filter(r => r.trim());
                            resourcesArray.push('New Resource');
                            updateDetailedChannel({ resources: resourcesArray.join('\n') });
                          }}
                          className="w-full p-3 border-2 border-dashed border-amber-200 rounded-lg text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Resource
                        </button>
                </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Content Ideas */}
              <Card className="shadow-lg">
                <CardHeader
                  className="bg-teal-50 rounded-t-lg border-b border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors"
                  onClick={() => toggleSection("content")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-teal-600" />
                      <CardTitle className="text-teal-900">
                        Content Ideas
                      </CardTitle>
                    </div>
                    {collapsedSections.content ? (
                      <ChevronDown className="h-5 w-5 text-teal-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-teal-600" />
                    )}
                  </div>
                  <CardDescription>
                    Content suggestions and templates
                  </CardDescription>
                </CardHeader>
                {!collapsedSections.content && (
                  <CardContent className="p-6">
                      <div className="space-y-4">
                        {detailedChannel.contentIdeas.map((idea, index) => (
                          <div
                            key={idea.id}
                            className="p-4 rounded-lg bg-teal-50 border border-teal-100"
                          >
                            <div className="mb-2">
                              <EditableText
                                initialText={idea.title}
                                onTextChange={(value) => {
                                  const updatedIdeas = [...detailedChannel.contentIdeas];
                                  updatedIdeas[index] = { ...idea, title: value };
                                  updateDetailedChannel({ contentIdeas: updatedIdeas });
                                }}
                              />
                            </div>
                            <EditableText
                              initialText={idea.text}
                              onTextChange={(value) => {
                                const updatedIdeas = [...detailedChannel.contentIdeas];
                                updatedIdeas[index] = { ...idea, text: value };
                                updateDetailedChannel({ contentIdeas: updatedIdeas });
                              }}
                            />
                          </div>
                        ))}
                      <Button
                        variant="outline"
                        className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                        onClick={handleGenerateNewIdea}
                        disabled={loading}
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        {loading ? "Generating..." : "Generate New Idea"}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Action Plan */}
              <Card className="shadow-lg">
                <CardHeader
                  className="bg-indigo-50 rounded-t-lg border-b border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => toggleSection("actionPlan")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Play className="h-5 w-5 mr-2 text-indigo-600" />
                      <CardTitle className="text-indigo-900">
                        Action Plan
                      </CardTitle>
                    </div>
                    {collapsedSections.actionPlan ? (
                      <ChevronDown className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                  <CardDescription>
                    Step-by-step implementation plan
                  </CardDescription>
                </CardHeader>
                {!collapsedSections.actionPlan && (
                  <CardContent className="p-6">
                      <div className="space-y-6">
                        {detailedChannel.actionPlan.map((stage, stageIndex) => (
                          <div
                            key={stage.id}
                            className="border border-indigo-100 rounded-lg p-4 bg-indigo-50"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center flex-1 mr-4">
                                <span className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-800 text-sm font-bold mr-3">
                                  {stageIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <EditableText
                                    initialText={stage.stageTitle}
                                    onTextChange={(value) => {
                                      const updatedPlan = [...detailedChannel.actionPlan];
                                      updatedPlan[stageIndex] = { ...stage, stageTitle: value };
                                      updateDetailedChannel({ actionPlan: updatedPlan });
                                    }}
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const updatedPlan = [...detailedChannel.actionPlan];
                                  updatedPlan[stageIndex] = { ...stage, isCompleted: !stage.isCompleted };
                                  updateDetailedChannel({ actionPlan: updatedPlan });
                                }}
                                className="hover:scale-110 transition-transform"
                              >
                                {stage.isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                            </div>
                            <div className="space-y-2 ml-9">
                              {stage.tasks.map((task, taskIndex) => (
                                <div
                                  key={task.id}
                                  className="flex items-start space-x-3 p-2 rounded bg-white"
                                >
                                  <button
                                    onClick={() => {
                                      const updatedPlan = [...detailedChannel.actionPlan];
                                      const updatedTasks = [...stage.tasks];
                                      updatedTasks[taskIndex] = { ...task, isCompleted: !task.isCompleted };
                                      updatedPlan[stageIndex] = { ...stage, tasks: updatedTasks };
                                      updateDetailedChannel({ actionPlan: updatedPlan });
                                    }}
                                    className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
                                  >
                                    {task.isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <EditableText
                                      initialText={task.text}
                                      onTextChange={(value) => {
                                        const updatedPlan = [...detailedChannel.actionPlan];
                                        const updatedTasks = [...stage.tasks];
                                        updatedTasks[taskIndex] = { ...task, text: value };
                                        updatedPlan[stageIndex] = { ...stage, tasks: updatedTasks };
                                        updateDetailedChannel({ actionPlan: updatedPlan });
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Metrics and KPIs */}
              <Card className="shadow-lg">
                <CardHeader
                  className="bg-rose-50 rounded-t-lg border-b border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors"
                  onClick={() => toggleSection("metrics")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-rose-600" />
                      <CardTitle className="text-rose-900">
                        Metrics and KPIs
                      </CardTitle>
                    </div>
                    {collapsedSections.metrics ? (
                      <ChevronDown className="h-5 w-5 text-rose-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-rose-600" />
                    )}
                  </div>
                  <CardDescription>
                    Key performance indicators to track
                  </CardDescription>
                </CardHeader>
                {!collapsedSections.metrics && (
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detailedChannel.metricsAndKpis.map((metric, index) => (
                        <div
                          key={metric.id}
                          className="p-4 rounded-lg bg-rose-50 border border-rose-100"
                        >
                          <div className="space-y-2">
                            <div className="font-medium text-rose-900">
                              <EditableText
                                initialText={metric.key}
                                onTextChange={(value) => {
                                  const updatedMetrics = [...detailedChannel.metricsAndKpis];
                                  updatedMetrics[index] = { ...metric, key: value };
                                  updateDetailedChannel({ metricsAndKpis: updatedMetrics });
                                }}
                              />
                            </div>
                            <div className="text-rose-700 font-semibold">
                              <EditableText
                                initialText={metric.value}
                                onTextChange={(value) => {
                                  const updatedMetrics = [...detailedChannel.metricsAndKpis];
                                  updatedMetrics[index] = { ...metric, value: value };
                                  updateDetailedChannel({ metricsAndKpis: updatedMetrics });
                }}
              />
            </div>
          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* AI Assistant Chat */}
      {selectedSegmentId && <AIAssistantChat defaultOpen={true} />}
    </div>
  );
};

export default GTMDetails;
