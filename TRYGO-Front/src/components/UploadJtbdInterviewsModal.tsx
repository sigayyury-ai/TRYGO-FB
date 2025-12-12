import { FC, useEffect } from "react";
import LoaderSpinner from "./LoaderSpinner";
import { Button } from "./ui/button";
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
import { Textarea } from "./ui/textarea";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  toggleUploadJtbdInsightsModal,
  useValidationStore,
} from "@/store/useValidationStore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  jtbdInterview: z.string().min(5, {
    message: "Customer Interview insights must be at least 5 characters.",
  }),
});

const UploadJtbdInterviewsModal: FC = () => {
  const isModalOpened = useValidationStore(
    (state) => state.uploadJtbdInsightsModal
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jtbdInterview: "",
    },
  });

  const { toast } = useToast();

  const loading = useValidationStore((state) => state.loading);

  const uploadValidationJtbdInterview = useValidationStore(
    (state) => state.uploadValidationJtbdInterview
  );

  const onSubmit = async (value: z.infer<typeof formSchema>) => {
    try {
      await uploadValidationJtbdInterview(value.jtbdInterview);

      toast({
        title: "JTBD Interview Insight uploaded",
        description: "Your insight has been uploaded!",
      });

      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload insight",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={isModalOpened}
      onOpenChange={(open) => {
        toggleUploadJtbdInsightsModal(open);
        if (!open) form.reset(); // ✅ сброс при закрытии
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New JTBD Interview Insight</DialogTitle>
          <DialogDescription>
            Add a new Jobs-to-be-Done interview insight to your validation data.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="jtbdInterview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JTBD Interview Insight</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the customer interview insight in detail"
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
                  toggleUploadJtbdInsightsModal(false);
                  form.reset();
                }}
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
                Upload
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadJtbdInterviewsModal;
