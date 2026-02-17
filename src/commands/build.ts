import { Command, Options } from "@effect/cli"
import { Console, Effect } from "effect"
import { ProjectConfigService } from "../services/project-config.js"
import { ManifestGenerator } from "../services/manifest-generator.js"
import * as render from "../lib/render.js"

const publishableOption = Options.boolean("publishable").pipe(
  Options.withDescription("Build cross-platform binaries"),
  Options.withDefault(false),
)

export const buildCommand = Command.make("build", {
  options: { publishable: publishableOption },
}).pipe(
  Command.withDescription("Build the scaffolded CLI"),
  Command.withHandler(({ options }) =>
    Effect.gen(function* () {
      const configService = yield* ProjectConfigService
      const manifestGen = yield* ManifestGenerator

      const cwd = process.cwd()
      const config = yield* configService.read(cwd)

      yield* Console.log("")
      yield* Console.log(render.banner("Building..."))
      yield* Console.log("")

      // Generate manifest
      yield* Console.log(render.info("Generating manifest..."))
      const topicsDir = `${cwd}/${config.topicsDir}`
      const manifestPath = `${cwd}/src/docs-manifest.ts`
      const topicCount = yield* manifestGen.generate(topicsDir, manifestPath)
      yield* Console.log(render.success(`Generated manifest with ${topicCount} topics`))

      if (options.publishable) {
        yield* Console.log(render.dim("Note: The scaffolded CLI runs via tsx. Publish to npm with 'npm publish'."))
      }

      yield* Console.log("")
      yield* Console.log(render.success("Build complete!"))
      yield* Console.log("")
    }),
  ),
)
