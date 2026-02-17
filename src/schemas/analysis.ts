import { Schema } from "effect"

export class CodebaseOverview extends Schema.Class<CodebaseOverview>("CodebaseOverview")({
  projectName: Schema.String,
  projectType: Schema.String,
  language: Schema.String,
  buildSystem: Schema.String,
  description: Schema.String,
  keyModules: Schema.Array(Schema.Struct({
    name: Schema.String,
    path: Schema.String,
    description: Schema.String,
  })),
  architecturePatterns: Schema.Array(Schema.String),
  entryPoints: Schema.Array(Schema.String),
}) {}

export class TopicProposal extends Schema.Class<TopicProposal>("TopicProposal")({
  slug: Schema.String,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  relevantFiles: Schema.Array(Schema.String),
  order: Schema.Number,
}) {}

export class TopicProposalSet extends Schema.Class<TopicProposalSet>("TopicProposalSet")({
  proposals: Schema.Array(TopicProposal),
}) {}

export class GeneratedTopic extends Schema.Class<GeneratedTopic>("GeneratedTopic")({
  slug: Schema.String,
  title: Schema.String,
  description: Schema.String,
  category: Schema.String,
  order: Schema.Number,
  tags: Schema.Array(Schema.String),
  relatedFiles: Schema.Array(Schema.String),
  content: Schema.String,
}) {}
