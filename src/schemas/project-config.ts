import { Schema } from "effect"

export class ProjectConfig extends Schema.Class<ProjectConfig>("ProjectConfig")({
  name: Schema.String,
  cliName: Schema.String,
  description: Schema.String,
  version: Schema.optionalWith(Schema.String, { default: () => "0.1.0" }),
  targetRepo: Schema.optional(Schema.String),
  topicsDir: Schema.optionalWith(Schema.String, { default: () => "topics" }),
  outputDir: Schema.optionalWith(Schema.String, { default: () => "dist" }),
  binaries: Schema.optionalWith(Schema.Boolean, { default: () => false }),
}) {}

export const encodeProjectConfig = Schema.encode(ProjectConfig)
export const decodeProjectConfig = Schema.decode(ProjectConfig)
