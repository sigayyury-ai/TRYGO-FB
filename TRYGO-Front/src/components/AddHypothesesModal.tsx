import { FC, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSocketStore } from "@/store/useSocketStore";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/useProjects";
import LoaderSpinner from "./LoaderSpinner";
import useSubscription from "@/hooks/use-subscription";
import UpgradeModal from "./UpgradeModal";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

export const AddHypothesesModal: FC<{
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (value: boolean) => void;
}> = ({ isAddDialogOpen, setIsAddDialogOpen }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  const { toast } = useToast();
  const { canCreateHypothesis, currentPlan } = useSubscription();

  const [isGenerating, setIsGenerating] = useState(false);

  const {
    generateProjectHypothesis,
    isGeneratingHypothesis,
    generatedHypothesisId,
  } = useSocketStore();
  const { activeProject } = useProjects();

  useEffect(() => {
    if (generatedHypothesisId) {
      setIsAddDialogOpen(false);
      form.reset();
    }
  }, [generatedHypothesisId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeProject) {
      toast({
        title: "Error",
        description: "No active project selected",
        variant: "destructive",
      });
      return;
    }

    // Check hypothesis limits
    if (!canCreateHypothesis(hypotheses.length)) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      // setIsGenerating(true);

      generateProjectHypothesis({
        title: values.title,
        description: values.description,
        projectId: activeProject.id,
      });

      toast({
        title: "Hypothesis generating",
        description: "Your hypothesis is being generated...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate hypothesis",
        variant: "destructive",
      });
    } 
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Hypothesis</DialogTitle>
          <DialogDescription>
            Create a new product or market hypothesis.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              // control={form.control}
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
                  form.reset();
                }}
                disabled={isGeneratingHypothesis}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isGeneratingHypothesis}
              >
                {isGeneratingHypothesis && <LoaderSpinner />}
                Generate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="hypothesis creation"
        reason={`You have reached the hypothesis limit for the ${currentPlan} plan. Upgrade your plan to create more hypotheses.`}
      />
    </Dialog>
  );
};
