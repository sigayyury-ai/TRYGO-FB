import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Check, Crown, Zap } from 'lucide-react';
import useSubscription from '../hooks/use-subscription';

interface SubscriptionExpiredModalProps {
  isOpen: boolean;
  type: 'trial-expired' | 'subscription-inactive';
}

const SubscriptionExpiredModal: React.FC<SubscriptionExpiredModalProps> = ({
  isOpen,
  type
}) => {
  const { handleUpgrade, isLoading, currentPlan } = useSubscription();

  const handleSelectPlan = async (planType: 'STARTER' | 'PRO') => {
    try {
      await handleUpgrade(planType);
    } catch (error) {
      // Silent error handling
    }
  };

  const getTitle = () => {
    return type === 'trial-expired' 
      ? 'Your free trial has expired' 
      : 'Active subscription required';
  };

  const getDescription = () => {
    return type === 'trial-expired'
      ? 'To continue using all platform features, please choose one of our subscription plans.'
      : 'Your subscription is inactive. Please update your payment information or choose a new plan.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {getDescription()}
          </DialogDescription>
          <div className="text-center mt-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
              Current plan: <span className="font-semibold ml-1">{currentPlan}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Starter Plan */}
          <Card className="relative border-2 hover:border-blue-500 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-xl">Starter</CardTitle>
              </div>
              <CardDescription>
                Perfect for startups and small teams
              </CardDescription>
              <div className="text-3xl font-bold">
                $10<span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>30 AI assistant messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>1 project</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Up to 5 hypotheses per project</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Full access to all features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Interview analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>GTM channel access</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handleSelectPlan('STARTER')}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Choose Starter'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-orange-500 hover:border-orange-600 transition-colors">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Recommended
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-xl">Pro</CardTitle>
              </div>
              <CardDescription>
                For growing teams and serious projects
              </CardDescription>
              <div className="text-3xl font-bold">
                $20<span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>100 AI assistant messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>5 projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Up to 10 hypotheses per project</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Full access to all features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Interview analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>GTM channel access</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600" 
                onClick={() => handleSelectPlan('PRO')}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Choose Pro'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionExpiredModal;
