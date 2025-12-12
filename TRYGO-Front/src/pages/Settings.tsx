import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/useProjects";
import { getProjectAssistantQuery, ProjectAssistant } from "@/api/getProjectAssistant";
import { changeProjectAssistantMutation } from "@/api/changeProjectAssistant";
import LoaderSpinner from "@/components/LoaderSpinner";
import AIAssistantChat from "@/components/AIAssistantChat";
import { Bot, Save, RotateCcw, Crown, CreditCard, Calendar, CheckCircle, XCircle, Ticket } from "lucide-react";
import useSubscription from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { activatePromoCode } from "@/api/activatePromoCode";
import { getPromoCodeInfo } from "@/api/getPromoCodeInfo";

const formSchema = z.object({
  systemInstruction: z.string().min(10, {
    message: "System instruction must be at least 10 characters.",
  }).max(5000, {
    message: "System instruction must not exceed 5000 characters.",
  }),
});

const Settings: FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [assistant, setAssistant] = useState<ProjectAssistant | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [promoCodeInfo, setPromoCodeInfo] = useState<any>(null);
  const [checkingPromoCode, setCheckingPromoCode] = useState(false);
  const { toast } = useToast();
  const { activeProject } = useProjects();
  const { 
    subscription, 
    currentPlan, 
    assistantMessages,
    isSubscriptionActive,
    handleManageSubscription,
    handleUpgrade,
    refreshSubscription,
    refreshMessages
  } = useSubscription();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemInstruction: "",
    },
  });

  const defaultInstruction = `You are a helpful AI assistant for marketing. 

Your role is to:
- Help analyze market research data
- Provide insights on customer segments and personas
- Assist with hypothesis validation
- Support go-to-market strategy development
- Offer guidance on lean canvas methodology

Please be concise, actionable, and focus on practical business advice. Always ask clarifying questions when needed to provide the most relevant assistance.`;

  // Fetch current assistant settings
  useEffect(() => {
    const fetchAssistant = async () => {
      if (!activeProject?.id) return;

      try {
        setFetchLoading(true);
        const { data } = await getProjectAssistantQuery(activeProject.id);
        
        if (data.getProjectAssistant) {
          setAssistant(data.getProjectAssistant);
          form.reset({
            systemInstruction: data.getProjectAssistant.systemInstruction || defaultInstruction,
          });
        } else {
          form.reset({
            systemInstruction: defaultInstruction,
          });
        }
      } catch (error) {
        form.reset({
          systemInstruction: defaultInstruction,
        });
        toast({
          title: "Warning",
          description: "Could not load current settings. Using default instruction.",
          variant: "default",
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAssistant();
  }, [activeProject?.id, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeProject?.id) {
      toast({
        title: "Error",
        description: "No active project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      await changeProjectAssistantMutation({
        input: {
          projectId: activeProject.id,
          systemInstruction: values.systemInstruction,
        },
      });

      toast({
        title: "Success",
        description: "AI Assistant settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update AI Assistant settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.reset({
      systemInstruction: defaultInstruction,
    });
  };

  const handleSubscriptionManagement = async () => {
    try {
      await handleManageSubscription();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription management page",
        variant: "destructive",
      });
    }
  };

  const handleUpgradeClick = async (planType: 'STARTER' | 'PRO') => {
    try {
      await handleUpgrade(planType);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payment session",
        variant: "destructive",
      });
    }
  };

  const handleCheckPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    try {
      setCheckingPromoCode(true);
      const info = await getPromoCodeInfo(promoCode.trim());
      setPromoCodeInfo(info);
      
      if (info.isValid) {
        toast({
          title: "Valid Promo Code",
          description: info.message || `This code gives you ${info.subscriptionType} subscription for ${info.durationMonths} months`,
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: info.message || "This promo code is not valid",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check promo code",
        variant: "destructive",
      });
      setPromoCodeInfo(null);
    } finally {
      setCheckingPromoCode(false);
    }
  };

  const handleActivatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    try {
      setPromoCodeLoading(true);
      console.log('[Settings] Activating promo code:', promoCode.trim());
      const result = await activatePromoCode(promoCode.trim());
      console.log('[Settings] Promo code activation result:', result);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message || "Promo code activated successfully",
        });
        setPromoCode("");
        setPromoCodeInfo(null);
        // Refresh subscription data - reset initialization flags to force refresh
        console.log('[Settings] Refreshing subscription after promo code activation...');
        await refreshSubscription();
        // Also refresh messages count
        await refreshMessages();
        console.log('[Settings] Subscription refreshed after promo code activation');
      } else {
        console.error('[Settings] Promo code activation failed:', result.message);
        toast({
          title: "Error",
          description: result.message || "Failed to activate promo code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[Settings] Error activating promo code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to activate promo code",
        variant: "destructive",
      });
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'TRIALING':
        return <Badge className="bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" />Trial</Badge>;
      case 'PAST_DUE':
      case 'UNPAID':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Payment Required</Badge>;
      case 'CANCELED':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanName = (type: string) => {
    switch (type) {
      case 'STARTER':
        return 'Starter';
      case 'PRO':
        return 'Pro';
      default:
        return 'Free';
    }
  };

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoaderSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 bg-grid-pattern">
      <div className="px-4 py-8 pt-24 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
      </div>

      {/* Subscription Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-orange-600" />
            Subscription & Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and view your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Plan Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">Current Plan: {getPlanName(currentPlan)}</h3>
                {subscription && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Status: {getStatusBadge(subscription.status)}</span>
                    {subscription.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Until: {format(new Date(subscription.endDate), 'dd MMMM yyyy')}
                      </span>
                    )}
                    <span>${subscription.price}/month</span>
                  </div>
                )}
              </div>
              {subscription && isSubscriptionActive && (
                <Button 
                  variant="outline" 
                  onClick={handleSubscriptionManagement}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Manage Subscription
                </Button>
              )}
            </div>

            {/* Usage Stats */}
            {assistantMessages && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">AI Messages</h4>
                  <p className="text-2xl font-bold text-blue-700">
                    {assistantMessages.generatedMessages}
                    <span className="text-sm font-normal text-blue-600">
                      /{currentPlan === 'FREE' ? '10' : currentPlan === 'STARTER' ? '50' : '300'}
                    </span>
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Projects</h4>
                  <p className="text-2xl font-bold text-green-700">
                    1<span className="text-sm font-normal text-green-600">
                      /{currentPlan === 'PRO' ? '50' : '1'}
                    </span>
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Hypotheses per project</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    Max. {currentPlan === 'FREE' ? '3' : currentPlan === 'STARTER' ? '5' : '50'}
                  </p>
                </div>
              </div>
            )}

            {/* Upgrade Options */}
            {currentPlan === 'FREE' && (
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">Upgrade your plan</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-semibold">Starter</h5>
                      <Badge variant="outline">$10/month</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">50 messages, 1 project, 5 hypotheses, Packing access</p>
                    <Button 
                      onClick={() => handleUpgradeClick('STARTER')}
                      className="w-full"
                      size="sm"
                    >
                      Choose Starter
                    </Button>
                  </div>
                  <div className="p-4 border border-orange-200 rounded-lg hover:border-orange-500 transition-colors bg-orange-50">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-semibold">Pro</h5>
                      <Badge className="bg-orange-500">$20/month</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">300 messages, 50 projects, 50 hypotheses, Full access</p>
                    <Button 
                      onClick={() => handleUpgradeClick('PRO')}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      size="sm"
                    >
                      Choose Pro
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promo Code Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-purple-600" />
            Promo Code
          </CardTitle>
          <CardDescription>
            Enter a promo code to activate your subscription without payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code (e.g., PRO1)"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoCodeInfo(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCheckPromoCode();
                  }
                }}
                className="flex-1"
                disabled={promoCodeLoading || checkingPromoCode}
              />
              <Button
                onClick={handleCheckPromoCode}
                variant="outline"
                disabled={!promoCode.trim() || promoCodeLoading || checkingPromoCode}
              >
                {checkingPromoCode ? <LoaderSpinner /> : "Check"}
              </Button>
              <Button
                onClick={handleActivatePromoCode}
                disabled={!promoCode.trim() || !promoCodeInfo?.isValid || promoCodeLoading || checkingPromoCode}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {promoCodeLoading ? <LoaderSpinner /> : "Activate"}
              </Button>
            </div>

            {promoCodeInfo && (
              <div className={`p-4 rounded-lg border ${
                promoCodeInfo.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {promoCodeInfo.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      promoCodeInfo.isValid ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {promoCodeInfo.isValid ? 'Valid Promo Code' : 'Invalid Promo Code'}
                    </p>
                    {promoCodeInfo.isValid && (
                      <p className="text-sm text-green-700 mt-1">
                        {promoCodeInfo.subscriptionType} subscription for {promoCodeInfo.durationMonths} month{promoCodeInfo.durationMonths !== 1 ? 's' : ''}
                      </p>
                    )}
                    {promoCodeInfo.message && (
                      <p className={`text-sm mt-1 ${
                        promoCodeInfo.isValid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {promoCodeInfo.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Have a promo code? Enter it above to activate your subscription instantly.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Assistant Configuration
          </CardTitle>
          <CardDescription>
            Customize how your AI assistant behaves and responds to your queries. 
            These instructions will guide the assistant's responses across all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="systemInstruction"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel>System Instructions</FormLabel> */}
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed instructions for your AI assistant..."
                        className="min-h-[300px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <FormMessage />
                      <span>{field.value?.length || 0}/5000 characters</span>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading && <LoaderSpinner />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Tips for effective instructions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific about the assistant's role and expertise areas</li>
          <li>• Define the tone and communication style you prefer</li>
          <li>• Specify any industry-specific knowledge or terminology</li>
          <li>• Include guidelines for how detailed responses should be</li>
          <li>• Mention any specific methodologies or frameworks to use</li>
        </ul>
      </div>
      </div>
      
      {/* AI Assistant Chat */}
      <AIAssistantChat />
    </div>
  );
};

export default Settings;
