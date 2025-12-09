import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Crown, Lock } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

interface FeatureUpgradeBlockProps {
  title: string;
  description: string;
  feature: string;
  className?: string;
  children?: React.ReactNode;
}

const FeatureUpgradeBlock: React.FC<FeatureUpgradeBlockProps> = ({
  title,
  description,
  feature,
  className = '',
  children
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <>
      <Card className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
          </div>
        </div>
        
        {/* Blurred content behind */}
        <div className="filter blur-sm pointer-events-none">
          {children}
        </div>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
        reason={`To access ${feature}, upgrade your plan to Starter or Pro.`}
      />
    </>
  );
};

export default FeatureUpgradeBlock;
