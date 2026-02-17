import { Tool } from "@effect/ai"
import { Schema } from "effect"

export const ReadFileTree = Tool.make("ReadFileTree", {
  description: "Read the file tree of a directory up to a specified depth",
  parameters: {
    path: Schema.String.annotations({ description: "Root directory path" }),
    maxDepth: Schema.optionalWith(Schema.Number, { default: () => 4 }).annotations({
      description: "Maximum depth to traverse",
    }),
  },
  success: Schema.String,
})

export const ReadFile = Tool.make("ReadFile", {
  description: "Read the contents of a single file",
  parameters: {
    path: Schema.String.annotations({ description: "Absolute file path" }),
  },
  success: Schema.String,
})

export const ReadMultipleFiles = Tool.make("ReadMultipleFiles", {
  description: "Read the contents of multiple files at once",
  parameters: {
    paths: Schema.Array(Schema.String).annotations({ description: "Array of absolute file paths" }),
  },
  success: Schema.Array(Schema.Struct({
    path: Schema.String,
    content: Schema.String,
  })),
})

export const SearchFiles = Tool.make("SearchFiles", {
  description: "Search for files matching a pattern in the codebase",
  parameters: {
    rootDir: Schema.String.annotations({ description: "Root directory to search" }),
    pattern: Schema.String.annotations({ description: "Regex pattern to match file paths" }),
  },
  success: Schema.Array(Schema.String),
})

export const GrepCodebase = Tool.make("GrepCodebase", {
  description: "Search file contents for a pattern",
  parameters: {
    rootDir: Schema.String.annotations({ description: "Root directory to search" }),
    pattern: Schema.String.annotations({ description: "Regex pattern to search for in file contents" }),
    fileGlob: Schema.optional(Schema.String).annotations({
      description: "Optional glob pattern to filter files",
    }),
  },
  success: Schema.Array(Schema.Struct({
    path: Schema.String,
    line: Schema.Number,
    text: Schema.String,
  })),
})
