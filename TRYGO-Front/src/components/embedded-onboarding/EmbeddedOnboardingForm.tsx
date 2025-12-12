import { FC, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectStartType } from "@/store/useSocketStore";
import { submitEmbeddedOnboardingMutation, EmbeddedOnboardingMutationInputType } from "@/api/embeddedOnboarding";
import { Globe, PenTool, Mail } from "lucide-react";
import LoaderSpinner from "../LoaderSpinner";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  startType: z.enum([ProjectStartType.StartFromScratch, ProjectStartType.UrlImport]),
  info: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  url: z.string().optional().or(z.literal("")).refine((val) => {
    if (!val || val === "") return true;
    const urlPattern = /^https?:\/\/.+\..+/i;
    return urlPattern.test(val);
  }, {
    message: "URL must be in format https://example.com",
  }),
}).refine((data) => {
  if (data.startType === ProjectStartType.UrlImport) {
    return data.url && data.url.length > 0;
  }
  return true;
}, {
  message: "URL is required when importing from website",
  path: ["url"],
});

interface EmbeddedOnboardingFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const EmbeddedOnboardingForm: FC<EmbeddedOnboardingFormProps> = ({ 
  onSuccess, 
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      startType: ProjectStartType.StartFromScratch,
      info: "",
      url: "",
    },
  });

  const startType = form.watch("startType");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Get embed source from document referrer if available
      const embedSource = typeof document !== 'undefined' && document.referrer 
        ? document.referrer 
        : undefined;

      const variables: EmbeddedOnboardingMutationInputType = {
        input: {
          email: values.email,
          startType: values.startType,
          info: values.info,
          url: values.url || undefined,
          embedSource,
        },
      };

      const { data } = await submitEmbeddedOnboardingMutation(variables);

      if (data?.submitEmbeddedOnboarding) {
        const response = data.submitEmbeddedOnboarding;

        if (response.success) {
          const message = response.isNewAccount && response.passwordSent
            ? "Account created! Check your email for your password to log in."
            : response.isNewAccount
            ? "Account created! Your project is being generated."
            : "Project creation started! Your project is being generated.";
          
          setSuccessMessage(message);
          form.reset();
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          const errorMsg = response.errorMessage || "An error occurred. Please try again.";
          setErrorMessage(errorMsg);
          
          if (onError) {
            onError(errorMsg);
          }
        }
      } else {
        throw new Error("No response from server");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to submit form. Please try again.";
      setErrorMessage(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Type Selection */}
          <FormField
            control={form.control}
            name="startType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How would you like to start?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value={ProjectStartType.StartFromScratch} id="scratch" />
                      <Label htmlFor="scratch" className="flex items-center gap-2 cursor-pointer">
                        <PenTool className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Start from scratch</div>
                          <div className="text-sm text-gray-500">Describe your business idea</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value={ProjectStartType.UrlImport} id="url" />
                      <Label htmlFor="url" className="flex items-center gap-2 cursor-pointer">
                        <Globe className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Import from website</div>
                          <div className="text-sm text-gray-500">Analyze existing website</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* URL Field (conditional) */}
          {startType === ProjectStartType.UrlImport && (
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Project Description */}
          <FormField
            control={form.control}
            name="info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {startType === ProjectStartType.StartFromScratch 
                    ? "Describe your business idea" 
                    : "Additional information"
                  }
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      startType === ProjectStartType.StartFromScratch
                        ? "Tell us about your business idea, target market, and goals..."
                        : "Any additional context about the website or business..."
                    }
                    className="min-h-[120px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderSpinner />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
