import { CjmItemType, CjmType } from "@/api/hypothesesPersonProfile";
import EditableText from "./EditableText";
import { motion } from "framer-motion";
import { itemVariants } from "@/utils/itemVariants";
import { Map } from "lucide-react";
import { useHypothesesPersonProfileStore } from "@/store/useHypothesesPersonProfileStore";
import { removeTypenameDeep } from "@/utils/removeTypeName";
import { useToast } from "@/hooks/use-toast";

const CjmTable = ({ profile }) => {
  const { updateProfile } = useHypothesesPersonProfileStore();
  const { toast } = useToast();

  const handleCjmdUpdate =
    (stage: keyof CjmType, type: keyof CjmItemType) => (value: string) => {
      if (!profile) return;

      const cleanCjm = removeTypenameDeep(profile.cjm);

      const updatedStage = {
        ...cleanCjm[stage],
        [type]: value,
      };

      const updatedCjm = {
        ...cleanCjm,
        [stage]: updatedStage,
      };

      updateProfile({
        id: profile.id,
        cjm: updatedCjm,
      }).catch(() => {
        toast({
          title: "Error",
          description: "Failed to update Customer Journey Map on server",
          variant: "destructive",
        });
      });
    };

  return (
    <div className="mt-20">
      <motion.div
        className="flex items-center gap-2 mb-4"
        variants={itemVariants}
      >
        <Map className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-blue-900">
          Customer Journey Map
        </h2>
      </motion.div>

      <div className="overflow-auto rounded-lg shadow">
        <table className="min-w-full text-left text-gray-700 border border-gray-300 rounded-lg table-fixed">
          <thead className="bg-blue-50 border-b border-gray-300">
            <tr>
              <th className="w-36 px-4 py-2 font-semibold text-sm">Parts</th>
              <th className="w-36 px-4 py-2 font-semibold text-sm">
                Awareness →
              </th>
              <th className="w-36 px-4 py-2 font-semibold text-sm">
                Consideration →
              </th>
              <th className="w-36 px-4 py-2 font-semibold text-sm">
                Acquisition →
              </th>
              <th className="w-36 px-4 py-2 font-semibold text-sm">
                Service →
              </th>
              <th className="w-36 px-4 py-2 font-semibold text-sm">Loyalty</th>
            </tr>
          </thead>
          <tbody>
            {["opportunities", "barriers"].map((rowKey) => (
              <tr
                key={rowKey}
                className="border-b border-gray-300 last:border-b-0 bg-white"
              >
                <td className="font-semibold px-4 py-2 text-sm text-gray-900 capitalize">
                  {rowKey.charAt(0).toUpperCase() + rowKey.slice(1)}
                </td>
                {[
                  "awareness",
                  "consideration",
                  "acquisition",
                  "service",
                  "loyalty",
                ].map((colKey) => (
                  <td key={colKey} className="px-3 py-2 max-w-xs">
                    <EditableText
                      initialText={profile.cjm?.[colKey]?.[rowKey] || ""}
                      onTextChange={handleCjmdUpdate(
                        colKey as keyof CjmType,
                        rowKey as keyof CjmItemType
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CjmTable;
