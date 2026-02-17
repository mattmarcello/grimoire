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

      // Bundle
      yield* Console.log(render.info("Bundling CLI..."))
      yield* Effect.tryPromise({
        try: async () => {
          const proc = Bun.spawn(["bun", "build", "src/cli.ts", "--outdir", "dist", "--target", "bun"], {
            cwd,
            stdout: "inherit",
            stderr: "inherit",
          })
          const exitCode = await proc.exited
          if (exitCode !== 0) throw new Error(`Bundle failed with exit code ${exitCode}`)
        },
        catch: (e) => new Error(`Bundle failed: ${e}`),
      })
      yield* Console.log(render.success("Bundle complete"))

      if (options.publishable) {
        yield* Console.log(render.info("Building cross-platform binaries..."))
        yield* Effect.tryPromise({
          try: async () => {
            const proc = Bun.spawn(["bun", "run", "scripts/build-binaries.ts"], {
              cwd,
              stdout: "inherit",
              stderr: "inherit",
            })
            const exitCode = await proc.exited
            if (exitCode !== 0) throw new Error(`Binary build failed with exit code ${exitCode}`)
          },
          catch: (e) => new Error(`Binary build failed: ${e}`),
        })
        yield* Console.log(render.success("Binaries built"))
      }

      yield* Console.log("")
      yield* Console.log(render.success("Build complete!"))
      yield* Console.log("")
    }),
  ),
)
