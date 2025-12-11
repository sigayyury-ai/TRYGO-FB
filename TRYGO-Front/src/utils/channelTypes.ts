import { ChannelType } from "@/api/getHypothesesCore";

export const channelTypes: { label: string; value: ChannelType }[] = [
  { label: "Organic Search", value: "ORGANIC_SEARCH" },
  { label: "Paid Search", value: "PAID_SEARCH" },
  { label: "Organic Social Media", value: "ORGANIC_SOCIAL_MEDIA" },
  { label: "Paid Social Media", value: "PAID_SOCIAL_MEDIA" },
  { label: "Partners", value: "PARTNERS" },
];

export const getChannelTypeLabel = (type: ChannelType) => {
  const found = channelTypes.find((item) => item.value === type);
  return found?.label || type;
};