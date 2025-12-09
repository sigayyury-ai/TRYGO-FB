import VotingBoard from "@/components/VotingBoard";
import SubscriptionDemo from "@/components/SubscriptionDemo";
import { MessageSquare } from "lucide-react";

const Features = () => {
  return (
    <div className="min-h-screen bg-research-gradient bg-grid-pattern flex flex-col">
      <div className="flex-1 p-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <MessageSquare className="w-12 h-12 text-blue-600" />
            </div>

            <h1 className="text-3xl font-bold text-blue-900 mb-4">
              Feature Requests
            </h1>

            <p className="text-blue-700 text-lg max-w-2xl mx-auto mb-2">
              Help us improve the platform by voting on features and reporting
              bugs
            </p>
          </div>

          <div className="space-y-8">
            {/* <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
              <SubscriptionDemo />
            </div> */}
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
              <VotingBoard slug="trygo" colorMode="light" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
