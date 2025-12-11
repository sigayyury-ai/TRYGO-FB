import { ChannelDto, ChannelType } from "@/api/getHypothesesCore";
import Header from "@/components/Header";
import { ChannelsIcon } from "@/components/icons/CanvasIcons";
import LoaderSpinner from "@/components/LoaderSpinner";
import RegenerateHypothesesCoreForm from "@/components/RegenerateHypothesesCoreForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import { useHypothesisStore } from "@/store/useHypothesisStore";
import { channelTypes, getChannelTypeLabel } from "@/utils/channelTypes";
import { ArrowLeft, Check, LinkIcon, Plus, Trash2, X } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const CustomerChannelsPage: FC = () => {
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [editingVariant, setEditingVariant] = useState<{
    channelIndex: number;
    variantIndex: number;
  } | null>(null);

  const [channelToDelete, setChannelToDelete] = useState<{
    channelIndex: number;
    variantIndex: number;
  } | null>(null);

  const [editName, setEditName] = useState<string>("");
  const [editUrl, setEditUrl] = useState<string>("");

  const [urlError, setUrlError] = useState("");

  const [showNewChannelForm, setShowNewChannelForm] = useState(false);

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [newChannelType, setNewChannelType] = useState<
    ChannelType | undefined
  >();
  const { toast } = useToast();

  const navigate = useNavigate();

  const { coreData, changeHypothesesCore, getHypothesesCore } = useHypothesesCoreStore();
  const { activeHypothesis } = useHypothesisStore.getState();


  useEffect(() => {
    if (!coreData && activeHypothesis?.id) {
      getHypothesesCore(activeHypothesis?.id);
    }
  }, [coreData, activeHypothesis?.id]);


  useEffect(() => {
    if (coreData?.channels) {
      setChannels(coreData?.channels);
    } else {
      setChannels([]);
    }
  }, [coreData]);

  const handleEditSave = () => {
    if (!editingVariant) return;

    const { channelIndex, variantIndex } = editingVariant;

    if (editName.trim() === "" || editUrl.trim() === "") {
      return;
    }

    if (!isValidUrl(editUrl.trim())) {
      setUrlError("Invalid url");

      return;
    }

    setUrlError("");

    const newChannels = [...channels];

    const newVariants = [...newChannels[channelIndex].variants];

    newVariants[variantIndex] = {
      name: editName.trim(),
      url: editUrl.trim(),
    };

    newChannels[channelIndex] = {
      ...newChannels[channelIndex],
      variants: newVariants,
    };

    setChannels(newChannels);
    handlSaveChannels(newChannels);
    setEditingVariant(null);
    setEditName("");
    setEditUrl("");
  };

  const handleEditCancel = () => {
    setEditingVariant(null);
    setEditName("");
    setEditUrl("");
  };

  const handleAddChannel = () => {
    if (!isValidUrl(newChannelUrl)) {
      setUrlError("Invalid url");
      return;
    }

    setUrlError("");

    if (newChannelName.trim() && newChannelUrl.trim() && newChannelType) {
      const newVariant = {
        name: newChannelName.trim(),
        url: newChannelUrl.trim(),
      };

      const existingIndex = channels.findIndex(
        (channel) => channel.channelType === newChannelType
      );

      let newChannels: ChannelDto[];

      if (existingIndex !== -1) {
        const updatedChannel = {
          ...channels[existingIndex],
          variants: [...channels[existingIndex].variants, newVariant],
        };

        newChannels = [...channels];
        newChannels[existingIndex] = updatedChannel;
      } else {
        const newChannel: ChannelDto = {
          channelType: newChannelType,
          variants: [newVariant],
        };

        newChannels = [...channels, newChannel];
      }

      setChannels(newChannels);
      handlSaveChannels(newChannels);

      setNewChannelName("");
      setNewChannelUrl("");
      setNewChannelType(undefined);
      setShowNewChannelForm(false);
    }
  };

  const handleRemoveChannel = (index: number) => {
    const newChannels = channels.filter((_, i) => i !== index);
    setChannels(newChannels);
    handlSaveChannels(newChannels);
  };

  const handlSaveChannels = (updatedChannels: ChannelDto[]) => {
    if (!coreData?.id) return;


    const updatedData = {
      id: coreData.id,
      problems: coreData.problems,
      solutions: coreData.solutions,
      uniqueProposition: coreData.uniqueProposition,
      keyMetrics: coreData.keyMetrics,
      unfairAdvantages: coreData.unfairAdvantages,
      channels: updatedChannels,
      customerSegments: coreData.customerSegments,
      costStructure: coreData.costStructure,
      revenueStream: coreData.revenueStream,
    };

    changeHypothesesCore(updatedData)
      .then(() => {
        toast({
          title: "Changes saved",
          description: "Channels updated successfully",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to save channels",
          variant: "destructive",
        });
      });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!coreData) {
    return (
      <div>
        <LoaderSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
      
        <div className="px-4 py-8 pt-24 w-full">
          <div className="w-full max-w-7xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="mb-4 text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ChannelsIcon className="h-6 w-6 mr-2 text-blue-500" />
                <h1 className="text-2xl font-bold text-blue-900">Channels</h1>
              </div>
              <Button
                onClick={() => setShowNewChannelForm(true)}
                className="bg-blue-500 hover:bg-blue-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Channel
              </Button>
            </div>

            {/* Regenerate form */}
            <RegenerateHypothesesCoreForm />

            {showNewChannelForm && (
              <div className="border border-blue-200 rounded-lg p-4 mb-6 bg-blue-50">
                <h3 className="font-medium text-blue-800 mb-3">New Channel</h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="channelName"
                      className="block text-sm font-medium text-blue-700 mb-1"
                    >
                      Channel Name
                    </label>
                    <Input
                      id="segmentName"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="border-blue-300 focus:border-blue-500"
                      placeholder="E.g. FaceBook"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="channelUrl"
                      className="block text-sm font-medium text-blue-700 mb-1"
                    >
                      Channel Url
                    </label>
                    <Input
                      id="segmentName"
                      value={newChannelUrl}
                      onChange={(e) => setNewChannelUrl(e.target.value)}
                      className="border-blue-300 focus:border-blue-500"
                      placeholder="E.g. https://example.com"
                    />
                    {urlError && (
                      <p className="text-red-600 text-sm mt-1">{urlError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Channel Type
                    </label>
                    <Select
                      value={newChannelType}
                      onValueChange={(value: ChannelType) =>
                        setNewChannelType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {channelTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewChannelForm(false)}
                      className="border-blue-300 text-blue-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddChannel}
                      disabled={
                        !newChannelName.trim() ||
                        !newChannelUrl.trim() ||
                        !newChannelType
                      }
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Add Segment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {channels.length > 0 ? (
                channels.map(({ channelType, variants }, index) => (
                  <div
                    className="border border-gray-200 rounded-lg p-4 relative bg-white"
                    key={index}
                  >
                    <h4 className="font-medium text-lg text-blue-600 mb-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                      {getChannelTypeLabel(channelType)}
                    </h4>

                    <div className="space-y-1">
                      {variants.length > 0 ? (
                        variants.map(({ name, url }, i) => (
                          <div
                            className="flex items-center group hover:bg-blue-50 p-1 rounded cursor-pointer"
                            key={i}
                          >
                            {editingVariant &&
                            editingVariant.channelIndex === index &&
                            editingVariant.variantIndex === i ? (
                              <div className="space-y-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Channel name"
                                  className="py-1 text-sm"
                                />
                                <Input
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  placeholder="https://example.com"
                                  className="py-1 text-sm"
                                />
                                {urlError && (
                                  <p className="text-red-600 text-sm mt-1">
                                    {urlError}
                                  </p>
                                )}
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleEditSave}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleEditCancel}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p
                                  key={i}
                                  className="text-gray-700"
                                  onClick={() => {
                                    setEditingVariant({
                                      channelIndex: index,
                                      variantIndex: i,
                                    });
                                    setEditName(name);
                                    setEditUrl(url);
                                  }}
                                >
                                  {name}
                                </p>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600"
                                >
                                  <LinkIcon className="h-3 w-3 ml-1" />
                                </a>
                              </>
                            )}

                            <AlertDialog
                              open={
                                channelToDelete?.channelIndex === index &&
                                channelToDelete?.variantIndex === i
                              }
                              onOpenChange={(open) =>
                                !open && setChannelToDelete(null)
                              }
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                  onClick={() =>
                                    setChannelToDelete({
                                      channelIndex: index,
                                      variantIndex: i,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete channel
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the "
                                    {channelType}" channel? This action cannot
                                    be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleRemoveChannel(index)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No variants</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                  <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                    <ChannelsIcon className="h-12 w-12 mx-auto text-blue-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    No channel yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add your first channel to get started
                  </p>
                  <Button
                    onClick={() => setShowNewChannelForm(true)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add First Channel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerChannelsPage;
