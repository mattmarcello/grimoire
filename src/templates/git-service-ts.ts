export const gitServiceTs = (): string =>
  `import { Effect } from "effect"
import { Command as PlatformCommand } from "@effect/platform"

export class GitError extends Effect.TaggedError("GitError")<{
  readonly message: string
  readonly command: string
}> {}

const exec = (args: readonly string[]) =>
  Effect.gen(function* () {
    const command = PlatformCommand.make("git", ...args)
    const process = yield* PlatformCommand.start(command)
    const output = yield* PlatformCommand.stdout(process, "text")
    return output.trim()
  }).pipe(
    Effect.mapError(
      (cause) =>
        new GitError({ message: String(cause), command: \`git \${args.join(" ")}\` }),
    ),
  )

export const getCurrentBranch = () => exec(["rev-parse", "--abbrev-ref", "HEAD"])

export const getRemoteUrl = () => exec(["config", "--get", "remote.origin.url"])

export const isGitRepo = () =>
  exec(["rev-parse", "--is-inside-work-tree"]).pipe(
    Effect.map(() => true),
    Effect.catchAll(() => Effect.succeed(false)),
  )
`
