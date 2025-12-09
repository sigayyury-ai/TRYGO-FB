import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { HypothesesGtm, StageType, StatusType } from "@/api/getHypothesesGtm";
import { GtmStatus, GtmTypes } from "@/types/GtmType";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { StageKeyType, useGtmStore } from "@/store/useGtmStore";
import { useNavigate } from "react-router-dom";
import useSubscription from "@/hooks/use-subscription";
import { useState } from "react";
import UpgradeModal from "./UpgradeModal";

const GtmTable = ({ hypothesesGtm }: { hypothesesGtm: HypothesesGtm }) => {
  const navigate = useNavigate();
  const handleChangeStatus = useGtmStore((state) => state.handleChangeStatus);
  const { hasFeatureAccess, currentPlan } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const hasGtmChannelAccess = hasFeatureAccess('gtm-channel');

  const handleViewChannel = (channelId: string, stageKey: string) => {
    if (!hasGtmChannelAccess) {
      setShowUpgradeModal(true);
    } else {
      navigate(`/gtm/${channelId}?key=${stageKey}`);
    }
  };

  const stages: { stageKey: StageKeyType; stage: StageType }[] = [
    { stageKey: "stageValidate", stage: hypothesesGtm.stageValidate },
    { stageKey: "stageBuildAudience", stage: hypothesesGtm.stageBuildAudience },
    { stageKey: "stageScale", stage: hypothesesGtm.stageScale },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">GTM Channels</h2>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-blue-50/50">
            <TableHead className="w-[120px]">Stage</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>KPI</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map(({ stageKey, stage }) =>
            stage.channels.map((channel, index) => {

              return (
                <TableRow
                  key={channel.id}
                  className="hover:bg-blue-50/50 group"
                >
                  {index === 0 && (
                    <TableCell
                      className="font-medium bg-white group-hover:bg-white"
                      rowSpan={stage.channels.length}
                    >
                      {stage.name}
                    </TableCell>
                  )}
                  <TableCell>{channel.name}</TableCell>
                  <TableCell>{GtmTypes[channel.type]}</TableCell>
                  <TableCell>{channel.description}</TableCell>
                  <TableCell>{channel.kpis}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={channel.status}
                      onValueChange={(newValue) => {
                        handleChangeStatus(
                          stageKey,
                          channel.id,
                          newValue as StatusType
                        );
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNED">Planned</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewChannel(channel.id, stageKey)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="GTM channel details"
        reason={`You have reached the GTM channel access limit for the ${currentPlan} plan. Upgrade your plan to view detailed channel information.`}
      />
    </div>
  );
};

export default GtmTable;
