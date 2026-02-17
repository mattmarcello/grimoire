import { Schema } from "effect"

export class TopicFrontmatter extends Schema.Class<TopicFrontmatter>("TopicFrontmatter")({
  title: Schema.String,
  slug: Schema.String,
  description: Schema.String,
  order: Schema.Number,
  category: Schema.optionalWith(Schema.String, { default: () => "general" }),
  tags: Schema.optionalWith(Schema.Array(Schema.String), { default: () => [] }),
  relatedFiles: Schema.optionalWith(Schema.Array(Schema.String), { default: () => [] }),
}) {}

export class Topic extends Schema.Class<Topic>("Topic")({
  frontmatter: TopicFrontmatter,
  content: Schema.String,
  filePath: Schema.String,
}) {}
