// import { Alert, AlertDescription } from "@/components/ui/alert";

export const SubscriptionBanner = () => {
  // TODO: Implement entitlement check
  // For now, return null (no banner shown)
  // Later: Check user entitlement status and show appropriate banner
  
  return null;
  
  // Example implementation (commented out):
  // const entitlementStatus = useSeoAgentEntitlement(); // Hook to be created
  
  // if (entitlementStatus === 'pending') {
  //   return (
  //     <Alert className="bg-yellow-50 border-yellow-200">
  //       <AlertDescription>
  //         Your SEO Agent add-on is pending activation. You'll receive access within 24 hours.
  //       </AlertDescription>
  //     </Alert>
  //   );
  // }
  
  // if (entitlementStatus === 'lapsed') {
  //   return (
  //     <Alert className="bg-red-50 border-red-200">
  //       <AlertDescription>
  //         SEO Agent access paused. Update payment to resume.
  //       </AlertDescription>
  //     </Alert>
  //   );
  // }
  
  // return null;
};

