import { itemVariants } from "@/utils/itemVariants";
import { motion } from "framer-motion";
import { BriefcaseBusiness } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import EditableText from "./EditableText";
import { JbtdType } from "@/api/hypothesesPersonProfile";
import { JtbdTitleEnum } from "@/types/JtbdTitleEnum";
import { useToast } from "@/hooks/use-toast";
import { useHypothesesPersonProfileStore } from "@/store/useHypothesesPersonProfileStore";

const JtbdBlock = ({ profile }) => {
  const { updateProfile } = useHypothesesPersonProfileStore();
  const { toast } = useToast();

  const handleJbtdUpdate = (field: keyof JbtdType) => (value: string) => {
    if (!profile) return;

    const { __typename, ...jbtdWithoutTypename } = profile.jbtd;

    updateProfile({
      id: profile.id,
      jbtd: {
        ...jbtdWithoutTypename,
        [field]: value,
      },
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to update JTBD on server",
        variant: "destructive",
      });
    });
  };
  return (
    <div className="mt-20">
      <div className="mb-8">
        <motion.div
          className="flex items-center gap-2 mb-4"
          variants={itemVariants}
        >
          <BriefcaseBusiness className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-blue-900">Jobs To Be Done</h2>
        </motion.div>
        <div className="flex justify-between gap-6">
          {Object.entries(profile.jbtd).map(([key, value], index) => {
            if (key === "__typename") return null;

            return (
              <motion.div
                key={key}
                variants={itemVariants}
                className="flex-1 min-w-[220px] max-w-[700px] mx-1"
              >
                <Card className="border border-gray-200 rounded-2xl hover:shadow-xl transition-all relative group w-500">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2 text-blue-800">
                      {JtbdTitleEnum[key]}
                    </h3>
                    <EditableText
                      initialText={String(value)}
                      onTextChange={handleJbtdUpdate(key as keyof JbtdType)}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JtbdBlock;
