import gql from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  enum SeoClusterIntent {
    COMMERCIAL
    TRANSACTIONAL
    INFORMATIONAL
    NAVIGATIONAL
  }

  enum BacklogCategory {
    PAIN
    GOAL
    TRIGGER
    FEATURE
    BENEFIT
    FAQ
    INFO
  }

  enum BacklogStatus {
    PENDING
    SCHEDULED
    IN_PROGRESS
    COMPLETED
    ARCHIVED
    BACKLOG
  }

  enum BacklogContentType {
    ARTICLE
    COMMERCIAL_PAGE
    LANDING_PAGE
  }

  enum ContentCategory {
    PAINS
    GOALS
    TRIGGERS
    PRODUCT_FEATURES
    BENEFITS
    FAQS
    INFORMATIONAL
  }

  enum ContentIdeaStatus {
    NEW
    ADDED_TO_BACKLOG
    DISMISSED
  }

  enum ContentIdeaType {
    ARTICLE
    COMMERCIAL_PAGE
    LANDING_PAGE
  }

  enum ContentStatus {
    DRAFT
    REVIEW
    READY
    PUBLISHED
  }

  enum ContentFormat {
    BLOG
    COMMERCIAL
    FAQ
  }

  type SeoCluster {
    id: ID!
    projectId: ID!
    hypothesisId: ID!
    title: String!
    intent: SeoClusterIntent!
    keywords: [String!]!
    createdBy: ID!
    updatedBy: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BacklogIdea {
    id: ID!
    projectId: ID!
    hypothesisId: ID
    clusterId: ID
    title: String!
    description: String
    contentType: BacklogContentType!
    category: BacklogCategory
    status: BacklogStatus!
    scheduledDate: DateTime
    createdBy: ID
    updatedBy: ID
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ContentIdea {
    id: ID!
    projectId: ID!
    hypothesisId: ID
    title: String!
    description: String
    category: ContentCategory!
    contentType: ContentIdeaType!
    clusterId: ID
    status: ContentIdeaStatus!
    dismissed: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ContentItem {
    id: ID!
    projectId: ID!
    hypothesisId: ID!
    backlogIdeaId: ID
    title: String!
    category: BacklogCategory!
    format: ContentFormat!
    ownerId: ID
    reviewerId: ID
    channel: String
    outline: String
    content: String
    imageUrl: String
    status: ContentStatus!
    dueDate: DateTime
    createdBy: ID!
    updatedBy: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PostingSettings {
    id: ID!
    projectId: ID!
    hypothesisId: ID
    weeklyPublishCount: Int!
    preferredDays: [String!]!
    autoPublishEnabled: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ClusterInput {
    id: ID
    projectId: ID!
    hypothesisId: ID!
    title: String!
    intent: SeoClusterIntent!
    keywords: [String!]!
    userId: ID!
  }

  input BacklogIdeaInput {
    id: ID
    projectId: ID!
    hypothesisId: ID
    clusterId: ID
    title: String!
    description: String
    contentType: BacklogContentType!
    category: BacklogCategory
    status: BacklogStatus
    scheduledDate: DateTime
    userId: ID
  }

  input SeoAgentBacklogIdeaInput {
    title: String!
    description: String
    contentType: BacklogContentType!
    status: BacklogStatus
    clusterId: ID
    scheduledDate: DateTime
  }

  input AddContentIdeaToBacklogInput {
    contentIdeaId: ID!
    title: String!
    description: String
    contentType: BacklogContentType!
    clusterId: ID
  }

  input CreateCustomContentIdeaInput {
    projectId: ID!
    hypothesisId: ID
    title: String!
    description: String
    category: ContentCategory!
    contentType: ContentIdeaType!
    clusterId: ID
  }

  input PostingSettingsInput {
    projectId: ID!
    hypothesisId: ID
    weeklyPublishCount: Int!
    preferredDays: [String!]!
    autoPublishEnabled: Boolean!
  }

  input ContentItemInput {
    id: ID
    projectId: ID!
    hypothesisId: ID!
    backlogIdeaId: ID
    title: String!
    category: BacklogCategory!
    format: ContentFormat!
    ownerId: ID
    reviewerId: ID
    channel: String
    outline: String
    content: String
    imageUrl: String
    status: ContentStatus
    dueDate: DateTime
    userId: ID!
  }

  input GenerateContentInput {
    backlogIdeaId: ID!
    projectId: ID!
    hypothesisId: ID
  }

  input GenerateImageInput {
    contentItemId: ID!
    title: String!
    description: String
  }

  input ApproveContentItemInput {
    contentItemId: ID!
    projectId: ID!
    hypothesisId: ID
  }

  type Query {
    _health: String!
    seoClusters(projectId: ID!, hypothesisId: ID): [SeoCluster!]!
    seoAgentClusters(projectId: ID!, hypothesisId: ID): [SeoCluster!]!
    seoBacklog(projectId: ID!, hypothesisId: ID, status: BacklogStatus): [BacklogIdea!]!
    seoAgentBacklog(projectId: ID!, hypothesisId: ID): [BacklogIdea!]!
    seoAgentContentIdeas(projectId: ID!, hypothesisId: ID): [ContentIdea!]!
    seoAgentPostingSettings(projectId: ID!): PostingSettings
    seoContentQueue(projectId: ID!, hypothesisId: ID, status: ContentStatus): [ContentItem!]!
    contentItemByBacklogIdea(backlogIdeaId: ID!): ContentItem
  }

  type Mutation {
    upsertSeoCluster(input: ClusterInput!): SeoCluster!
    createSeoAgentCluster(input: ClusterInput!): SeoCluster!
    updateSeoAgentCluster(id: ID!, input: ClusterInput!): SeoCluster!
    deleteSeoCluster(id: ID!): Boolean!
    deleteSeoAgentCluster(id: ID!): Boolean!

    upsertBacklogIdea(input: BacklogIdeaInput!): BacklogIdea!
    updateSeoAgentBacklogIdea(id: ID!, input: SeoAgentBacklogIdeaInput!): BacklogIdea!
    deleteBacklogIdea(id: ID!): Boolean!
    deleteSeoAgentBacklogIdea(id: ID!): Boolean!

    addContentIdeaToBacklog(input: AddContentIdeaToBacklogInput!): BacklogIdea!
    dismissContentIdea(id: ID!): ContentIdea!
    createCustomContentIdea(input: CreateCustomContentIdeaInput!): ContentIdea!

    updateSeoAgentPostingSettings(input: PostingSettingsInput!): PostingSettings!

    upsertContentItem(input: ContentItemInput!): ContentItem!
    deleteContentItem(id: ID!): Boolean!
    generateContentForBacklogIdea(input: GenerateContentInput!): ContentItem!
    generateImageForContent(input: GenerateImageInput!): ContentItem!
    regenerateContent(id: ID!, promptPart: String): ContentItem!
    approveContentItem(input: ApproveContentItemInput!): ContentItem!
  }
`;

