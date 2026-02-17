import { Command, Args } from "@effect/cli"
import { Effect } from "effect"
import { ProjectConfigService } from "../services/project-config.js"
import { ManifestGenerator } from "../services/manifest-generator.js"

const passthrough = Args.text({ name: "args" }).pipe(
  Args.withDescription("Arguments to pass to the dev CLI"),
  Args.repeated,
)

export const devCommand = Command.make("dev", {
  args: { passthrough },
}).pipe(
  Command.withDescription("Run the scaffolded CLI in development mode"),
  Command.withHandler(({ args }) =>
    Effect.gen(function* () {
      const configService = yield* ProjectConfigService
      const manifestGen = yield* ManifestGenerator

      const cwd = process.cwd()
      const config = yield* configService.read(cwd)

      // Regenerate manifest before running
      const topicsDir = `${cwd}/${config.topicsDir}`
      const manifestPath = `${cwd}/src/docs-manifest.ts`
      yield* manifestGen.generate(topicsDir, manifestPath)

      // Run the CLI
      const cliArgs = args.passthrough
      yield* Effect.tryPromise({
        try: async () => {
          const proc = Bun.spawn(["bun", "run", "src/cli.ts", ...cliArgs], {
            cwd,
            stdout: "inherit",
            stderr: "inherit",
            stdin: "inherit",
          })
          await proc.exited
        },
        catch: (e) => new Error(`Dev mode failed: ${e}`),
      })
    }),
  ),
)
