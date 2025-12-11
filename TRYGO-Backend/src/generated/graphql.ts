import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
};

export type ActivatePromoCodeResponse = {
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type AddContentIdeaToBacklogInput = {
  contentIdeaId: Scalars['ID']['input'];
  hypothesisId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};

export type ApproveContentItemInput = {
  contentItemId: Scalars['ID']['input'];
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
};

export type AssistantMessages = {
  createdAt: Scalars['Date']['output'];
  generatedMessages: Scalars['Int']['output'];
  userId: Scalars['ID']['output'];
};

export type AuthResponse = {
  token?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserDto>;
};

export type AuthThrowThirdPartyInput = {
  googleIdToken: Scalars['String']['input'];
};

export enum BacklogCategory {
  Benefit = 'BENEFIT',
  Faq = 'FAQ',
  Feature = 'FEATURE',
  Goal = 'GOAL',
  Info = 'INFO',
  Pain = 'PAIN',
  Trigger = 'TRIGGER'
}

export type BacklogIdea = {
  category?: Maybe<BacklogCategory>;
  clusterId?: Maybe<Scalars['ID']['output']>;
  contentType: ContentType;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['ID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  hypothesisId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  projectId: Scalars['ID']['output'];
  scheduledDate?: Maybe<Scalars['DateTime']['output']>;
  status: BacklogStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['ID']['output']>;
};

export type BacklogIdeaInput = {
  category?: InputMaybe<BacklogCategory>;
  clusterId?: InputMaybe<Scalars['ID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
  scheduledDate?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<BacklogStatus>;
  title: Scalars['String']['input'];
};

export enum BacklogStatus {
  Archived = 'ARCHIVED',
  Backlog = 'BACKLOG',
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  Pending = 'PENDING',
  Published = 'PUBLISHED',
  Scheduled = 'SCHEDULED'
}

export type ChangeHypothesesCoreInput = {
  channels?: InputMaybe<Array<ChannelInput>>;
  costStructure?: InputMaybe<Scalars['String']['input']>;
  customerSegments?: InputMaybe<Array<CustomerSegmentInput>>;
  id: Scalars['ID']['input'];
  keyMetrics?: InputMaybe<Array<Scalars['String']['input']>>;
  problems?: InputMaybe<Array<Scalars['String']['input']>>;
  revenueStream?: InputMaybe<Scalars['String']['input']>;
  solutions?: InputMaybe<Array<Scalars['String']['input']>>;
  unfairAdvantages?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  uniqueProposition?: InputMaybe<Scalars['String']['input']>;
};

export type ChangeHypothesesGtmDetailedChannelInput = {
  actionPlan?: InputMaybe<Array<GtmChannelActionPlanInput>>;
  channelPreparationTasks?: InputMaybe<Array<TextIsCompletedInput>>;
  channelStrategy?: InputMaybe<Scalars['String']['input']>;
  contentIdeas?: InputMaybe<Array<GtmChannelContentIdeaInput>>;
  id: Scalars['ID']['input'];
  metricsAndKpis?: InputMaybe<Array<GtmChannelMetricsAndKpisInput>>;
  resources?: InputMaybe<Scalars['String']['input']>;
  tools?: InputMaybe<Scalars['String']['input']>;
};

export type ChangeHypothesesGtmInput = {
  id: Scalars['ID']['input'];
  stageBuildAudience?: InputMaybe<HypothesesGtmStageInput>;
  stageScale?: InputMaybe<HypothesesGtmStageInput>;
  stageValidate?: InputMaybe<HypothesesGtmStageInput>;
};

export type ChangeHypothesesMarketResearchInput = {
  id: Scalars['ID']['input'];
  summary: Scalars['String']['input'];
};

export type ChangeHypothesesPackingInput = {
  id: Scalars['ID']['input'];
  summary: Scalars['String']['input'];
};

export type ChangeHypothesesPersonProfileInput = {
  age?: InputMaybe<Scalars['Int']['input']>;
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  cjm?: InputMaybe<CjmInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  education?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  jbtd?: InputMaybe<JbtdInput>;
  location?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  platforms?: InputMaybe<Array<Scalars['String']['input']>>;
  userGains?: InputMaybe<Array<Scalars['String']['input']>>;
  userGoals?: InputMaybe<Array<Scalars['String']['input']>>;
  userPains?: InputMaybe<Array<Scalars['String']['input']>>;
  userTriggers?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ChangeHypothesesValidationInput = {
  customerInterviewQuestions?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id: Scalars['ID']['input'];
  insightsCustomerInterviews?: InputMaybe<Scalars['String']['input']>;
  summaryInterview?: InputMaybe<SummaryInterviewInput>;
  uploadedCustomerInterviews?: InputMaybe<Scalars['String']['input']>;
};

export type ChangePasswordInput = {
  email: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
  resetCode: Scalars['Int']['input'];
};

export type ChangeProjectAssistantInput = {
  projectId: Scalars['ID']['input'];
  systemInstruction: Scalars['String']['input'];
};

export type ChangeProjectHypothesisInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type Channel = {
  channelType: ChannelType;
  variants: Array<ChannelVariant>;
};

export type ChannelInput = {
  channelType: ChannelType;
  variants: Array<ChannelVariantInput>;
};

export enum ChannelType {
  OrganicSearch = 'ORGANIC_SEARCH',
  OrganicSocialMedia = 'ORGANIC_SOCIAL_MEDIA',
  PaidSearch = 'PAID_SEARCH',
  PaidSocialMedia = 'PAID_SOCIAL_MEDIA',
  Partners = 'PARTNERS'
}

export type ChannelVariant = {
  name: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type ChannelVariantInput = {
  name: Scalars['String']['input'];
  url?: InputMaybe<Scalars['String']['input']>;
};

export type Cjm = {
  acquisition?: Maybe<CjmPart>;
  awareness?: Maybe<CjmPart>;
  consideration?: Maybe<CjmPart>;
  loyalty?: Maybe<CjmPart>;
  service?: Maybe<CjmPart>;
};

export type CjmInput = {
  acquisition?: InputMaybe<CjmPartInput>;
  awareness?: InputMaybe<CjmPartInput>;
  consideration?: InputMaybe<CjmPartInput>;
  loyalty?: InputMaybe<CjmPartInput>;
  service?: InputMaybe<CjmPartInput>;
};

export type CjmPart = {
  barriers?: Maybe<Scalars['String']['output']>;
  opportunities?: Maybe<Scalars['String']['output']>;
};

export type CjmPartInput = {
  barriers?: InputMaybe<Scalars['String']['input']>;
  opportunities?: InputMaybe<Scalars['String']['input']>;
};

export type ClusterInput = {
  hypothesisId: Scalars['ID']['input'];
  intent: SeoClusterIntent;
  keywords: Array<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export enum ContentCategory {
  Benefits = 'BENEFITS',
  Faqs = 'FAQS',
  Goals = 'GOALS',
  Informational = 'INFORMATIONAL',
  Pains = 'PAINS',
  ProductFeatures = 'PRODUCT_FEATURES',
  Triggers = 'TRIGGERS'
}

export enum ContentFormat {
  Article = 'ARTICLE',
  Blog = 'BLOG',
  CommercialPage = 'COMMERCIAL_PAGE',
  LandingPage = 'LANDING_PAGE'
}

export type ContentIdea = {
  backlogIdeaId?: Maybe<Scalars['ID']['output']>;
  category: ContentCategory;
  clusterId?: Maybe<Scalars['ID']['output']>;
  contentType: ContentType;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  dismissed: Scalars['Boolean']['output'];
  hypothesisId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isAddedToBacklog: Scalars['Boolean']['output'];
  isDismissed: Scalars['Boolean']['output'];
  projectId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ContentItem = {
  backlogIdeaId?: Maybe<Scalars['ID']['output']>;
  category: ContentCategory;
  channel?: Maybe<Scalars['String']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['ID']['output']>;
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  format: ContentFormat;
  hypothesisId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  outline?: Maybe<Scalars['String']['output']>;
  ownerId?: Maybe<Scalars['ID']['output']>;
  projectId: Scalars['ID']['output'];
  reviewerId?: Maybe<Scalars['ID']['output']>;
  status: ContentStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['ID']['output']>;
};

export type ContentItemInput = {
  backlogIdeaId?: InputMaybe<Scalars['ID']['input']>;
  category: ContentCategory;
  channel?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['DateTime']['input']>;
  format: ContentFormat;
  hypothesisId: Scalars['ID']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  outline?: InputMaybe<Scalars['String']['input']>;
  ownerId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
  reviewerId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<ContentStatus>;
  title: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};

export enum ContentStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Ready = 'READY'
}

export enum ContentType {
  Article = 'ARTICLE',
  CommercialPage = 'COMMERCIAL_PAGE'
}

export type CreateCustomContentIdeaInput = {
  category: ContentCategory;
  hypothesisId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type CreateHypothesesGtmDetailedChannelInput = {
  customerSegmentId: Scalars['ID']['input'];
  hypothesesGtmChannelId: Scalars['ID']['input'];
  projectHypothesisId: Scalars['ID']['input'];
};

export type CreateSeoAgentBacklogIdeaInput = {
  clusterId?: InputMaybe<Scalars['ID']['input']>;
  contentType: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  status: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CustomerSegment = {
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type CustomerSegmentInput = {
  description: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
};

export type GenerateContentInput = {
  backlogIdeaId: Scalars['ID']['input'];
  hypothesisId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};

export type GenerateHypothesesGtmDetailedChannelContentIdeaInput = {
  customerSegmentId: Scalars['ID']['input'];
  hypothesesGtmChannelId: Scalars['ID']['input'];
};

export type GenerateImageInput = {
  contentItemId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type GenerateTokenThrowEmailInput = {
  email: Scalars['String']['input'];
  jwtSecret: Scalars['String']['input'];
};

export type GetHypothesesGtmDetailedChannelInput = {
  customerSegmentId: Scalars['ID']['input'];
  hypothesesGtmChannelId: Scalars['ID']['input'];
};

export type GtmChannelActionPlan = {
  id: Scalars['ID']['output'];
  isCompleted: Scalars['Boolean']['output'];
  stageTitle: Scalars['String']['output'];
  tasks: Array<TextIsCompleted>;
};

export type GtmChannelActionPlanInput = {
  id: Scalars['ID']['input'];
  isCompleted: Scalars['Boolean']['input'];
  stageTitle: Scalars['String']['input'];
  tasks?: InputMaybe<Array<TextIsCompletedInput>>;
};

export type GtmChannelContentIdea = {
  id: Scalars['ID']['output'];
  text: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type GtmChannelContentIdeaInput = {
  id: Scalars['ID']['input'];
  text: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type GtmChannelMetricsAndKpis = {
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type GtmChannelMetricsAndKpisInput = {
  id: Scalars['ID']['input'];
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type HypothesesCore = {
  channels: Array<Channel>;
  costStructure: Scalars['String']['output'];
  customerSegments: Array<CustomerSegment>;
  id: Scalars['ID']['output'];
  keyMetrics: Array<Scalars['String']['output']>;
  problems: Array<Scalars['String']['output']>;
  projectHypothesisId: Scalars['ID']['output'];
  revenueStream: Scalars['String']['output'];
  solutions: Array<Scalars['String']['output']>;
  threadId: Scalars['String']['output'];
  unfairAdvantages: Array<Scalars['String']['output']>;
  uniqueProposition: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type HypothesesGtm = {
  id: Scalars['ID']['output'];
  projectHypothesisId: Scalars['ID']['output'];
  stageBuildAudience: HypothesesGtmStage;
  stageScale: HypothesesGtmStage;
  stageValidate: HypothesesGtmStage;
  threadId: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type HypothesesGtmChannel = {
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kpis: Scalars['String']['output'];
  name: Scalars['String']['output'];
  status: HypothesesGtmChannelStatus;
  strategy?: Maybe<Scalars['String']['output']>;
  type: HypothesesGtmChannelType;
};

export type HypothesesGtmChannelInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  kpis?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<HypothesesGtmChannelStatus>;
  strategy?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<HypothesesGtmChannelType>;
};

export enum HypothesesGtmChannelStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  Planned = 'PLANNED'
}

export enum HypothesesGtmChannelType {
  OrganicSearch = 'ORGANIC_SEARCH',
  OrganicSocialMedia = 'ORGANIC_SOCIAL_MEDIA',
  PaidSearch = 'PAID_SEARCH',
  PaidSocialMedia = 'PAID_SOCIAL_MEDIA',
  Partners = 'PARTNERS'
}

export type HypothesesGtmDetailedChannel = {
  actionPlan: Array<GtmChannelActionPlan>;
  channelPreparationTasks: Array<TextIsCompleted>;
  channelStrategy: Scalars['String']['output'];
  contentIdeas?: Maybe<Array<GtmChannelContentIdea>>;
  customerSegmentId: Scalars['ID']['output'];
  hypothesesGtmChannelId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  metricsAndKpis: Array<GtmChannelMetricsAndKpis>;
  resources: Scalars['String']['output'];
  tools: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type HypothesesGtmStage = {
  channels: Array<HypothesesGtmChannel>;
  name: Scalars['String']['output'];
};

export type HypothesesGtmStageInput = {
  channels?: InputMaybe<Array<HypothesesGtmChannelInput>>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type HypothesesMarketResearch = {
  id: Scalars['ID']['output'];
  projectHypothesisId: Scalars['ID']['output'];
  summary: Scalars['String']['output'];
  threadId: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type HypothesesPacking = {
  id: Scalars['ID']['output'];
  projectHypothesisId: Scalars['ID']['output'];
  summary: Scalars['String']['output'];
  threadId: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type HypothesesPersonProfile = {
  age: Scalars['Int']['output'];
  avatarUrl?: Maybe<Scalars['String']['output']>;
  cjm?: Maybe<Cjm>;
  customerSegmentId: Scalars['ID']['output'];
  description: Scalars['String']['output'];
  education: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  jbtd?: Maybe<Jbtd>;
  location: Scalars['String']['output'];
  name: Scalars['String']['output'];
  platforms: Array<Scalars['String']['output']>;
  projectHypothesisId: Scalars['ID']['output'];
  userGains: Array<Scalars['String']['output']>;
  userGoals: Array<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
  userPains: Array<Scalars['String']['output']>;
  userTriggers: Array<Scalars['String']['output']>;
};

export type HypothesesValidation = {
  customerInterviewQuestions: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  insightsCustomerInterviews?: Maybe<Scalars['String']['output']>;
  projectHypothesisId: Scalars['ID']['output'];
  summaryInterview?: Maybe<SummaryInterview>;
  threadId: Scalars['String']['output'];
  uploadedCustomerInterviews?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
  validationChannels: Array<Scalars['String']['output']>;
};

export type Jbtd = {
  functionalAspects?: Maybe<Scalars['String']['output']>;
  personalDimension?: Maybe<Scalars['String']['output']>;
  socialDimension?: Maybe<Scalars['String']['output']>;
};

export type JbtdInput = {
  functionalAspects?: InputMaybe<Scalars['String']['input']>;
  personalDimension?: InputMaybe<Scalars['String']['input']>;
  socialDimension?: InputMaybe<Scalars['String']['input']>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  activatePromoCode: ActivatePromoCodeResponse;
  addContentIdeaToBacklog: BacklogIdea;
  approveContentItem: ContentItem;
  authThrowThirdParty: AuthResponse;
  changeHypothesesCore: HypothesesCore;
  changeHypothesesGtm: HypothesesGtm;
  changeHypothesesGtmDetailedChannel: HypothesesGtmDetailedChannel;
  changeHypothesesMarketResearch: HypothesesMarketResearch;
  changeHypothesesPacking: HypothesesPacking;
  changeHypothesesPersonProfile: HypothesesPersonProfile;
  changeHypothesesValidation: HypothesesValidation;
  changePassword: AuthResponse;
  changeProjectAssistant: Scalars['String']['output'];
  changeProjectHypothesis: ProjectHypotheses;
  changeSubscription?: Maybe<Scalars['String']['output']>;
  createCustomContentIdea: ContentIdea;
  createHypothesesGtm: HypothesesGtm;
  createHypothesesGtmDetailedChannel: HypothesesGtmDetailedChannel;
  createHypothesesMarketResearch: HypothesesMarketResearch;
  createHypothesesPacking: HypothesesPacking;
  createHypothesesValidation: HypothesesValidation;
  createPromoCode: PromoCode;
  createRequestFeature: Scalars['String']['output'];
  createSeoAgentBacklogIdea: BacklogIdea;
  createSeoAgentCluster: SeoCluster;
  createSubscriptionCheckout?: Maybe<Scalars['String']['output']>;
  deleteBacklogIdea: Scalars['Boolean']['output'];
  deleteContentItem: Scalars['Boolean']['output'];
  deleteProjectHypothesis: Scalars['Boolean']['output'];
  deleteSeoAgentBacklogIdea: Scalars['Boolean']['output'];
  deleteSeoAgentCluster: Scalars['Boolean']['output'];
  deleteSeoCluster: Scalars['Boolean']['output'];
  dismissContentIdea: ContentIdea;
  forgotPassword: Scalars['String']['output'];
  generateContentForBacklogIdea: ContentItem;
  generateContentIdeas: Array<ContentIdea>;
  generateHypothesesGtmDetailedChannelContentIdea: GtmChannelContentIdea;
  generateImageForContent: ContentItem;
  generateTokenThrowEmail: Scalars['String']['output'];
  logFrontendMessage: Scalars['Boolean']['output'];
  login: AuthResponse;
  publishToWordPress: PublishToWordPressResult;
  regenerateContent: ContentItem;
  regenerateHypothesesCore: HypothesesCore;
  regenerateHypothesesGtm: HypothesesGtm;
  regenerateHypothesesGtmDetailedChannel: HypothesesGtmDetailedChannel;
  regenerateHypothesesMarketResearch: HypothesesMarketResearch;
  regenerateHypothesesPacking: HypothesesPacking;
  regenerateHypothesesValidation: HypothesesValidation;
  register: AuthResponse;
  rewriteTextSelection: RewriteTextSelectionResult;
  testWordPressConnection: TestWordPressConnectionResult;
  updateSeoAgentBacklogIdea: BacklogIdea;
  updateSeoAgentCluster: SeoCluster;
  updateSeoAgentPostingSettings: PostingSettings;
  uploadHypothesesValidationCustomerInterview: HypothesesValidation;
  upsertBacklogIdea: BacklogIdea;
  upsertContentItem: ContentItem;
  upsertSeoCluster: SeoCluster;
};


export type MutationActivatePromoCodeArgs = {
  code: Scalars['String']['input'];
};


export type MutationAddContentIdeaToBacklogArgs = {
  input: AddContentIdeaToBacklogInput;
};


export type MutationApproveContentItemArgs = {
  input: ApproveContentItemInput;
};


export type MutationAuthThrowThirdPartyArgs = {
  input: AuthThrowThirdPartyInput;
};


export type MutationChangeHypothesesCoreArgs = {
  input: ChangeHypothesesCoreInput;
};


export type MutationChangeHypothesesGtmArgs = {
  input: ChangeHypothesesGtmInput;
};


export type MutationChangeHypothesesGtmDetailedChannelArgs = {
  input: ChangeHypothesesGtmDetailedChannelInput;
};


export type MutationChangeHypothesesMarketResearchArgs = {
  input: ChangeHypothesesMarketResearchInput;
};


export type MutationChangeHypothesesPackingArgs = {
  input: ChangeHypothesesPackingInput;
};


export type MutationChangeHypothesesPersonProfileArgs = {
  input: ChangeHypothesesPersonProfileInput;
};


export type MutationChangeHypothesesValidationArgs = {
  input: ChangeHypothesesValidationInput;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationChangeProjectAssistantArgs = {
  input: ChangeProjectAssistantInput;
};


export type MutationChangeProjectHypothesisArgs = {
  input: ChangeProjectHypothesisInput;
};


export type MutationChangeSubscriptionArgs = {
  type?: InputMaybe<SubscriptionType>;
};


export type MutationCreateCustomContentIdeaArgs = {
  input: CreateCustomContentIdeaInput;
};


export type MutationCreateHypothesesGtmArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type MutationCreateHypothesesGtmDetailedChannelArgs = {
  input: CreateHypothesesGtmDetailedChannelInput;
};


export type MutationCreateHypothesesMarketResearchArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type MutationCreateHypothesesPackingArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type MutationCreateHypothesesValidationArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type MutationCreatePromoCodeArgs = {
  code: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  durationMonths?: InputMaybe<Scalars['Int']['input']>;
  expiresAt?: InputMaybe<Scalars['Date']['input']>;
  maxUses?: InputMaybe<Scalars['Int']['input']>;
  subscriptionType: SubscriptionType;
};


export type MutationCreateRequestFeatureArgs = {
  requestedFeature: RequestedFeature;
};


export type MutationCreateSeoAgentBacklogIdeaArgs = {
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  input: CreateSeoAgentBacklogIdeaInput;
  projectId: Scalars['ID']['input'];
};


export type MutationCreateSeoAgentClusterArgs = {
  input: ClusterInput;
};


export type MutationCreateSubscriptionCheckoutArgs = {
  type?: InputMaybe<SubscriptionType>;
};


export type MutationDeleteBacklogIdeaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContentItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectHypothesisArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSeoAgentBacklogIdeaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSeoAgentClusterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSeoClusterArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDismissContentIdeaArgs = {
  id: Scalars['ID']['input'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type MutationGenerateContentForBacklogIdeaArgs = {
  input: GenerateContentInput;
};


export type MutationGenerateContentIdeasArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  hypothesisId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};


export type MutationGenerateHypothesesGtmDetailedChannelContentIdeaArgs = {
  input: GenerateHypothesesGtmDetailedChannelContentIdeaInput;
};


export type MutationGenerateImageForContentArgs = {
  input: GenerateImageInput;
};


export type MutationGenerateTokenThrowEmailArgs = {
  input: GenerateTokenThrowEmailInput;
};


export type MutationLogFrontendMessageArgs = {
  data?: InputMaybe<Scalars['String']['input']>;
  level: Scalars['String']['input'];
  message: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  input?: InputMaybe<LoginInput>;
};


export type MutationPublishToWordPressArgs = {
  input: PublishToWordPressInput;
};


export type MutationRegenerateContentArgs = {
  id: Scalars['ID']['input'];
  promptPart?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRegenerateHypothesesCoreArgs = {
  input: ProjectHypothesisIdPromptPartInput;
};


export type MutationRegenerateHypothesesGtmArgs = {
  input: ProjectHypothesisIdPromptPartInput;
};


export type MutationRegenerateHypothesesGtmDetailedChannelArgs = {
  input: RegenerateHypothesesGtmDetailedChannelInput;
};


export type MutationRegenerateHypothesesMarketResearchArgs = {
  input: ProjectHypothesisIdPromptPartInput;
};


export type MutationRegenerateHypothesesPackingArgs = {
  input: ProjectHypothesisIdPromptPartInput;
};


export type MutationRegenerateHypothesesValidationArgs = {
  input: ProjectHypothesisIdPromptPartInput;
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRewriteTextSelectionArgs = {
  input: RewriteTextSelectionInput;
};


export type MutationTestWordPressConnectionArgs = {
  input: TestWordPressConnectionInput;
};


export type MutationUpdateSeoAgentBacklogIdeaArgs = {
  id: Scalars['ID']['input'];
  input: SeoAgentBacklogIdeaInput;
};


export type MutationUpdateSeoAgentClusterArgs = {
  id: Scalars['ID']['input'];
  input: ClusterInput;
};


export type MutationUpdateSeoAgentPostingSettingsArgs = {
  input: PostingSettingsInput;
};


export type MutationUploadHypothesesValidationCustomerInterviewArgs = {
  input: UploadHypothesesValidationCustomerInterviewInput;
};


export type MutationUpsertBacklogIdeaArgs = {
  input: BacklogIdeaInput;
};


export type MutationUpsertContentItemArgs = {
  input: ContentItemInput;
};


export type MutationUpsertSeoClusterArgs = {
  input: ClusterInput;
};

export type PostingSettings = {
  autoPublishEnabled: Scalars['Boolean']['output'];
  hypothesisId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  language?: Maybe<Scalars['String']['output']>;
  preferredDays: Array<Scalars['String']['output']>;
  projectId: Scalars['ID']['output'];
  timezone?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  weeklyPublishCount: Scalars['Int']['output'];
  wordpressBaseUrl?: Maybe<Scalars['String']['output']>;
  wordpressConnected: Scalars['Boolean']['output'];
  wordpressDefaultCategoryId?: Maybe<Scalars['Int']['output']>;
  wordpressDefaultTagIds: Array<Scalars['Int']['output']>;
  wordpressPostType?: Maybe<Scalars['String']['output']>;
  wordpressUsername?: Maybe<Scalars['String']['output']>;
};

export type PostingSettingsInput = {
  autoPublishEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  preferredDays?: InputMaybe<Array<Scalars['String']['input']>>;
  projectId: Scalars['ID']['input'];
  timezone?: InputMaybe<Scalars['String']['input']>;
  weeklyPublishCount?: InputMaybe<Scalars['Int']['input']>;
  wordpressAppPassword?: InputMaybe<Scalars['String']['input']>;
  wordpressBaseUrl?: InputMaybe<Scalars['String']['input']>;
  wordpressDefaultCategoryId?: InputMaybe<Scalars['Int']['input']>;
  wordpressDefaultTagIds?: InputMaybe<Array<Scalars['Int']['input']>>;
  wordpressPostType?: InputMaybe<Scalars['String']['input']>;
  wordpressUsername?: InputMaybe<Scalars['String']['input']>;
};

export type Project = {
  assistantId: Scalars['String']['output'];
  generationStatus: ProjectGenerationStatus;
  id: Scalars['ID']['output'];
  info: Scalars['String']['output'];
  startType: ProjectStartType;
  title: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type ProjectAssistant = {
  id: Scalars['ID']['output'];
  projectId: Scalars['ID']['output'];
  systemInstruction: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type ProjectDto = {
  generationStatus: ProjectGenerationStatus;
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export enum ProjectGenerationStatus {
  Generated = 'GENERATED',
  InProgress = 'IN_PROGRESS'
}

export type ProjectHypotheses = {
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  projectId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type ProjectHypothesisIdPromptPartInput = {
  projectHypothesisId: Scalars['ID']['input'];
  promptPart: Scalars['String']['input'];
};

export enum ProjectStartType {
  StartFromScratch = 'START_FROM_SCRATCH',
  UrlImport = 'URL_IMPORT'
}

export type PromoCode = {
  code: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  description?: Maybe<Scalars['String']['output']>;
  durationMonths: Scalars['Int']['output'];
  expiresAt?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  maxUses: Scalars['Int']['output'];
  subscriptionType: SubscriptionType;
  updatedAt: Scalars['Date']['output'];
  usedCount: Scalars['Int']['output'];
};

export type PromoCodeInfo = {
  code: Scalars['String']['output'];
  durationMonths: Scalars['Int']['output'];
  isValid: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  subscriptionType: SubscriptionType;
};

export type PublishToWordPressInput = {
  contentItemId: Scalars['ID']['input'];
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};

export type PublishToWordPressResult = {
  error?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  wordPressPostId?: Maybe<Scalars['Int']['output']>;
  wordPressPostUrl?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  contentItemByBacklogIdea?: Maybe<ContentItem>;
  getAllHypothesesPersonProfiles: Array<HypothesesPersonProfile>;
  getAllPromoCodes: Array<PromoCode>;
  getAssistantMessages: AssistantMessages;
  getHypothesesCore: HypothesesCore;
  getHypothesesGtm?: Maybe<HypothesesGtm>;
  getHypothesesGtmDetailedChannel?: Maybe<HypothesesGtmDetailedChannel>;
  getHypothesesMarketResearch?: Maybe<HypothesesMarketResearch>;
  getHypothesesPacking?: Maybe<HypothesesPacking>;
  getHypothesesValidation?: Maybe<HypothesesValidation>;
  getProjectAssistant: ProjectAssistant;
  getProjectHypotheses: Array<ProjectHypotheses>;
  getProjects: Array<ProjectDto>;
  getPromoCodeInfo: PromoCodeInfo;
  getSubscription?: Maybe<Subscription>;
  getSubscriptionStripeSession?: Maybe<Scalars['String']['output']>;
  getUserByToken: AuthResponse;
  seoAgentBacklog: Array<BacklogIdea>;
  seoAgentClusters: Array<SeoCluster>;
  seoAgentContentIdeas: Array<ContentIdea>;
  seoAgentPostingSettings?: Maybe<PostingSettings>;
  seoBacklog: Array<BacklogIdea>;
  seoClusters: Array<SeoCluster>;
  seoContentQueue: Array<ContentItem>;
  test: Scalars['String']['output'];
  wordpressCategories: Array<WordPressCategory>;
  wordpressPostTypes: Array<WordPressPostType>;
  wordpressTags: Array<WordPressTag>;
};


export type QueryContentItemByBacklogIdeaArgs = {
  backlogIdeaId: Scalars['ID']['input'];
};


export type QueryGetAllHypothesesPersonProfilesArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type QueryGetHypothesesCoreArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type QueryGetHypothesesGtmArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type QueryGetHypothesesGtmDetailedChannelArgs = {
  input: GetHypothesesGtmDetailedChannelInput;
};


export type QueryGetHypothesesMarketResearchArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type QueryGetHypothesesPackingArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type QueryGetHypothesesValidationArgs = {
  projectHypothesisId: Scalars['ID']['input'];
};


export type QueryGetProjectAssistantArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryGetProjectHypothesesArgs = {
  projectId: Scalars['ID']['input'];
};


export type QueryGetPromoCodeInfoArgs = {
  code: Scalars['String']['input'];
};


export type QuerySeoAgentBacklogArgs = {
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
};


export type QuerySeoAgentClustersArgs = {
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
};


export type QuerySeoAgentContentIdeasArgs = {
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
};


export type QuerySeoAgentPostingSettingsArgs = {
  projectId: Scalars['ID']['input'];
};


export type QuerySeoBacklogArgs = {
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
  status?: InputMaybe<BacklogStatus>;
};


export type QuerySeoClustersArgs = {
  hypothesisId: Scalars['ID']['input'];
  projectId: Scalars['ID']['input'];
};


export type QuerySeoContentQueueArgs = {
  hypothesisId?: InputMaybe<Scalars['ID']['input']>;
  projectId: Scalars['ID']['input'];
  status?: InputMaybe<ContentStatus>;
};


export type QueryWordpressCategoriesArgs = {
  input: TestWordPressConnectionInput;
};


export type QueryWordpressPostTypesArgs = {
  input: TestWordPressConnectionInput;
};


export type QueryWordpressTagsArgs = {
  input: TestWordPressConnectionInput;
};

export type RegenerateHypothesesGtmDetailedChannelInput = {
  customerSegmentId: Scalars['ID']['input'];
  hypothesesGtmChannelId: Scalars['ID']['input'];
  projectHypothesisId: Scalars['ID']['input'];
  promptPart: Scalars['String']['input'];
};

export type RegisterInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RequestFeature = {
  id: Scalars['ID']['output'];
  requestedFeature: RequestedFeature;
  userId: Scalars['ID']['output'];
};

export enum RequestedFeature {
  Branding = 'BRANDING',
  PitchMaterials = 'PITCH_MATERIALS'
}

export type ResetPassword = {
  expire?: Maybe<Scalars['Date']['output']>;
  resetCode?: Maybe<Scalars['Int']['output']>;
};

export type RewriteTextSelectionInput = {
  contentItemId: Scalars['ID']['input'];
  contextAfter?: InputMaybe<Scalars['String']['input']>;
  contextBefore?: InputMaybe<Scalars['String']['input']>;
  instruction?: InputMaybe<Scalars['String']['input']>;
  selectedText: Scalars['String']['input'];
};

export type RewriteTextSelectionResult = {
  error?: Maybe<Scalars['String']['output']>;
  rewrittenText: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type SeoAgentBacklogIdeaInput = {
  category?: InputMaybe<BacklogCategory>;
  description?: InputMaybe<Scalars['String']['input']>;
  scheduledDate?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<BacklogStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type SeoCluster = {
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['ID']['output']>;
  hypothesisId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  intent: SeoClusterIntent;
  keywords: Array<Scalars['String']['output']>;
  projectId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['ID']['output']>;
};

export enum SeoClusterIntent {
  Commercial = 'COMMERCIAL',
  Informational = 'INFORMATIONAL',
  Navigational = 'NAVIGATIONAL',
  Transactional = 'TRANSACTIONAL'
}

export type Subscription = {
  customerId: Scalars['String']['output'];
  endDate: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  price: Scalars['Float']['output'];
  startDate: Scalars['Date']['output'];
  status: SubscriptionStatus;
  stripeSubscriptionId: Scalars['String']['output'];
  type: SubscriptionType;
  userId: Scalars['ID']['output'];
};

export enum SubscriptionStatus {
  Active = 'ACTIVE',
  Canceled = 'CANCELED',
  Inactive = 'INACTIVE',
  Incomplete = 'INCOMPLETE',
  IncompleteExpired = 'INCOMPLETE_EXPIRED',
  Open = 'OPEN',
  PastDue = 'PAST_DUE',
  Trialing = 'TRIALING',
  Unpaid = 'UNPAID'
}

export enum SubscriptionType {
  Pro = 'PRO',
  Starter = 'STARTER'
}

export type SummaryInterview = {
  goals?: Maybe<Array<Scalars['String']['output']>>;
  hypotheses?: Maybe<Array<Scalars['String']['output']>>;
  pains?: Maybe<Array<Scalars['String']['output']>>;
  toneOfVoice?: Maybe<Scalars['String']['output']>;
};

export type SummaryInterviewInput = {
  goals: Array<Scalars['String']['input']>;
  hypotheses: Array<Scalars['String']['input']>;
  pains: Array<Scalars['String']['input']>;
  toneOfVoice: Scalars['String']['input'];
};

export type TestWordPressConnectionInput = {
  postType?: InputMaybe<Scalars['String']['input']>;
  wordpressAppPassword: Scalars['String']['input'];
  wordpressBaseUrl: Scalars['String']['input'];
  wordpressUsername: Scalars['String']['input'];
};

export type TestWordPressConnectionResult = {
  error?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type TextIsCompleted = {
  id: Scalars['ID']['output'];
  isCompleted: Scalars['Boolean']['output'];
  text: Scalars['String']['output'];
};

export type TextIsCompletedInput = {
  id: Scalars['ID']['input'];
  isCompleted: Scalars['Boolean']['input'];
  text: Scalars['String']['input'];
};

export type UploadHypothesesValidationCustomerInterviewInput = {
  customerInterview: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};

export type User = {
  email: Scalars['String']['output'];
  freeTrialDueTo?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  isProjectGenerated: Scalars['Boolean']['output'];
  isProjectGenerationStarted: Scalars['Boolean']['output'];
  passwordHash?: Maybe<Scalars['String']['output']>;
  resetPassword?: Maybe<ResetPassword>;
  role: UserRole;
  timeZoneOffset: Scalars['Int']['output'];
};

export type UserDto = {
  email?: Maybe<Scalars['String']['output']>;
  freeTrialDueTo?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  role: UserRole;
};

export enum UserRole {
  Admin = 'ADMIN',
  User = 'USER'
}

export type WordPressCategory = {
  count: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type WordPressPostType = {
  label: Scalars['String']['output'];
  name: Scalars['String']['output'];
  public: Scalars['Boolean']['output'];
};

export type WordPressTag = {
  count: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActivatePromoCodeResponse: ResolverTypeWrapper<ActivatePromoCodeResponse>;
  AddContentIdeaToBacklogInput: AddContentIdeaToBacklogInput;
  ApproveContentItemInput: ApproveContentItemInput;
  AssistantMessages: ResolverTypeWrapper<AssistantMessages>;
  AuthResponse: ResolverTypeWrapper<AuthResponse>;
  AuthThrowThirdPartyInput: AuthThrowThirdPartyInput;
  BacklogCategory: BacklogCategory;
  BacklogIdea: ResolverTypeWrapper<BacklogIdea>;
  BacklogIdeaInput: BacklogIdeaInput;
  BacklogStatus: BacklogStatus;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ChangeHypothesesCoreInput: ChangeHypothesesCoreInput;
  ChangeHypothesesGtmDetailedChannelInput: ChangeHypothesesGtmDetailedChannelInput;
  ChangeHypothesesGtmInput: ChangeHypothesesGtmInput;
  ChangeHypothesesMarketResearchInput: ChangeHypothesesMarketResearchInput;
  ChangeHypothesesPackingInput: ChangeHypothesesPackingInput;
  ChangeHypothesesPersonProfileInput: ChangeHypothesesPersonProfileInput;
  ChangeHypothesesValidationInput: ChangeHypothesesValidationInput;
  ChangePasswordInput: ChangePasswordInput;
  ChangeProjectAssistantInput: ChangeProjectAssistantInput;
  ChangeProjectHypothesisInput: ChangeProjectHypothesisInput;
  Channel: ResolverTypeWrapper<Channel>;
  ChannelInput: ChannelInput;
  ChannelType: ChannelType;
  ChannelVariant: ResolverTypeWrapper<ChannelVariant>;
  ChannelVariantInput: ChannelVariantInput;
  Cjm: ResolverTypeWrapper<Cjm>;
  CjmInput: CjmInput;
  CjmPart: ResolverTypeWrapper<CjmPart>;
  CjmPartInput: CjmPartInput;
  ClusterInput: ClusterInput;
  ContentCategory: ContentCategory;
  ContentFormat: ContentFormat;
  ContentIdea: ResolverTypeWrapper<ContentIdea>;
  ContentItem: ResolverTypeWrapper<ContentItem>;
  ContentItemInput: ContentItemInput;
  ContentStatus: ContentStatus;
  ContentType: ContentType;
  CreateCustomContentIdeaInput: CreateCustomContentIdeaInput;
  CreateHypothesesGtmDetailedChannelInput: CreateHypothesesGtmDetailedChannelInput;
  CreateSeoAgentBacklogIdeaInput: CreateSeoAgentBacklogIdeaInput;
  CustomerSegment: ResolverTypeWrapper<CustomerSegment>;
  CustomerSegmentInput: CustomerSegmentInput;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  GenerateContentInput: GenerateContentInput;
  GenerateHypothesesGtmDetailedChannelContentIdeaInput: GenerateHypothesesGtmDetailedChannelContentIdeaInput;
  GenerateImageInput: GenerateImageInput;
  GenerateTokenThrowEmailInput: GenerateTokenThrowEmailInput;
  GetHypothesesGtmDetailedChannelInput: GetHypothesesGtmDetailedChannelInput;
  GtmChannelActionPlan: ResolverTypeWrapper<GtmChannelActionPlan>;
  GtmChannelActionPlanInput: GtmChannelActionPlanInput;
  GtmChannelContentIdea: ResolverTypeWrapper<GtmChannelContentIdea>;
  GtmChannelContentIdeaInput: GtmChannelContentIdeaInput;
  GtmChannelMetricsAndKpis: ResolverTypeWrapper<GtmChannelMetricsAndKpis>;
  GtmChannelMetricsAndKpisInput: GtmChannelMetricsAndKpisInput;
  HypothesesCore: ResolverTypeWrapper<HypothesesCore>;
  HypothesesGtm: ResolverTypeWrapper<HypothesesGtm>;
  HypothesesGtmChannel: ResolverTypeWrapper<HypothesesGtmChannel>;
  HypothesesGtmChannelInput: HypothesesGtmChannelInput;
  HypothesesGtmChannelStatus: HypothesesGtmChannelStatus;
  HypothesesGtmChannelType: HypothesesGtmChannelType;
  HypothesesGtmDetailedChannel: ResolverTypeWrapper<HypothesesGtmDetailedChannel>;
  HypothesesGtmStage: ResolverTypeWrapper<HypothesesGtmStage>;
  HypothesesGtmStageInput: HypothesesGtmStageInput;
  HypothesesMarketResearch: ResolverTypeWrapper<HypothesesMarketResearch>;
  HypothesesPacking: ResolverTypeWrapper<HypothesesPacking>;
  HypothesesPersonProfile: ResolverTypeWrapper<HypothesesPersonProfile>;
  HypothesesValidation: ResolverTypeWrapper<HypothesesValidation>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Jbtd: ResolverTypeWrapper<Jbtd>;
  JbtdInput: JbtdInput;
  LoginInput: LoginInput;
  Mutation: ResolverTypeWrapper<{}>;
  PostingSettings: ResolverTypeWrapper<PostingSettings>;
  PostingSettingsInput: PostingSettingsInput;
  Project: ResolverTypeWrapper<Project>;
  ProjectAssistant: ResolverTypeWrapper<ProjectAssistant>;
  ProjectDto: ResolverTypeWrapper<ProjectDto>;
  ProjectGenerationStatus: ProjectGenerationStatus;
  ProjectHypotheses: ResolverTypeWrapper<ProjectHypotheses>;
  ProjectHypothesisIdPromptPartInput: ProjectHypothesisIdPromptPartInput;
  ProjectStartType: ProjectStartType;
  PromoCode: ResolverTypeWrapper<PromoCode>;
  PromoCodeInfo: ResolverTypeWrapper<PromoCodeInfo>;
  PublishToWordPressInput: PublishToWordPressInput;
  PublishToWordPressResult: ResolverTypeWrapper<PublishToWordPressResult>;
  Query: ResolverTypeWrapper<{}>;
  RegenerateHypothesesGtmDetailedChannelInput: RegenerateHypothesesGtmDetailedChannelInput;
  RegisterInput: RegisterInput;
  RequestFeature: ResolverTypeWrapper<RequestFeature>;
  RequestedFeature: RequestedFeature;
  ResetPassword: ResolverTypeWrapper<ResetPassword>;
  RewriteTextSelectionInput: RewriteTextSelectionInput;
  RewriteTextSelectionResult: ResolverTypeWrapper<RewriteTextSelectionResult>;
  SeoAgentBacklogIdeaInput: SeoAgentBacklogIdeaInput;
  SeoCluster: ResolverTypeWrapper<SeoCluster>;
  SeoClusterIntent: SeoClusterIntent;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  SubscriptionStatus: SubscriptionStatus;
  SubscriptionType: SubscriptionType;
  SummaryInterview: ResolverTypeWrapper<SummaryInterview>;
  SummaryInterviewInput: SummaryInterviewInput;
  TestWordPressConnectionInput: TestWordPressConnectionInput;
  TestWordPressConnectionResult: ResolverTypeWrapper<TestWordPressConnectionResult>;
  TextIsCompleted: ResolverTypeWrapper<TextIsCompleted>;
  TextIsCompletedInput: TextIsCompletedInput;
  UploadHypothesesValidationCustomerInterviewInput: UploadHypothesesValidationCustomerInterviewInput;
  User: ResolverTypeWrapper<User>;
  UserDTO: ResolverTypeWrapper<UserDto>;
  UserRole: UserRole;
  WordPressCategory: ResolverTypeWrapper<WordPressCategory>;
  WordPressPostType: ResolverTypeWrapper<WordPressPostType>;
  WordPressTag: ResolverTypeWrapper<WordPressTag>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActivatePromoCodeResponse: ActivatePromoCodeResponse;
  AddContentIdeaToBacklogInput: AddContentIdeaToBacklogInput;
  ApproveContentItemInput: ApproveContentItemInput;
  AssistantMessages: AssistantMessages;
  AuthResponse: AuthResponse;
  AuthThrowThirdPartyInput: AuthThrowThirdPartyInput;
  BacklogIdea: BacklogIdea;
  BacklogIdeaInput: BacklogIdeaInput;
  Boolean: Scalars['Boolean']['output'];
  ChangeHypothesesCoreInput: ChangeHypothesesCoreInput;
  ChangeHypothesesGtmDetailedChannelInput: ChangeHypothesesGtmDetailedChannelInput;
  ChangeHypothesesGtmInput: ChangeHypothesesGtmInput;
  ChangeHypothesesMarketResearchInput: ChangeHypothesesMarketResearchInput;
  ChangeHypothesesPackingInput: ChangeHypothesesPackingInput;
  ChangeHypothesesPersonProfileInput: ChangeHypothesesPersonProfileInput;
  ChangeHypothesesValidationInput: ChangeHypothesesValidationInput;
  ChangePasswordInput: ChangePasswordInput;
  ChangeProjectAssistantInput: ChangeProjectAssistantInput;
  ChangeProjectHypothesisInput: ChangeProjectHypothesisInput;
  Channel: Channel;
  ChannelInput: ChannelInput;
  ChannelVariant: ChannelVariant;
  ChannelVariantInput: ChannelVariantInput;
  Cjm: Cjm;
  CjmInput: CjmInput;
  CjmPart: CjmPart;
  CjmPartInput: CjmPartInput;
  ClusterInput: ClusterInput;
  ContentIdea: ContentIdea;
  ContentItem: ContentItem;
  ContentItemInput: ContentItemInput;
  CreateCustomContentIdeaInput: CreateCustomContentIdeaInput;
  CreateHypothesesGtmDetailedChannelInput: CreateHypothesesGtmDetailedChannelInput;
  CreateSeoAgentBacklogIdeaInput: CreateSeoAgentBacklogIdeaInput;
  CustomerSegment: CustomerSegment;
  CustomerSegmentInput: CustomerSegmentInput;
  Date: Scalars['Date']['output'];
  DateTime: Scalars['DateTime']['output'];
  Float: Scalars['Float']['output'];
  GenerateContentInput: GenerateContentInput;
  GenerateHypothesesGtmDetailedChannelContentIdeaInput: GenerateHypothesesGtmDetailedChannelContentIdeaInput;
  GenerateImageInput: GenerateImageInput;
  GenerateTokenThrowEmailInput: GenerateTokenThrowEmailInput;
  GetHypothesesGtmDetailedChannelInput: GetHypothesesGtmDetailedChannelInput;
  GtmChannelActionPlan: GtmChannelActionPlan;
  GtmChannelActionPlanInput: GtmChannelActionPlanInput;
  GtmChannelContentIdea: GtmChannelContentIdea;
  GtmChannelContentIdeaInput: GtmChannelContentIdeaInput;
  GtmChannelMetricsAndKpis: GtmChannelMetricsAndKpis;
  GtmChannelMetricsAndKpisInput: GtmChannelMetricsAndKpisInput;
  HypothesesCore: HypothesesCore;
  HypothesesGtm: HypothesesGtm;
  HypothesesGtmChannel: HypothesesGtmChannel;
  HypothesesGtmChannelInput: HypothesesGtmChannelInput;
  HypothesesGtmDetailedChannel: HypothesesGtmDetailedChannel;
  HypothesesGtmStage: HypothesesGtmStage;
  HypothesesGtmStageInput: HypothesesGtmStageInput;
  HypothesesMarketResearch: HypothesesMarketResearch;
  HypothesesPacking: HypothesesPacking;
  HypothesesPersonProfile: HypothesesPersonProfile;
  HypothesesValidation: HypothesesValidation;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Jbtd: Jbtd;
  JbtdInput: JbtdInput;
  LoginInput: LoginInput;
  Mutation: {};
  PostingSettings: PostingSettings;
  PostingSettingsInput: PostingSettingsInput;
  Project: Project;
  ProjectAssistant: ProjectAssistant;
  ProjectDto: ProjectDto;
  ProjectHypotheses: ProjectHypotheses;
  ProjectHypothesisIdPromptPartInput: ProjectHypothesisIdPromptPartInput;
  PromoCode: PromoCode;
  PromoCodeInfo: PromoCodeInfo;
  PublishToWordPressInput: PublishToWordPressInput;
  PublishToWordPressResult: PublishToWordPressResult;
  Query: {};
  RegenerateHypothesesGtmDetailedChannelInput: RegenerateHypothesesGtmDetailedChannelInput;
  RegisterInput: RegisterInput;
  RequestFeature: RequestFeature;
  ResetPassword: ResetPassword;
  RewriteTextSelectionInput: RewriteTextSelectionInput;
  RewriteTextSelectionResult: RewriteTextSelectionResult;
  SeoAgentBacklogIdeaInput: SeoAgentBacklogIdeaInput;
  SeoCluster: SeoCluster;
  String: Scalars['String']['output'];
  Subscription: {};
  SummaryInterview: SummaryInterview;
  SummaryInterviewInput: SummaryInterviewInput;
  TestWordPressConnectionInput: TestWordPressConnectionInput;
  TestWordPressConnectionResult: TestWordPressConnectionResult;
  TextIsCompleted: TextIsCompleted;
  TextIsCompletedInput: TextIsCompletedInput;
  UploadHypothesesValidationCustomerInterviewInput: UploadHypothesesValidationCustomerInterviewInput;
  User: User;
  UserDTO: UserDto;
  WordPressCategory: WordPressCategory;
  WordPressPostType: WordPressPostType;
  WordPressTag: WordPressTag;
};

export type ActivatePromoCodeResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActivatePromoCodeResponse'] = ResolversParentTypes['ActivatePromoCodeResponse']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AssistantMessagesResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssistantMessages'] = ResolversParentTypes['AssistantMessages']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  generatedMessages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['AuthResponse'] = ResolversParentTypes['AuthResponse']> = {
  token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserDTO']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BacklogIdeaResolvers<ContextType = any, ParentType extends ResolversParentTypes['BacklogIdea'] = ResolversParentTypes['BacklogIdea']> = {
  category?: Resolver<Maybe<ResolversTypes['BacklogCategory']>, ParentType, ContextType>;
  clusterId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  contentType?: Resolver<ResolversTypes['ContentType'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hypothesisId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  scheduledDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['BacklogStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ChannelResolvers<ContextType = any, ParentType extends ResolversParentTypes['Channel'] = ResolversParentTypes['Channel']> = {
  channelType?: Resolver<ResolversTypes['ChannelType'], ParentType, ContextType>;
  variants?: Resolver<Array<ResolversTypes['ChannelVariant']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ChannelVariantResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChannelVariant'] = ResolversParentTypes['ChannelVariant']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CjmResolvers<ContextType = any, ParentType extends ResolversParentTypes['Cjm'] = ResolversParentTypes['Cjm']> = {
  acquisition?: Resolver<Maybe<ResolversTypes['CjmPart']>, ParentType, ContextType>;
  awareness?: Resolver<Maybe<ResolversTypes['CjmPart']>, ParentType, ContextType>;
  consideration?: Resolver<Maybe<ResolversTypes['CjmPart']>, ParentType, ContextType>;
  loyalty?: Resolver<Maybe<ResolversTypes['CjmPart']>, ParentType, ContextType>;
  service?: Resolver<Maybe<ResolversTypes['CjmPart']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CjmPartResolvers<ContextType = any, ParentType extends ResolversParentTypes['CjmPart'] = ResolversParentTypes['CjmPart']> = {
  barriers?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  opportunities?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentIdeaResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentIdea'] = ResolversParentTypes['ContentIdea']> = {
  backlogIdeaId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes['ContentCategory'], ParentType, ContextType>;
  clusterId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  contentType?: Resolver<ResolversTypes['ContentType'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dismissed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isAddedToBacklog?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isDismissed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContentItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContentItem'] = ResolversParentTypes['ContentItem']> = {
  backlogIdeaId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  category?: Resolver<ResolversTypes['ContentCategory'], ParentType, ContextType>;
  channel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  dueDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  format?: Resolver<ResolversTypes['ContentFormat'], ParentType, ContextType>;
  hypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  outline?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ownerId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  reviewerId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ContentStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CustomerSegmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['CustomerSegment'] = ResolversParentTypes['CustomerSegment']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type GtmChannelActionPlanResolvers<ContextType = any, ParentType extends ResolversParentTypes['GtmChannelActionPlan'] = ResolversParentTypes['GtmChannelActionPlan']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isCompleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  stageTitle?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tasks?: Resolver<Array<ResolversTypes['TextIsCompleted']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GtmChannelContentIdeaResolvers<ContextType = any, ParentType extends ResolversParentTypes['GtmChannelContentIdea'] = ResolversParentTypes['GtmChannelContentIdea']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GtmChannelMetricsAndKpisResolvers<ContextType = any, ParentType extends ResolversParentTypes['GtmChannelMetricsAndKpis'] = ResolversParentTypes['GtmChannelMetricsAndKpis']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesCoreResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesCore'] = ResolversParentTypes['HypothesesCore']> = {
  channels?: Resolver<Array<ResolversTypes['Channel']>, ParentType, ContextType>;
  costStructure?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerSegments?: Resolver<Array<ResolversTypes['CustomerSegment']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  keyMetrics?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  problems?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  projectHypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  revenueStream?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  solutions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  threadId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  unfairAdvantages?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  uniqueProposition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesGtmResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesGtm'] = ResolversParentTypes['HypothesesGtm']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  projectHypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  stageBuildAudience?: Resolver<ResolversTypes['HypothesesGtmStage'], ParentType, ContextType>;
  stageScale?: Resolver<ResolversTypes['HypothesesGtmStage'], ParentType, ContextType>;
  stageValidate?: Resolver<ResolversTypes['HypothesesGtmStage'], ParentType, ContextType>;
  threadId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesGtmChannelResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesGtmChannel'] = ResolversParentTypes['HypothesesGtmChannel']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kpis?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['HypothesesGtmChannelStatus'], ParentType, ContextType>;
  strategy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['HypothesesGtmChannelType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesGtmDetailedChannelResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesGtmDetailedChannel'] = ResolversParentTypes['HypothesesGtmDetailedChannel']> = {
  actionPlan?: Resolver<Array<ResolversTypes['GtmChannelActionPlan']>, ParentType, ContextType>;
  channelPreparationTasks?: Resolver<Array<ResolversTypes['TextIsCompleted']>, ParentType, ContextType>;
  channelStrategy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contentIdeas?: Resolver<Maybe<Array<ResolversTypes['GtmChannelContentIdea']>>, ParentType, ContextType>;
  customerSegmentId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  hypothesesGtmChannelId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  metricsAndKpis?: Resolver<Array<ResolversTypes['GtmChannelMetricsAndKpis']>, ParentType, ContextType>;
  resources?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tools?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesGtmStageResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesGtmStage'] = ResolversParentTypes['HypothesesGtmStage']> = {
  channels?: Resolver<Array<ResolversTypes['HypothesesGtmChannel']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesMarketResearchResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesMarketResearch'] = ResolversParentTypes['HypothesesMarketResearch']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  projectHypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  threadId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesPackingResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesPacking'] = ResolversParentTypes['HypothesesPacking']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  projectHypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  threadId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesPersonProfileResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesPersonProfile'] = ResolversParentTypes['HypothesesPersonProfile']> = {
  age?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  avatarUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cjm?: Resolver<Maybe<ResolversTypes['Cjm']>, ParentType, ContextType>;
  customerSegmentId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  education?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  jbtd?: Resolver<Maybe<ResolversTypes['Jbtd']>, ParentType, ContextType>;
  location?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  platforms?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  projectHypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  userGains?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  userGoals?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  userPains?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  userTriggers?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HypothesesValidationResolvers<ContextType = any, ParentType extends ResolversParentTypes['HypothesesValidation'] = ResolversParentTypes['HypothesesValidation']> = {
  customerInterviewQuestions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  insightsCustomerInterviews?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  projectHypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  summaryInterview?: Resolver<Maybe<ResolversTypes['SummaryInterview']>, ParentType, ContextType>;
  threadId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadedCustomerInterviews?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  validationChannels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JbtdResolvers<ContextType = any, ParentType extends ResolversParentTypes['Jbtd'] = ResolversParentTypes['Jbtd']> = {
  functionalAspects?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  personalDimension?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  socialDimension?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  activatePromoCode?: Resolver<ResolversTypes['ActivatePromoCodeResponse'], ParentType, ContextType, RequireFields<MutationActivatePromoCodeArgs, 'code'>>;
  addContentIdeaToBacklog?: Resolver<ResolversTypes['BacklogIdea'], ParentType, ContextType, RequireFields<MutationAddContentIdeaToBacklogArgs, 'input'>>;
  approveContentItem?: Resolver<ResolversTypes['ContentItem'], ParentType, ContextType, RequireFields<MutationApproveContentItemArgs, 'input'>>;
  authThrowThirdParty?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationAuthThrowThirdPartyArgs, 'input'>>;
  changeHypothesesCore?: Resolver<ResolversTypes['HypothesesCore'], ParentType, ContextType, RequireFields<MutationChangeHypothesesCoreArgs, 'input'>>;
  changeHypothesesGtm?: Resolver<ResolversTypes['HypothesesGtm'], ParentType, ContextType, RequireFields<MutationChangeHypothesesGtmArgs, 'input'>>;
  changeHypothesesGtmDetailedChannel?: Resolver<ResolversTypes['HypothesesGtmDetailedChannel'], ParentType, ContextType, RequireFields<MutationChangeHypothesesGtmDetailedChannelArgs, 'input'>>;
  changeHypothesesMarketResearch?: Resolver<ResolversTypes['HypothesesMarketResearch'], ParentType, ContextType, RequireFields<MutationChangeHypothesesMarketResearchArgs, 'input'>>;
  changeHypothesesPacking?: Resolver<ResolversTypes['HypothesesPacking'], ParentType, ContextType, RequireFields<MutationChangeHypothesesPackingArgs, 'input'>>;
  changeHypothesesPersonProfile?: Resolver<ResolversTypes['HypothesesPersonProfile'], ParentType, ContextType, RequireFields<MutationChangeHypothesesPersonProfileArgs, 'input'>>;
  changeHypothesesValidation?: Resolver<ResolversTypes['HypothesesValidation'], ParentType, ContextType, RequireFields<MutationChangeHypothesesValidationArgs, 'input'>>;
  changePassword?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationChangePasswordArgs, 'input'>>;
  changeProjectAssistant?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationChangeProjectAssistantArgs, 'input'>>;
  changeProjectHypothesis?: Resolver<ResolversTypes['ProjectHypotheses'], ParentType, ContextType, RequireFields<MutationChangeProjectHypothesisArgs, 'input'>>;
  changeSubscription?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MutationChangeSubscriptionArgs>>;
  createCustomContentIdea?: Resolver<ResolversTypes['ContentIdea'], ParentType, ContextType, RequireFields<MutationCreateCustomContentIdeaArgs, 'input'>>;
  createHypothesesGtm?: Resolver<ResolversTypes['HypothesesGtm'], ParentType, ContextType, RequireFields<MutationCreateHypothesesGtmArgs, 'projectHypothesisId'>>;
  createHypothesesGtmDetailedChannel?: Resolver<ResolversTypes['HypothesesGtmDetailedChannel'], ParentType, ContextType, RequireFields<MutationCreateHypothesesGtmDetailedChannelArgs, 'input'>>;
  createHypothesesMarketResearch?: Resolver<ResolversTypes['HypothesesMarketResearch'], ParentType, ContextType, RequireFields<MutationCreateHypothesesMarketResearchArgs, 'projectHypothesisId'>>;
  createHypothesesPacking?: Resolver<ResolversTypes['HypothesesPacking'], ParentType, ContextType, RequireFields<MutationCreateHypothesesPackingArgs, 'projectHypothesisId'>>;
  createHypothesesValidation?: Resolver<ResolversTypes['HypothesesValidation'], ParentType, ContextType, RequireFields<MutationCreateHypothesesValidationArgs, 'projectHypothesisId'>>;
  createPromoCode?: Resolver<ResolversTypes['PromoCode'], ParentType, ContextType, RequireFields<MutationCreatePromoCodeArgs, 'code' | 'subscriptionType'>>;
  createRequestFeature?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCreateRequestFeatureArgs, 'requestedFeature'>>;
  createSeoAgentBacklogIdea?: Resolver<ResolversTypes['BacklogIdea'], ParentType, ContextType, RequireFields<MutationCreateSeoAgentBacklogIdeaArgs, 'input' | 'projectId'>>;
  createSeoAgentCluster?: Resolver<ResolversTypes['SeoCluster'], ParentType, ContextType, RequireFields<MutationCreateSeoAgentClusterArgs, 'input'>>;
  createSubscriptionCheckout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, Partial<MutationCreateSubscriptionCheckoutArgs>>;
  deleteBacklogIdea?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteBacklogIdeaArgs, 'id'>>;
  deleteContentItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContentItemArgs, 'id'>>;
  deleteProjectHypothesis?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteProjectHypothesisArgs, 'id'>>;
  deleteSeoAgentBacklogIdea?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSeoAgentBacklogIdeaArgs, 'id'>>;
  deleteSeoAgentCluster?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSeoAgentClusterArgs, 'id'>>;
  deleteSeoCluster?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSeoClusterArgs, 'id'>>;
  dismissContentIdea?: Resolver<ResolversTypes['ContentIdea'], ParentType, ContextType, RequireFields<MutationDismissContentIdeaArgs, 'id'>>;
  forgotPassword?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationForgotPasswordArgs, 'email'>>;
  generateContentForBacklogIdea?: Resolver<ResolversTypes['ContentItem'], ParentType, ContextType, RequireFields<MutationGenerateContentForBacklogIdeaArgs, 'input'>>;
  generateContentIdeas?: Resolver<Array<ResolversTypes['ContentIdea']>, ParentType, ContextType, RequireFields<MutationGenerateContentIdeasArgs, 'hypothesisId' | 'projectId'>>;
  generateHypothesesGtmDetailedChannelContentIdea?: Resolver<ResolversTypes['GtmChannelContentIdea'], ParentType, ContextType, RequireFields<MutationGenerateHypothesesGtmDetailedChannelContentIdeaArgs, 'input'>>;
  generateImageForContent?: Resolver<ResolversTypes['ContentItem'], ParentType, ContextType, RequireFields<MutationGenerateImageForContentArgs, 'input'>>;
  generateTokenThrowEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationGenerateTokenThrowEmailArgs, 'input'>>;
  logFrontendMessage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationLogFrontendMessageArgs, 'level' | 'message'>>;
  login?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, Partial<MutationLoginArgs>>;
  publishToWordPress?: Resolver<ResolversTypes['PublishToWordPressResult'], ParentType, ContextType, RequireFields<MutationPublishToWordPressArgs, 'input'>>;
  regenerateContent?: Resolver<ResolversTypes['ContentItem'], ParentType, ContextType, RequireFields<MutationRegenerateContentArgs, 'id'>>;
  regenerateHypothesesCore?: Resolver<ResolversTypes['HypothesesCore'], ParentType, ContextType, RequireFields<MutationRegenerateHypothesesCoreArgs, 'input'>>;
  regenerateHypothesesGtm?: Resolver<ResolversTypes['HypothesesGtm'], ParentType, ContextType, RequireFields<MutationRegenerateHypothesesGtmArgs, 'input'>>;
  regenerateHypothesesGtmDetailedChannel?: Resolver<ResolversTypes['HypothesesGtmDetailedChannel'], ParentType, ContextType, RequireFields<MutationRegenerateHypothesesGtmDetailedChannelArgs, 'input'>>;
  regenerateHypothesesMarketResearch?: Resolver<ResolversTypes['HypothesesMarketResearch'], ParentType, ContextType, RequireFields<MutationRegenerateHypothesesMarketResearchArgs, 'input'>>;
  regenerateHypothesesPacking?: Resolver<ResolversTypes['HypothesesPacking'], ParentType, ContextType, RequireFields<MutationRegenerateHypothesesPackingArgs, 'input'>>;
  regenerateHypothesesValidation?: Resolver<ResolversTypes['HypothesesValidation'], ParentType, ContextType, RequireFields<MutationRegenerateHypothesesValidationArgs, 'input'>>;
  register?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType, RequireFields<MutationRegisterArgs, 'input'>>;
  rewriteTextSelection?: Resolver<ResolversTypes['RewriteTextSelectionResult'], ParentType, ContextType, RequireFields<MutationRewriteTextSelectionArgs, 'input'>>;
  testWordPressConnection?: Resolver<ResolversTypes['TestWordPressConnectionResult'], ParentType, ContextType, RequireFields<MutationTestWordPressConnectionArgs, 'input'>>;
  updateSeoAgentBacklogIdea?: Resolver<ResolversTypes['BacklogIdea'], ParentType, ContextType, RequireFields<MutationUpdateSeoAgentBacklogIdeaArgs, 'id' | 'input'>>;
  updateSeoAgentCluster?: Resolver<ResolversTypes['SeoCluster'], ParentType, ContextType, RequireFields<MutationUpdateSeoAgentClusterArgs, 'id' | 'input'>>;
  updateSeoAgentPostingSettings?: Resolver<ResolversTypes['PostingSettings'], ParentType, ContextType, RequireFields<MutationUpdateSeoAgentPostingSettingsArgs, 'input'>>;
  uploadHypothesesValidationCustomerInterview?: Resolver<ResolversTypes['HypothesesValidation'], ParentType, ContextType, RequireFields<MutationUploadHypothesesValidationCustomerInterviewArgs, 'input'>>;
  upsertBacklogIdea?: Resolver<ResolversTypes['BacklogIdea'], ParentType, ContextType, RequireFields<MutationUpsertBacklogIdeaArgs, 'input'>>;
  upsertContentItem?: Resolver<ResolversTypes['ContentItem'], ParentType, ContextType, RequireFields<MutationUpsertContentItemArgs, 'input'>>;
  upsertSeoCluster?: Resolver<ResolversTypes['SeoCluster'], ParentType, ContextType, RequireFields<MutationUpsertSeoClusterArgs, 'input'>>;
};

export type PostingSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['PostingSettings'] = ResolversParentTypes['PostingSettings']> = {
  autoPublishEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hypothesisId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  preferredDays?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  timezone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  weeklyPublishCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  wordpressBaseUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  wordpressConnected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  wordpressDefaultCategoryId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  wordpressDefaultTagIds?: Resolver<Array<ResolversTypes['Int']>, ParentType, ContextType>;
  wordpressPostType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  wordpressUsername?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectResolvers<ContextType = any, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = {
  assistantId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  generationStatus?: Resolver<ResolversTypes['ProjectGenerationStatus'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  info?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startType?: Resolver<ResolversTypes['ProjectStartType'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectAssistantResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectAssistant'] = ResolversParentTypes['ProjectAssistant']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  systemInstruction?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectDtoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectDto'] = ResolversParentTypes['ProjectDto']> = {
  generationStatus?: Resolver<ResolversTypes['ProjectGenerationStatus'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProjectHypothesesResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectHypotheses'] = ResolversParentTypes['ProjectHypotheses']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PromoCodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['PromoCode'] = ResolversParentTypes['PromoCode']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  durationMonths?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  expiresAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  maxUses?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  subscriptionType?: Resolver<ResolversTypes['SubscriptionType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  usedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PromoCodeInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PromoCodeInfo'] = ResolversParentTypes['PromoCodeInfo']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  durationMonths?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subscriptionType?: Resolver<ResolversTypes['SubscriptionType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PublishToWordPressResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['PublishToWordPressResult'] = ResolversParentTypes['PublishToWordPressResult']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  wordPressPostId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  wordPressPostUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  contentItemByBacklogIdea?: Resolver<Maybe<ResolversTypes['ContentItem']>, ParentType, ContextType, RequireFields<QueryContentItemByBacklogIdeaArgs, 'backlogIdeaId'>>;
  getAllHypothesesPersonProfiles?: Resolver<Array<ResolversTypes['HypothesesPersonProfile']>, ParentType, ContextType, RequireFields<QueryGetAllHypothesesPersonProfilesArgs, 'projectHypothesisId'>>;
  getAllPromoCodes?: Resolver<Array<ResolversTypes['PromoCode']>, ParentType, ContextType>;
  getAssistantMessages?: Resolver<ResolversTypes['AssistantMessages'], ParentType, ContextType>;
  getHypothesesCore?: Resolver<ResolversTypes['HypothesesCore'], ParentType, ContextType, RequireFields<QueryGetHypothesesCoreArgs, 'projectHypothesisId'>>;
  getHypothesesGtm?: Resolver<Maybe<ResolversTypes['HypothesesGtm']>, ParentType, ContextType, RequireFields<QueryGetHypothesesGtmArgs, 'projectHypothesisId'>>;
  getHypothesesGtmDetailedChannel?: Resolver<Maybe<ResolversTypes['HypothesesGtmDetailedChannel']>, ParentType, ContextType, RequireFields<QueryGetHypothesesGtmDetailedChannelArgs, 'input'>>;
  getHypothesesMarketResearch?: Resolver<Maybe<ResolversTypes['HypothesesMarketResearch']>, ParentType, ContextType, RequireFields<QueryGetHypothesesMarketResearchArgs, 'projectHypothesisId'>>;
  getHypothesesPacking?: Resolver<Maybe<ResolversTypes['HypothesesPacking']>, ParentType, ContextType, RequireFields<QueryGetHypothesesPackingArgs, 'projectHypothesisId'>>;
  getHypothesesValidation?: Resolver<Maybe<ResolversTypes['HypothesesValidation']>, ParentType, ContextType, RequireFields<QueryGetHypothesesValidationArgs, 'projectHypothesisId'>>;
  getProjectAssistant?: Resolver<ResolversTypes['ProjectAssistant'], ParentType, ContextType, RequireFields<QueryGetProjectAssistantArgs, 'projectId'>>;
  getProjectHypotheses?: Resolver<Array<ResolversTypes['ProjectHypotheses']>, ParentType, ContextType, RequireFields<QueryGetProjectHypothesesArgs, 'projectId'>>;
  getProjects?: Resolver<Array<ResolversTypes['ProjectDto']>, ParentType, ContextType>;
  getPromoCodeInfo?: Resolver<ResolversTypes['PromoCodeInfo'], ParentType, ContextType, RequireFields<QueryGetPromoCodeInfoArgs, 'code'>>;
  getSubscription?: Resolver<Maybe<ResolversTypes['Subscription']>, ParentType, ContextType>;
  getSubscriptionStripeSession?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  getUserByToken?: Resolver<ResolversTypes['AuthResponse'], ParentType, ContextType>;
  seoAgentBacklog?: Resolver<Array<ResolversTypes['BacklogIdea']>, ParentType, ContextType, RequireFields<QuerySeoAgentBacklogArgs, 'projectId'>>;
  seoAgentClusters?: Resolver<Array<ResolversTypes['SeoCluster']>, ParentType, ContextType, RequireFields<QuerySeoAgentClustersArgs, 'projectId'>>;
  seoAgentContentIdeas?: Resolver<Array<ResolversTypes['ContentIdea']>, ParentType, ContextType, RequireFields<QuerySeoAgentContentIdeasArgs, 'projectId'>>;
  seoAgentPostingSettings?: Resolver<Maybe<ResolversTypes['PostingSettings']>, ParentType, ContextType, RequireFields<QuerySeoAgentPostingSettingsArgs, 'projectId'>>;
  seoBacklog?: Resolver<Array<ResolversTypes['BacklogIdea']>, ParentType, ContextType, RequireFields<QuerySeoBacklogArgs, 'projectId'>>;
  seoClusters?: Resolver<Array<ResolversTypes['SeoCluster']>, ParentType, ContextType, RequireFields<QuerySeoClustersArgs, 'hypothesisId' | 'projectId'>>;
  seoContentQueue?: Resolver<Array<ResolversTypes['ContentItem']>, ParentType, ContextType, RequireFields<QuerySeoContentQueueArgs, 'projectId'>>;
  test?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  wordpressCategories?: Resolver<Array<ResolversTypes['WordPressCategory']>, ParentType, ContextType, RequireFields<QueryWordpressCategoriesArgs, 'input'>>;
  wordpressPostTypes?: Resolver<Array<ResolversTypes['WordPressPostType']>, ParentType, ContextType, RequireFields<QueryWordpressPostTypesArgs, 'input'>>;
  wordpressTags?: Resolver<Array<ResolversTypes['WordPressTag']>, ParentType, ContextType, RequireFields<QueryWordpressTagsArgs, 'input'>>;
};

export type RequestFeatureResolvers<ContextType = any, ParentType extends ResolversParentTypes['RequestFeature'] = ResolversParentTypes['RequestFeature']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  requestedFeature?: Resolver<ResolversTypes['RequestedFeature'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ResetPasswordResolvers<ContextType = any, ParentType extends ResolversParentTypes['ResetPassword'] = ResolversParentTypes['ResetPassword']> = {
  expire?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  resetCode?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RewriteTextSelectionResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['RewriteTextSelectionResult'] = ResolversParentTypes['RewriteTextSelectionResult']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rewrittenText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SeoClusterResolvers<ContextType = any, ParentType extends ResolversParentTypes['SeoCluster'] = ResolversParentTypes['SeoCluster']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  hypothesisId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  intent?: Resolver<ResolversTypes['SeoClusterIntent'], ParentType, ContextType>;
  keywords?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  projectId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  customerId?: SubscriptionResolver<ResolversTypes['String'], "customerId", ParentType, ContextType>;
  endDate?: SubscriptionResolver<ResolversTypes['Date'], "endDate", ParentType, ContextType>;
  id?: SubscriptionResolver<ResolversTypes['ID'], "id", ParentType, ContextType>;
  price?: SubscriptionResolver<ResolversTypes['Float'], "price", ParentType, ContextType>;
  startDate?: SubscriptionResolver<ResolversTypes['Date'], "startDate", ParentType, ContextType>;
  status?: SubscriptionResolver<ResolversTypes['SubscriptionStatus'], "status", ParentType, ContextType>;
  stripeSubscriptionId?: SubscriptionResolver<ResolversTypes['String'], "stripeSubscriptionId", ParentType, ContextType>;
  type?: SubscriptionResolver<ResolversTypes['SubscriptionType'], "type", ParentType, ContextType>;
  userId?: SubscriptionResolver<ResolversTypes['ID'], "userId", ParentType, ContextType>;
};

export type SummaryInterviewResolvers<ContextType = any, ParentType extends ResolversParentTypes['SummaryInterview'] = ResolversParentTypes['SummaryInterview']> = {
  goals?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  hypotheses?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  pains?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  toneOfVoice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TestWordPressConnectionResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['TestWordPressConnectionResult'] = ResolversParentTypes['TestWordPressConnectionResult']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TextIsCompletedResolvers<ContextType = any, ParentType extends ResolversParentTypes['TextIsCompleted'] = ResolversParentTypes['TextIsCompleted']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isCompleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  freeTrialDueTo?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isProjectGenerated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isProjectGenerationStarted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  passwordHash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  resetPassword?: Resolver<Maybe<ResolversTypes['ResetPassword']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  timeZoneOffset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserDtoResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserDTO'] = ResolversParentTypes['UserDTO']> = {
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  freeTrialDueTo?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WordPressCategoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['WordPressCategory'] = ResolversParentTypes['WordPressCategory']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WordPressPostTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['WordPressPostType'] = ResolversParentTypes['WordPressPostType']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  public?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WordPressTagResolvers<ContextType = any, ParentType extends ResolversParentTypes['WordPressTag'] = ResolversParentTypes['WordPressTag']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  ActivatePromoCodeResponse?: ActivatePromoCodeResponseResolvers<ContextType>;
  AssistantMessages?: AssistantMessagesResolvers<ContextType>;
  AuthResponse?: AuthResponseResolvers<ContextType>;
  BacklogIdea?: BacklogIdeaResolvers<ContextType>;
  Channel?: ChannelResolvers<ContextType>;
  ChannelVariant?: ChannelVariantResolvers<ContextType>;
  Cjm?: CjmResolvers<ContextType>;
  CjmPart?: CjmPartResolvers<ContextType>;
  ContentIdea?: ContentIdeaResolvers<ContextType>;
  ContentItem?: ContentItemResolvers<ContextType>;
  CustomerSegment?: CustomerSegmentResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  GtmChannelActionPlan?: GtmChannelActionPlanResolvers<ContextType>;
  GtmChannelContentIdea?: GtmChannelContentIdeaResolvers<ContextType>;
  GtmChannelMetricsAndKpis?: GtmChannelMetricsAndKpisResolvers<ContextType>;
  HypothesesCore?: HypothesesCoreResolvers<ContextType>;
  HypothesesGtm?: HypothesesGtmResolvers<ContextType>;
  HypothesesGtmChannel?: HypothesesGtmChannelResolvers<ContextType>;
  HypothesesGtmDetailedChannel?: HypothesesGtmDetailedChannelResolvers<ContextType>;
  HypothesesGtmStage?: HypothesesGtmStageResolvers<ContextType>;
  HypothesesMarketResearch?: HypothesesMarketResearchResolvers<ContextType>;
  HypothesesPacking?: HypothesesPackingResolvers<ContextType>;
  HypothesesPersonProfile?: HypothesesPersonProfileResolvers<ContextType>;
  HypothesesValidation?: HypothesesValidationResolvers<ContextType>;
  Jbtd?: JbtdResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PostingSettings?: PostingSettingsResolvers<ContextType>;
  Project?: ProjectResolvers<ContextType>;
  ProjectAssistant?: ProjectAssistantResolvers<ContextType>;
  ProjectDto?: ProjectDtoResolvers<ContextType>;
  ProjectHypotheses?: ProjectHypothesesResolvers<ContextType>;
  PromoCode?: PromoCodeResolvers<ContextType>;
  PromoCodeInfo?: PromoCodeInfoResolvers<ContextType>;
  PublishToWordPressResult?: PublishToWordPressResultResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RequestFeature?: RequestFeatureResolvers<ContextType>;
  ResetPassword?: ResetPasswordResolvers<ContextType>;
  RewriteTextSelectionResult?: RewriteTextSelectionResultResolvers<ContextType>;
  SeoCluster?: SeoClusterResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  SummaryInterview?: SummaryInterviewResolvers<ContextType>;
  TestWordPressConnectionResult?: TestWordPressConnectionResultResolvers<ContextType>;
  TextIsCompleted?: TextIsCompletedResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserDTO?: UserDtoResolvers<ContextType>;
  WordPressCategory?: WordPressCategoryResolvers<ContextType>;
  WordPressPostType?: WordPressPostTypeResolvers<ContextType>;
  WordPressTag?: WordPressTagResolvers<ContextType>;
};

