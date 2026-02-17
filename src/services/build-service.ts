import { Effect, Data } from "effect"
import { FileSystem, CommandExecutor, Command as PlatformCommand } from "@effect/platform"

export class BuildError extends Data.TaggedError("BuildError")<{
  readonly message: string
  readonly cause?: unknown
}> {}

export class BuildService extends Effect.Service<BuildService>()(
  "BuildService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
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
        runCommand("bun", ["run", "generate-manifest"], projectDir).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to generate manifest", cause }),
          ),
        )

      const bundle = (projectDir: string) =>
        runCommand("bun", ["build", "src/cli.ts", "--outdir", "dist", "--target", "bun"], projectDir).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to bundle CLI", cause }),
          ),
        )

      const buildBinaries = (projectDir: string) =>
        runCommand("bun", ["run", "scripts/build-binaries.ts"], projectDir).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to build binaries", cause }),
          ),
        )

      const install = (projectDir: string) =>
        runCommand("bun", ["install"], projectDir).pipe(
          Effect.mapError(
            (cause) => new BuildError({ message: "Failed to install dependencies", cause }),
          ),
        )

      const dev = (projectDir: string) =>
        Effect.gen(function* () {
          const command = PlatformCommand.make("bun", "run", "src/cli.ts").pipe(
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
