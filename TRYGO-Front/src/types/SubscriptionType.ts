export enum SubscriptionType {
  STARTER = 'STARTER',
  PRO = 'PRO'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  TRIALING = 'TRIALING',
  OPEN = 'OPEN',
  INACTIVE = 'INACTIVE'
}

export interface Subscription {
  id: string;
  userId: string;
  price: number;
  status: SubscriptionStatus;
  endDate: string;
  stripeSubscriptionId: string;
  customerId: string;
  startDate: string;
  type: SubscriptionType;
}

export interface AssistantMessages {
  generatedMessages: number;
  userId: string;
  createdAt: string;
}

export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO'
}

export interface PlanLimits {
  maxMessages: number;
  maxProjects: number;
  maxHypotheses: number;
  hasFullAccess: boolean;
  hasIcpFullAccess: boolean;
  hasValidationAnalysis: boolean;
  hasGtmChannelAccess: boolean;
  hasResearchAccess: boolean;
  hasPackingAccess: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    maxMessages: 10,
    maxProjects: 1,
    maxHypotheses: 3,
    hasFullAccess: false,
    hasIcpFullAccess: false,
    hasValidationAnalysis: false,
    hasGtmChannelAccess: false,
    hasResearchAccess: false,
    hasPackingAccess: false
  },
  [PlanType.STARTER]: {
    maxMessages: 50,
    maxProjects: 1,
    maxHypotheses: 5,
    hasFullAccess: true,
    hasIcpFullAccess: true,
    hasValidationAnalysis: false,
    hasGtmChannelAccess: true,
    hasResearchAccess: false,
    hasPackingAccess: true
  },
  [PlanType.PRO]: {
    maxMessages: 300,
    maxProjects: 50,
    maxHypotheses: 50,
    hasFullAccess: true,
    hasIcpFullAccess: true,
    hasValidationAnalysis: true,
    hasGtmChannelAccess: true,
    hasResearchAccess: true,
    hasPackingAccess: true
  }
};
