import { Effect } from "effect"
import { FileSystem } from "@effect/platform"
import type { GitignoreMatcher } from "./gitignore.js"

export interface FileEntry {
  readonly path: string
  readonly relativePath: string
  readonly isDirectory: boolean
}

export const readTree = (
  rootDir: string,
  matcher: GitignoreMatcher,
  maxDepth = 5,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const entries: FileEntry[] = []

    const walk = (dir: string, depth: number): Effect.Effect<void, Error> =>
      Effect.gen(function* () {
        if (depth > maxDepth) return

        const items = yield* fs.readDirectory(dir)
        for (const item of items) {
          const fullPath = `${dir}/${item}`
          const relativePath = fullPath.slice(rootDir.length + 1)

          if (matcher.isIgnored(relativePath)) continue

          const stat = yield* fs.stat(fullPath)
          const isDirectory = stat.type === "Directory"

          entries.push({ path: fullPath, relativePath, isDirectory })

          if (isDirectory) {
            yield* walk(fullPath, depth + 1)
          }
        }
      })

    yield* walk(rootDir, 0)
    return entries
  })

export const formatTree = (entries: ReadonlyArray<FileEntry>): string => {
  const lines: string[] = []
  for (const entry of entries) {
    const depth = entry.relativePath.split("/").length - 1
    const indent = "  ".repeat(depth)
    const name = entry.relativePath.split("/").pop()!
    const suffix = entry.isDirectory ? "/" : ""
    lines.push(`${indent}${name}${suffix}`)
  }
  return lines.join("\n")
}
