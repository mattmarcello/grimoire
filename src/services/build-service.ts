import { Effect, Data } from "effect"
import { CommandExecutor, Command as PlatformCommand } from "@effect/platform"

export class BuildError extends Data.TaggedError("BuildError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class BuildService extends Effect.Service<BuildService>()(
  "BuildService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const executor = yield* CommandExecutor.CommandExecutor

      const runCommand = (cmd: string, args: ReadonlyArray<string>, cwd: string) =>
        Effect.gen(function* () {
          const command = PlatformCommand.make(cmd, ...args).pipe(
            PlatformCommand.workingDirectory(cwd),
          )
          const process = yield* executor.start(command)
          const exitCode = yield* process.exitCode
          if (exitCode !== 0) {
            return yield* Effect.fail(
              new BuildError({ message: `Command failed: ${cmd} ${args.join(" ")} (exit ${exitCode})` }),
            )
          }
        })

      const generateManifest = (projectDir: string) =>
        runCommand("tsx", ["scripts/generate-manifest.ts"], projectDir).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to generate manifest", cause }),
          ),
        )

      const bundle = (_projectDir: string) =>
        Effect.void

      const buildBinaries = (projectDir: string) =>
        runCommand("tsx", ["scripts/build-binaries.ts"], projectDir).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to build binaries", cause }),
          ),
        )

      const install = (projectDir: string) =>
        runCommand("npm", ["install"], projectDir).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to install dependencies", cause }),
          ),
        )

      const dev = (projectDir: string) =>
        Effect.gen(function* () {
          const command = PlatformCommand.make("tsx", "src/cli.ts").pipe(
            PlatformCommand.workingDirectory(projectDir),
          )
          const process = yield* executor.start(command)
          yield* process.exitCode
        }).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to start dev mode", cause }),
          ),
        )

      return { generateManifest, bundle, buildBinaries, install, dev }
    }),
  },
) {}
