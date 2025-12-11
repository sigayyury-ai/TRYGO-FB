import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_SEO_AGENT_CONTEXT = gql`
  query GetSeoAgentContext($projectId: ID!, $hypothesisId: ID) {
    seoAgentContext(projectId: $projectId, hypothesisId: $hypothesisId) {
      projectId
      hypothesisId
      entitlement {
        status
        isActive
        renewalDate
      }
      tokenQuota {
        remaining
        total
        used
      }
      project {
        id
        title
      }
      hypothesis {
        id
        title
        description
      }
      leanCanvas {
        problems
        solutions
        uniqueProposition
      }
      icp {
        goals
        pains
        triggers
      }
    }
  }
`;

export enum EntitlementStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  LAPSED = "LAPSED",
}

export interface EntitlementDto {
  status: EntitlementStatus;
  isActive: boolean;
  renewalDate?: string;
}

export interface TokenQuotaDto {
  remaining: number;
  total: number;
  used: number;
}

export interface ProjectDto {
  id: string;
  title: string;
}

export interface HypothesisDto {
  id: string;
  title: string;
  description?: string;
}

export interface LeanCanvasDto {
  problems: string[];
  solutions: string[];
  uniqueProposition?: string;
}

export interface IcpDto {
  goals: string[];
  pains: string[];
  triggers: string[];
}

export interface SeoAgentContextDto {
  projectId: string;
  hypothesisId?: string;
  entitlement: EntitlementDto;
  tokenQuota: TokenQuotaDto;
  project: ProjectDto;
  hypothesis?: HypothesisDto;
  leanCanvas?: LeanCanvasDto;
  icp?: IcpDto;
}

export interface GetSeoAgentContextResponse {
  seoAgentContext: SeoAgentContextDto;
}

export const getSeoAgentContextQuery = (
  projectId: string,
  hypothesisId?: string
) => {
  return SEO_AGENT_QUERY<GetSeoAgentContextResponse>({
    query: GET_SEO_AGENT_CONTEXT,
    variables: { projectId, hypothesisId },
    fetchPolicy: "network-only",
  });
};

