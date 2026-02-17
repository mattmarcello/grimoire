import { Effect, Data, Schedule } from "effect"

export class UpdateNotifier extends Effect.Service<UpdateNotifier>()(
  "UpdateNotifier",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const check = (packageName: string, currentVersion: string) =>
        Effect.gen(function* () {
          const response = yield* Effect.tryPromise({
            try: () => fetch(`https://registry.npmjs.org/${packageName}/latest`),
            catch: () => new UpdateCheckError({ message: "Failed to fetch registry" }),
          })
          const data = yield* Effect.tryPromise({
            try: () => response.json() as Promise<{ version: string }>,
            catch: () => new UpdateCheckError({ message: "Failed to parse response" }),
          })
          const latest = data.version
          if (latest !== currentVersion) {
            return { updateAvailable: true as const, current: currentVersion, latest }
          }
          return { updateAvailable: false as const, current: currentVersion, latest }
        }).pipe(
          Effect.timeout("5 seconds"),
          Effect.orElseSucceed(() => ({
            updateAvailable: false as const,
            current: currentVersion,
            latest: currentVersion,
          })),
        )

      return { check }
    }),
  },
) {}

export class UpdateCheckError extends Data.TaggedError("UpdateCheckError")<{
  readonly message: string
}> {}
