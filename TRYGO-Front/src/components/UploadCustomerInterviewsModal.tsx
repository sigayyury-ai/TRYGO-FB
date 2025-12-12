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
  toggleUploadCustomerInsightsModal,
  useValidationStore,
} from "@/store/useValidationStore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  customerInterview: z.string().min(5, {
    message: "Customer Interview insights must be at least 5 characters.",
  }),
});

const UploadCustomerInterviewsModal: FC = () => {
  const isModalOpened = useValidationStore(
    (state) => state.uploadCustomerInsightsModal
  );
  const hypothesesValidation = useValidationStore(
    (state) => state.hypothesesValidation
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerInterview: hypothesesValidation?.uploadedCustomerInterviews || "",
    },
  });

  useEffect(() => {
    if (hypothesesValidation?.uploadedCustomerInterviews) {
      form.reset({
        customerInterview: hypothesesValidation.uploadedCustomerInterviews,
      });
    }
  }, [hypothesesValidation?.uploadedCustomerInterviews, form]);


  const { toast } = useToast();

  const loading = useValidationStore((state) => state.loading);

  const uploadValidationCustomerInterview = useValidationStore(
    (state) => state.uploadValidationCustomerInterview
  );

  const onSubmit = async (value: z.infer<typeof formSchema>) => {
    try {
      await uploadValidationCustomerInterview(value.customerInterview);

      toast({
        title: "Customer Interview Insight uploaded",
        description: "Your insight has been uploaded!",
      });

      // form.reset();
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
        toggleUploadCustomerInsightsModal(open);
        // if (open && hypothesesValidation?.uploadedCustomerInterviews) {
        //   form.reset({
        //     customerInterview: hypothesesValidation.uploadedCustomerInterviews,
        //   });
        // } else {
        //   form.reset();
        // }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Customer Interview Insight</DialogTitle>
          <DialogDescription>
            Add a new customer interview insight to your validation data.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="customerInterview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Interview Insight</FormLabel>
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
                  toggleUploadCustomerInsightsModal(false);
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

export default UploadCustomerInterviewsModal;
