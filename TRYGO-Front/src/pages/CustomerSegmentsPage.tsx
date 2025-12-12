import { FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Users, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import RegenerateHypothesesCoreForm from "@/components/RegenerateHypothesesCoreForm";
import { useToast } from "@/hooks/use-toast";
import { useHypothesesCoreStore } from "@/store/useHypothesesCoreStore";
import { useHypothesesPersonProfileStore } from "@/store/useHypothesesPersonProfileStore";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";

interface CustomerSegment {
  name: string;
  description: string;
  id?: string;
}

const CustomerSegmentsPage: FC = () => {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [editingSegment, setEditingSegment] = useState<{
    index: number;
    field: "name" | "description";
  } | null>(null);
  const [segmentToDelete, setSegmentToDelete] = useState<number | null>(null);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentDescription, setNewSegmentDescription] = useState("");
  const [showNewSegmentForm, setShowNewSegmentForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { activeProject } = useProjects();
  const { activeHypothesis } = useHypotheses({ projectId: activeProject?.id });
  const { coreData, changeHypothesesCore, getHypothesesCore } = useHypothesesCoreStore();

  // Загружаем coreData при изменении активной гипотезы
  useEffect(() => {
    if (activeHypothesis?.id) {
      getHypothesesCore(activeHypothesis.id);
    }
  }, [activeHypothesis?.id, getHypothesesCore]);

  useEffect(() => {
    if (coreData.customerSegments) {
      setSegments(coreData.customerSegments);
    } else {
      setSegments([]);
    }
  }, [coreData?.customerSegments]);

  const handleSegmentChange = (
    index: number,
    field: "name" | "description",
    value: string
  ) => {
    const updatedSegments = [...segments];
    updatedSegments[index] = {
      ...updatedSegments[index],
      [field]: value,
    };
    setSegments(updatedSegments);
  };


  const handlSaveSegments = (updatedSegments: CustomerSegment[]) => {
    if (!coreData?.id) return;


    const updatedData = {
      id: coreData.id,
      problems: coreData.problems,
      solutions: coreData.solutions,
      uniqueProposition: coreData.uniqueProposition,
      keyMetrics: coreData.keyMetrics,
      unfairAdvantages: coreData.unfairAdvantages,
      channels: coreData.channels,
      customerSegments: updatedSegments,
      costStructure: coreData.costStructure,
      revenueStream: coreData.revenueStream,
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

  const handleDeleteSegment = (index: number) => {
    const updatedSegments = segments.filter((_, i) => i !== index);
    setSegments(updatedSegments);
    setSegmentToDelete(null);

    handlSaveSegments(updatedSegments);
  };

  const handleAddSegment = () => {
    if (newSegmentName.trim()) {
      const newSegment = {
        name: newSegmentName.trim(),
        description: newSegmentDescription.trim(),
      };

      const updatedSegments = [...segments, newSegment];
      setSegments(updatedSegments);

      setNewSegmentName("");
      setNewSegmentDescription("");
      setShowNewSegmentForm(false);

      handlSaveSegments(updatedSegments);
    }
  };

  const handleOpenICP = (segmentId: string) => {
    const { setSelectedCustomerSegmentId } = useHypothesesPersonProfileStore.getState();
    setSelectedCustomerSegmentId(segmentId);
    navigate('/person');
  }

  const handleGoBack = () => {
    navigate(-1);
  };

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
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-500" />
              <h1 className="text-2xl font-bold text-blue-900">
                Customer Segments
              </h1>
            </div>
            <Button
              onClick={() => setShowNewSegmentForm(true)}
              className="bg-blue-500 hover:bg-blue-600"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Segment
            </Button>
          </div>

          {/* Regenerate form */}
          <RegenerateHypothesesCoreForm />

          {showNewSegmentForm && (
            <div className="border border-blue-200 rounded-lg p-4 mb-6 bg-blue-50">
              <h3 className="font-medium text-blue-800 mb-3">
                New Customer Segment
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="segmentName"
                    className="block text-sm font-medium text-blue-700 mb-1"
                  >
                    Segment Name
                  </label>
                  <Input
                    id="segmentName"
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    className="border-blue-300 focus:border-blue-500"
                    placeholder="E.g., Enterprise Customers"
                  />
                </div>
                <div>
                  <label
                    htmlFor="segmentDescription"
                    className="block text-sm font-medium text-blue-700 mb-1"
                  >
                    Description
                  </label>
                  <Textarea
                    id="segmentDescription"
                    value={newSegmentDescription}
                    onChange={(e) => setNewSegmentDescription(e.target.value)}
                    className="border-blue-300 focus:border-blue-500"
                    placeholder="Describe this customer segment..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewSegmentForm(false)}
                    className="border-blue-300 text-blue-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddSegment}
                    disabled={!newSegmentName.trim()}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Add Segment
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {segments.length > 0 ? (
              segments.map((segment, index) => (
                <div
                  key={segment.id || index}
                  className="border border-gray-200 rounded-lg p-4 relative bg-white"
                >
                  {editingSegment &&
                  editingSegment.index === index &&
                  editingSegment.field === "name" ? (
                    <Textarea
                      value={segment.name}
                      onChange={(e) =>
                        handleSegmentChange(index, "name", e.target.value)
                      }
                      onBlur={() => setEditingSegment(null)}
                      autoFocus
                      className="font-medium text-lg text-blue-600 mb-2 border-blue-300 focus:border-blue-500"
                    />
                  ) : (
                    <h4
                      className="font-medium text-lg text-blue-600 mb-2 cursor-pointer hover:bg-blue-50 p-1 rounded"
                      onClick={() =>
                        setEditingSegment({ index, field: "name" })
                      }
                    >
                      {segment.name}
                    </h4>
                  )}

                  {editingSegment &&
                  editingSegment.index === index &&
                  editingSegment.field === "description" ? (
                    <Textarea
                      value={segment.description}
                      onChange={(e) =>
                        handleSegmentChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      onBlur={() => setEditingSegment(null)}
                      autoFocus
                      className="text-gray-700 border-blue-300 focus:border-blue-500"
                    />
                  ) : (
                    <p
                      className="text-gray-700 cursor-pointer hover:bg-blue-50 p-1 rounded"
                      onClick={() =>
                        setEditingSegment({ index, field: "description" })
                      }
                    >
                      {segment.description}
                    </p>
                  )}

                  <div className="absolute top-2 right-2 flex space-x-2">
                    <Button
                      onClick={() => handleOpenICP(segment.id)}
                      className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
                    >
                      <User className="h-4 w-4 " />
                      Open ICP
                    </Button>

                    <AlertDialog
                      open={segmentToDelete === index}
                      onOpenChange={(open) => !open && setSegmentToDelete(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => setSegmentToDelete(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete segment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{segment.name}"
                            segment? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteSegment(index)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <Users className="h-12 w-12 mx-auto text-blue-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  No customer segments yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Add your first customer segment to get started
                </p>
                <Button
                  onClick={() => setShowNewSegmentForm(true)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add First Segment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSegmentsPage;
