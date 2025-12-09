
import { useToast, toast } from "@/hooks/use-toast";

// Export the hooks for use throughout the app
export { useToast, toast };

// Add a custom toast style function for blue theme
export const blueToast = (props: Parameters<typeof toast>[0]) => {
  return toast({
    ...props,
    className: `bg-blue-50 border-blue-200 text-blue-900 ${props.className || ''}`,
  });
};
