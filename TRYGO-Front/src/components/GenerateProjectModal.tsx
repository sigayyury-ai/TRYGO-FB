import { FC, useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSocketStore, ProjectStartType } from "@/store/useSocketStore";
import { useToast } from "@/hooks/use-toast";
import LoaderSpinner from "./LoaderSpinner";
import { Globe, PenTool } from "lucide-react";
import useSubscription from "@/hooks/use-subscription";
import UpgradeModal from "./UpgradeModal";
import { useProjectStore } from "@/store/useProjectStore";

const formSchema = z.object({
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

export const GenerateProjectModal: FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startType: ProjectStartType.StartFromScratch,
      info: "",
      url: "",
    },
  });

  const { toast } = useToast();
  const { generateProject, isLoading, projectGenerationError } = useSocketStore();
  const { canCreateProject, currentPlan } = useSubscription();
  const { projects } = useProjectStore();

  // Get current project count
  const currentProjectsCount = projects.length;

  const startType = form.watch("startType");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check project limits
    if (!canCreateProject(currentProjectsCount)) {
      setShowUpgradeModal(true);
      return;
    }

    const isFirstProject = currentProjectsCount === 0;

    try {
      generateProject({
        startType: values.startType,
        info: values.info,
        url: values.url || undefined,
      });

      // Show loading modal if it's the first project
      if (isFirstProject) {
        onClose();
        form.reset();
        setShowLoadingModal(true);
      } else {
        // If not the first project, close modal and show toast
        onClose();
        form.reset();
        toast({
          title: "Project Generation Started",
          description: "Your project is being generated...",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start project generation",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  // Перевіряємо чи є проекти
  const hasProjects = projects.length > 0;

  // Автоматично закриваємо модалку загрузки, коли з'являється перший проект
  useEffect(() => {
    if (showLoadingModal && projects.length > 0) {
      setShowLoadingModal(false);
    }
  }, [showLoadingModal, projects.length]);

  // Обробка помилки генерації проекту
  useEffect(() => {
    if (projectGenerationError && showLoadingModal) {
      // Закриваємо модалку завантаження
      setShowLoadingModal(false);
      
      // Показуємо повідомлення про помилку
      toast({
        title: "Project Generation Failed",
        description: projectGenerationError,
        variant: "destructive",
      });

      // Очищаємо помилку після короткої затримки
      // Якщо це перший проект (projects.length === 0), Dashboard автоматично відкриє модалку GenerateProjectModal
      setTimeout(() => {
        useSocketStore.setState({ projectGenerationError: null });
      }, 500);
    }
  }, [projectGenerationError, showLoadingModal, toast]);

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Якщо немає проектів, не дозволяємо закрити модалку
          if (!hasProjects && !open) {
            return;
          }
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent className="max-w-2xl" showCloseIcon={hasProjects} disableOutsideClose={!hasProjects}>
          <DialogHeader>
            <DialogTitle>Generate New Project</DialogTitle>
            <DialogDescription>
              Create a new project by describing your business idea or importing from a website.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                {hasProjects && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading && <LoaderSpinner />}
                  Generate Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="project creation"
        reason={`You have reached the project limit for the ${currentPlan} plan. Upgrade your plan to create more projects.`}
      />

      <Dialog open={showLoadingModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" showCloseIcon={false} disableOutsideClose={true}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              Don't refresh the page
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              Please wait while the project loads - this may take up to 2 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
