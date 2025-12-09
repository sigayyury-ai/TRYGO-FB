import Header from "@/components/Header";
import { Lock } from "lucide-react";
import { useMutation } from "@apollo/client";
import { CREATE_REQUEST_FEATURE } from "@/api/createRequestFeature";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PitchMaterials = () => {
  const [createRequestFeature, { loading }] = useMutation(CREATE_REQUEST_FEATURE);
  const [isRequested, setIsRequested] = useState(false);

  const handleRequestFeature = async () => {
    try {
      await createRequestFeature({
        variables: {
          requestedFeature: 'PITCH_MATERIALS'
        }
      });
      setIsRequested(true);
    } catch (error) {
      console.error('Error requesting feature:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-research-gradient bg-grid-pattern flex flex-col">

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Lock className="w-12 h-12 text-blue-600" />
            </div>

            <p className="text-blue-700 text-lg max-w-xl mx-auto">
              We are planning to add a Pitch Materials page in Q3 2025
            </p>

            <p className="mt-4 max-w-md mx-auto text-blue-800 text-base leading-relaxed">
              Raise funds with confidence. Instantly generate a pitch deck—our
              AI builds slides using proven YC/500 frameworks, customized for
              your startup.
            </p>

            <div className="mt-8">
              {isRequested ? (
                <p className="text-green-600 text-sm">
                  Feature request submitted successfully!
                </p>
              ) : (
                <Button 
                  onClick={handleRequestFeature}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  {loading ? 'Requesting...' : 'Request Feature'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PitchMaterials;
