import { FC } from "react";
import { EmbeddedOnboardingForm } from "./EmbeddedOnboardingForm";

interface EmbeddedOnboardingWidgetProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const EmbeddedOnboardingWidget: FC<EmbeddedOnboardingWidgetProps> = ({
  onSuccess,
  onError,
}) => {
  return (
    <div className="embedded-onboarding-widget min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Project
          </h1>
          <p className="text-gray-600">
            Describe your business idea and we'll help you get started
          </p>
        </div>
        <EmbeddedOnboardingForm onSuccess={onSuccess} onError={onError} />
      </div>
    </div>
  );
};
