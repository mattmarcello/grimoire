import { Effect, Data } from "effect"
import { FileSystem } from "@effect/platform"

export class TopicWriterError extends Data.TaggedError("TopicWriterError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

interface TopicData {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly order: number
  readonly category?: string
  readonly tags?: ReadonlyArray<string>
  readonly relatedFiles?: ReadonlyArray<string>
  readonly content?: string
}

const formatFrontmatter = (data: TopicData): string => {
  const lines = [
    "---",
    `title: ${data.title}`,
    `slug: ${data.slug}`,
    `description: ${data.description}`,
    `order: ${data.order}`,
    `category: ${data.category ?? "general"}`,
    `tags: [${(data.tags ?? []).join(", ")}]`,
    `relatedFiles: [${(data.relatedFiles ?? []).join(", ")}]`,
    "---",
  ]
  return lines.join("\n")
}

export class TopicWriter extends Effect.Service<TopicWriter>()(
  "TopicWriter",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem

      const write = (topicsDir: string, data: TopicData) =>
        Effect.gen(function* () {
          const filename = `${String(data.order).padStart(2, "0")}-${data.slug}.md`
          const fullPath = `${topicsDir}/${filename}`
          const frontmatter = formatFrontmatter(data)
          const body = data.content ?? `\n# ${data.title}\n\nTODO: Add content for this topic.\n`
          const content = `${frontmatter}\n${body}\n`

          yield* fs.makeDirectory(topicsDir, { recursive: true })
          yield* fs.writeFileString(fullPath, content)

          return fullPath
        }).pipe(
          Effect.mapError(
            (cause) =>
              new TopicWriterError({ message: `Failed to write topic: ${data.slug}`, cause }),
          ),
        )

      const nextOrder = (topicsDir: string) =>
        Effect.gen(function* () {
          const exists = yield* fs.exists(topicsDir)
          if (!exists) return 0
          const files = yield* fs.readDirectory(topicsDir)
          const mdFiles = files.filter((f) => f.endsWith(".md"))
          return mdFiles.length
        }).pipe(
          Effect.mapError(
            (cause) => new TopicWriterError({ message: "Failed to read topics dir", cause }),
          ),
        )

      return { write, nextOrder }
    }),
  },
) {}
