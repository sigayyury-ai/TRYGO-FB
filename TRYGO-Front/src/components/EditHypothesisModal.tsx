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
import { useToast } from "@/hooks/use-toast";
import LoaderSpinner from "./LoaderSpinner";
import { useProjects } from "@/hooks/useProjects";
import { useHypotheses } from "@/hooks/useHypotheses";
import { ProjectHypothesis } from "@/api/getProjectHypotheses";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

interface EditHypothesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  hypothesis: ProjectHypothesis | null;
}

export const EditHypothesisModal: FC<EditHypothesisModalProps> = ({
  isOpen,
  onClose,
  hypothesis,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { activeProject } = useProjects();
  const { changeHypothesis, deleteHypothesis, loading } = useHypotheses({ projectId: activeProject?.id });

  // Update form values when hypothesis changes
  useEffect(() => {
    if (hypothesis) {
      form.reset({
        title: hypothesis.title,
        description: hypothesis.description,
      });
    }
  }, [hypothesis, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!hypothesis) {
      return;
    }

    try {
      await changeHypothesis({
        id: hypothesis.id,
        title: values.title,
        description: values.description,
      });

      toast({
        title: "Success",
        description: "Hypothesis updated successfully",
      });

      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update hypothesis";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!hypothesis) return;

    try {
      await deleteHypothesis(hypothesis.id);

      toast({
        title: "Success",
        description: "Hypothesis deleted successfully",
      });

      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete hypothesis";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Hypothesis</DialogTitle>
            <DialogDescription>
              Update the title and description of your hypothesis.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading && <LoaderSpinner />}
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              hypothesis "{hypothesis?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
