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
    BACKLOG
    SCHEDULED
    ARCHIVED
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
    hypothesisId: ID!
    clusterId: ID
    title: String!
    description: String!
    category: BacklogCategory!
    status: BacklogStatus!
    createdBy: ID!
    updatedBy: ID!
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
    status: ContentStatus!
    dueDate: DateTime
    createdBy: ID!
    updatedBy: ID!
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
    hypothesisId: ID!
    clusterId: ID
    title: String!
    description: String!
    category: BacklogCategory!
    status: BacklogStatus
    userId: ID!
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
    status: ContentStatus
    dueDate: DateTime
    userId: ID!
  }

  type Query {
    _health: String!
    seoClusters(projectId: ID!, hypothesisId: ID!): [SeoCluster!]!
    seoBacklog(projectId: ID!, hypothesisId: ID!, status: BacklogStatus): [BacklogIdea!]!
    seoContentQueue(projectId: ID!, hypothesisId: ID!, status: ContentStatus): [ContentItem!]!
  }

  type Mutation {
    upsertSeoCluster(input: ClusterInput!): SeoCluster!
    deleteSeoCluster(id: ID!): Boolean!

    upsertBacklogIdea(input: BacklogIdeaInput!): BacklogIdea!
    deleteBacklogIdea(id: ID!): Boolean!

    upsertContentItem(input: ContentItemInput!): ContentItem!
    deleteContentItem(id: ID!): Boolean!
  }
`;

