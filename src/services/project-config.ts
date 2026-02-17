import { Effect, Data } from "effect"
import { FileSystem } from "@effect/platform"
import { ProjectConfig, decodeProjectConfig, encodeProjectConfig } from "../schemas/project-config.js"

const CONFIG_FILE = "grimoire.json"

export class ProjectConfigError extends Data.TaggedError("ProjectConfigError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class ProjectConfigService extends Effect.Service<ProjectConfigService>()(
  "ProjectConfigService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem

      const configPath = (dir: string) => `${dir}/${CONFIG_FILE}`

      const read = (dir: string) =>
        Effect.gen(function* () {
          const path = configPath(dir)
          const exists = yield* fs.exists(path)
          if (!exists) {
            return yield* Effect.fail(
              new ProjectConfigError({ message: `No ${CONFIG_FILE} found in ${dir}` }),
            )
          }
          const raw = yield* fs.readFileString(path)
          const json = JSON.parse(raw)
          return yield* decodeProjectConfig(json).pipe(
            Effect.mapError(
              (e) => new ProjectConfigError({ message: `Invalid ${CONFIG_FILE}`, cause: e }),
            ),
          )
        })

      const write = (dir: string, config: ProjectConfig) =>
        Effect.gen(function* () {
          const encoded = yield* encodeProjectConfig(config).pipe(
            Effect.mapError(
              (e) => new ProjectConfigError({ message: "Failed to encode config", cause: e }),
            ),
          )
          yield* fs.writeFileString(configPath(dir), JSON.stringify(encoded, null, 2) + "\n")
        })

      const exists = (dir: string) => fs.exists(configPath(dir))

      return { read, write, exists }
    }),
  },
) {}
