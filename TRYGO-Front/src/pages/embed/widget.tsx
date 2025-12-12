import { FC } from "react";
import { EmbeddedOnboardingWidget } from "@/components/embedded-onboarding/EmbeddedOnboardingWidget";

/**
 * Standalone widget page for iframe embedding
 * This page is designed to be embedded on external websites
 * CSS is isolated to prevent conflicts with host page styling
 */
const EmbedWidgetPage: FC = () => {
  return (
    <div className="embed-widget-page" style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      isolation: 'isolate', // CSS isolation
    }}>
      {/* CSS Reset for widget isolation */}
      <style>{`
        .embed-widget-page * {
          box-sizing: border-box;
        }
        .embed-widget-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
      <EmbeddedOnboardingWidget />
    </div>
  );
};

export default EmbedWidgetPage;
