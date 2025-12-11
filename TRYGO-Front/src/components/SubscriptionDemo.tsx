import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Crown, MessageCircle, FolderOpen, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import useSubscription from '../hooks/use-subscription';
import UpgradeModal from './UpgradeModal';

const SubscriptionDemo: React.FC = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {
    currentPlan,
    subscription,
    assistantMessages,
    canSendMessage,
    canCreateProject,
    canCreateHypothesis,
    hasFeatureAccess,
    isTrialExpired,
    needsUpgrade,
    isSubscriptionActive
  } = useSubscription();

  const testFeatures = [
    {
      name: 'Send AI message',
      check: () => canSendMessage(),
      action: 'send-message'
    },
    {
      name: 'Create new project',
      check: () => canCreateProject(1), // Assuming 1 current project
      action: 'create-project'
    },
    {
      name: 'Create hypothesis',
      check: () => canCreateHypothesis(2), // Assuming 2 current hypotheses
      action: 'create-hypothesis'
    },
    {
      name: 'Full ICP access',
      check: () => hasFeatureAccess('icp'),
      action: 'icp-access'
    },
    {
      name: 'Interview analysis',
      check: () => hasFeatureAccess('validation'),
      action: 'validation-access'
    },
    {
      name: 'GTM channel access',
      check: () => hasFeatureAccess('gtm-channel'),
      action: 'gtm-access'
    },
    {
      name: 'Market research',
      check: () => hasFeatureAccess('research'),
      action: 'research-access'
    },
    {
      name: 'Packing analysis',
      check: () => hasFeatureAccess('packing'),
      action: 'packing-access'
    }
  ];

  const handleTestAction = (action: string, canPerform: boolean) => {
    if (!canPerform) {
      setShowUpgradeModal(true);
    } else {
      alert(`Action "${action}" is allowed for your plan!`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-orange-600" />
            Subscription System Demo
          </CardTitle>
          <CardDescription>
            Testing subscription limits and access functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Plan Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Current Plan: {currentPlan}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="mt-1">
                    {isSubscriptionActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Trial expired:</span>
                  <div className="mt-1">
                    {isTrialExpired ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">No</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Needs upgrade:</span>
                  <div className="mt-1">
                    {needsUpgrade ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">No</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">AI messages:</span>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {assistantMessages?.generatedMessages || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Tests */}
            <div>
              <h4 className="font-semibold mb-3">Feature Testing:</h4>
              <div className="grid gap-2">
                {testFeatures.map((feature, index) => {
                  const canPerform = feature.check();
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {canPerform ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={canPerform ? 'text-green-700' : 'text-red-700'}>
                          {feature.name}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={canPerform ? "default" : "destructive"}
                        onClick={() => handleTestAction(feature.action, canPerform)}
                      >
                        {canPerform ? 'Test' : 'Upgrade'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="test feature"
        reason="This feature is not available for your current plan. Upgrade your plan to get access."
      />
    </div>
  );
};

export default SubscriptionDemo;
