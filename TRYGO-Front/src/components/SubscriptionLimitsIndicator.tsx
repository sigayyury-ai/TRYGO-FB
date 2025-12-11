import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Crown, MessageCircle, FolderOpen, Lightbulb } from 'lucide-react';
import useSubscription from '../hooks/use-subscription';
import { PLAN_LIMITS } from '../types/SubscriptionType';

const SubscriptionLimitsIndicator: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlan, assistantMessages } = useSubscription();
  const limits = PLAN_LIMITS[currentPlan];

  const handlePlanClick = () => {
    navigate('/settings');
  };

  if (currentPlan === 'PRO') {
    return null; // Don't show limits for Pro users
  }

  const messageUsage = assistantMessages?.generatedMessages || 0;
  const messageLimit = limits.maxMessages;
  const isNearMessageLimit = messageUsage >= messageLimit * 0.8;
  const isAtMessageLimit = messageUsage >= messageLimit;

  return (
    <div className="flex items-center gap-2 text-sm">
      {currentPlan === 'FREE' && (
        <Badge 
          variant="outline" 
          className="text-orange-600 border-orange-200 cursor-pointer hover:bg-orange-50 transition-colors"
          onClick={handlePlanClick}
        >
          <Crown className="w-3 h-3 mr-1" />
          Free Trial
        </Badge>
      )}
      
      {currentPlan === 'STARTER' && (
        <Badge 
          variant="outline" 
          className="text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors"
          onClick={handlePlanClick}
        >
          <Crown className="w-3 h-3 mr-1" />
          Starter
        </Badge>
      )}
{/* 
      <Badge 
        variant={isAtMessageLimit ? "destructive" : isNearMessageLimit ? "secondary" : "outline"}
        className="flex items-center gap-1"
      >
        <MessageCircle className="w-3 h-3" />
        {messageUsage}/{messageLimit}
      </Badge>

      <Badge variant="outline" className="flex items-center gap-1">
        <FolderOpen className="w-3 h-3" />
        1/{limits.maxProjects}
      </Badge>

      <Badge variant="outline" className="flex items-center gap-1">
        <Lightbulb className="w-3 h-3" />
        Max. {limits.maxHypotheses}
      </Badge> */}
    </div>
  );
};

export default SubscriptionLimitsIndicator;
