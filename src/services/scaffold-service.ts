import { Effect, Data } from "effect"
import { FileSystem } from "@effect/platform"
import type { ProjectConfig } from "../schemas/project-config.js"
import * as templates from "../templates/index.js"

export class ScaffoldError extends Data.TaggedError("ScaffoldError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

interface FileEntry {
  readonly path: string
  readonly content: string
}

export class ScaffoldService extends Effect.Service<ScaffoldService>()(
  "ScaffoldService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem

      const scaffold = (targetDir: string, config: ProjectConfig) =>
        Effect.gen(function* () {
          const files: FileEntry[] = [
            { path: "package.json", content: templates.packageJson(config) },
            { path: "tsconfig.json", content: templates.tsconfigJson() },
            { path: "bin.js", content: templates.binJs() },
            { path: "src/cli.ts", content: templates.cliTs(config) },
            { path: "src/render.ts", content: templates.renderTs() },
            { path: "src/docs-manifest.ts", content: templates.docsManifestTs(config) },
            { path: "src/services/.gitkeep", content: "" },
            { path: "scripts/generate-manifest.ts", content: templates.generateManifestTs(config) },
            { path: "scripts/build-binaries.ts", content: templates.buildBinariesTs(config) },
            { path: `${config.topicsDir}/00-overview.md`, content: templates.overviewMd(config) },
          ]

          const createdFiles: string[] = []

          for (const file of files) {
            const fullPath = `${targetDir}/${file.path}`
            const dir = fullPath.split("/").slice(0, -1).join("/")
            yield* fs.makeDirectory(dir, { recursive: true })
            yield* fs.writeFileString(fullPath, file.content)
            createdFiles.push(file.path)
          }

          return createdFiles
        }).pipe(
          Effect.mapError(
            (cause) => new ScaffoldError({ message: "Failed to scaffold project", cause }),
          ),
        )

      return { scaffold }
    }),
  },
) {}
