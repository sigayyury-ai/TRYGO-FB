import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import AIAssistantChat from "@/components/AIAssistantChat";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";
import LoaderSpinner from "@/components/LoaderSpinner";
import { ProjectHypothesis } from "@/api/getProjectHypotheses";
import {
  useSocketStore,
  ProjectHypothesisGeneratedEvent,
} from "@/store/useSocketStore";
import Cookies from "js-cookie";
import { useHypothesesPersonProfileStore } from "@/store/useHypothesesPersonProfileStore";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

const Hypotheses: FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHypothesis, setEditingHypothesis] =
    useState<ProjectHypothesis | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const { activeProject } = useProjects();
  const projectId = useSocketStore((state) => state.projectId);
  const {
    hypotheses,
    activeHypothesis,
    loading: hypothesesLoading,
    loadHypotheses,
    setActiveHypothesis,
    changeHypothesis,
    deleteHypothesis,
  } = useHypotheses({ projectId: activeProject?.id });

  const {
    generateProjectHypothesis,
    isLoading,
    error,
    socket,
    isConnected,
  } = useSocketStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    // Hypotheses are automatically loaded by useHypotheses hook when projectId changes
  }, [activeProject]);

  // useEffect(() => {
  //   if (projectId) {
  //     getHypotheses(projectId);
  //   }
  // }, [])

  // Socket is initialized in App.tsx after authentication
  // This component only sets up event listeners
  useEffect(() => {
    if (!socket) {
      // Socket not initialized yet, wait for it
      return;
    }

    // Set up event listeners for this component
    const handleProjectHypothesisGenerated = () => {
      // Event handling is done in useSocketStore
    };

    socket.on("projectHypothesisGenerated", handleProjectHypothesisGenerated);

    return () => {
      if (socket) {
        socket.off("projectHypothesisGenerated", handleProjectHypothesisGenerated);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]); // Re-setup listeners if socket changes

  useEffect(() => {
    if (!socket) return;

    const handleHypothesisGenerated = (
      data: ProjectHypothesisGeneratedEvent
    ) => {
      setIsGenerating(false);

      if (activeProject?.id) {
        getHypotheses(activeProject.id);
        toast({
          title: "Hypothesis generated!",
          description: "Your hypothesis is ready",
        });
      }
    };

    socket.on("projectHypothesisGenerated", handleHypothesisGenerated);

    return () => {
      socket.off("projectHypothesisGenerated", handleHypothesisGenerated);
    };
  }, [socket, activeProject, getHypotheses, toast]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Socket error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeProject) {
      toast({
        title: "Error",
        description: "No active project selected",
        variant: "destructive",
      });
      return;
    }

    if (editingHypothesis) {
      try {
        await changeHypothesis({
          id: editingHypothesis.id,
          title: values.title,
          description: values.description,
        });

        toast({
          title: "Hypothesis updated",
          description: `"${values.title}" has been updated.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update hypothesis",
          variant: "destructive",
        });
      } finally {
        setIsAddDialogOpen(false);
        setEditingHypothesis(null);
        form.reset();
      }
    } else {
      try {
        setIsGenerating(true);

        generateProjectHypothesis({
          title: values.title,
          description: values.description,
          projectId: activeProject.id,
        });

        toast({
          title: "Hypothesis generating",
          description: "Your hypothesis is being generated...",
        });

        setIsAddDialogOpen(false);
        form.reset();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to generate hypothesis",
          variant: "destructive",
        });
        setIsGenerating(false);
      } finally {
        // setIsGenerating(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (activeHypothesis?.id === id) {
        toast({
          title: "Cannot delete active hypothesis",
          description: "Please activate another hypothesis first.",
          variant: "destructive",
        });
        return;
      }

      await deleteHypothesis(id);
      toast({
        title: "Hypothesis deleted",
        description: "The hypothesis has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete hypothesis",
        variant: "destructive",
      });
    }
  };

  const handleSetActive = (id: string) => {
    // Сбрасываем selectedSegmentId при смене гипотезы
    const { setActiveCustomerSegmentId } = require('@/utils/activeState');
    setActiveCustomerSegmentId(null);
    setActiveHypothesis(id);
    toast({
      title: "Hypothesis activated",
      description: "This hypothesis is now active across all pages.",
    });
    navigate("/dashboard");
  };

  const handleEdit = (hypothesis: ProjectHypothesis) => {
    setEditingHypothesis(hypothesis);
    form.setValue("title", hypothesis.title);
    form.setValue("description", hypothesis.description);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
     
      <motion.main
        className="container mx-auto px-4 py-8 pt-24 max-w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            className="text-4xl font-bold text-blue-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hypotheses Management
          </motion.h1>
          <Button
            onClick={() => {
              setEditingHypothesis(null);
              form.reset();
              setIsAddDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
            id="hypothesis-add"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Hypothesis
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {hypotheses.map((hypothesis, index) => (
            <motion.div
              key={hypothesis.id}
              id={index === 0 ? "hypothesis-card" : undefined}
            >
              <Card
                className={`shadow-md hover:shadow-lg transition-all duration-300 ${
                  activeHypothesis?.id === hypothesis.id
                    ? "border-blue-500 border-2"
                    : ""
                }`}
              >
                <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
                  <CardTitle className="text-xl font-bold text-blue-900">
                    {hypothesis.title}
                    {activeHypothesis?.id === hypothesis.id && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Selected
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {new Date(hypothesis.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{hypothesis.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between bg-gray-50 rounded-b-lg border-t border-gray-100 p-4">
                  <div className="flex space-x-2">
                    <Button
                      // variant='outline'
                      size="sm"
                      className="text-blue-600 bg-transparent hover:bg-blue-50"
                      onClick={() => handleEdit(hypothesis)}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      className="text-red-600 bg-transparent hover:bg-red-50"
                      onClick={() => handleDelete(hypothesis.id)}
                      disabled={activeHypothesis?.id === hypothesis.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                  {activeHypothesis?.id !== hypothesis.id && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        handleSetActive(hypothesis.id);
                      }}
                      id={index === 6 ? "hypothesis-select" : undefined}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Select
                    </Button>
                  )}
                  {activeHypothesis?.id === hypothesis.id && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate("/dashboard")}
                      id='hypothesis-select'
                    >
                      <ArrowRight className="h-4 w-4 mr-1" /> View Canvas
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Dialog for editing hypothesis */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingHypothesis ? "Edit Hypothesis" : "Add New Hypothesis"}
              </DialogTitle>
              <DialogDescription>
                {editingHypothesis
                  ? "Make changes to your hypothesis here."
                  : "Create a new product or market hypothesis."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a clear title for your hypothesis"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your hypothesis in detail"
                          rows={4}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingHypothesis(null);
                      form.reset();
                    }}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isGenerating}
                  >
                    {isGenerating ? <LoaderSpinner /> : null}
                    {editingHypothesis ? "Update" : "Generate"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.main>

      {hypothesesLoading && (
        <div className="flex justify-center py-10">
          <LoaderSpinner />
        </div>
      )}

      {!hypothesesLoading && hypotheses.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No hypotheses found</p>
          <Button
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Create First Hypothesis
          </Button>
        </div>
      )}

      {/* AI Assistant Chat */}
      <AIAssistantChat />

      {isGenerating && <LoaderSpinner />}
    </div>
  );
};

export default Hypotheses;
