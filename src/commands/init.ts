import { Args, Command, Options } from "@effect/cli"
import { Console, Config, Effect, Layer, Option, Redacted } from "effect"
import { FileSystem, FetchHttpClient } from "@effect/platform"
import { spawn } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { ProjectConfig } from "../schemas/project-config.js"
import { ProjectConfigService } from "../services/project-config.js"
import { ScaffoldService } from "../services/scaffold-service.js"
import { AgentPromptGenerator } from "../services/agent-prompt-generator.js"
import { TopicWriter } from "../services/topic-writer.js"
import { ManifestGenerator } from "../services/manifest-generator.js"
import * as render from "../lib/render.js"

const isUrl = (s: string) =>
  s.startsWith("https://") || s.startsWith("http://") || s.startsWith("git@")

const shallowClone = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    mkdtemp(join(tmpdir(), "grimoire-")).then((tempDir) => {
      const proc = spawn("git", ["clone", "--depth", "1", url, tempDir], {
        stdio: "inherit",
      })
      proc.on("close", (code) =>
        code === 0 ? resolve(tempDir) : reject(new Error(`git clone failed (exit ${code})`)),
      )
      proc.on("error", reject)
    }).catch(reject)
  })

const nameArg = Args.text({ name: "name" }).pipe(
  Args.withDescription("Project name (e.g. 'my-project')"),
  Args.optional,
)

const targetOption = Options.text("target").pipe(
  Options.withAlias("t"),
  Options.withDescription("Path or GitHub URL of the codebase to analyze"),
  Options.optional,
)

const modeOption = Options.choice("mode", ["agent", "api"]).pipe(
  Options.withDescription("Analysis mode: 'agent' generates a prompt file, 'api' calls OpenRouter directly"),
  Options.withDefault("agent"),
)

const descriptionOption = Options.text("description").pipe(
  Options.withAlias("d"),
  Options.withDescription("Project description"),
  Options.withDefault("A codebase navigation CLI"),
)

export const initCommand = Command.make("init", {
  args: { name: nameArg },
  options: { target: targetOption, mode: modeOption, description: descriptionOption },
}).pipe(
  Command.withDescription("Scaffold a new solutions CLI project"),
  Command.withHandler(({ args, options }) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const scaffold = yield* ScaffoldService
      const configService = yield* ProjectConfigService

      const targetRaw = Option.getOrUndefined(options.target)

      // Infer project name from target if not provided
      const projectName = Option.getOrElse(args.name, () => {
        if (targetRaw) {
          const cleaned = targetRaw.replace(/\/+$/, "").replace(/\.git$/, "")
          return cleaned.split("/").pop() ?? "my-project"
        }
        return "my-project"
      })

      const dirName = `${projectName}-solutions`
      const cwd = process.cwd()
      const targetDir = `${cwd}/${dirName}`

      const exists = yield* fs.exists(targetDir)
      if (exists) {
        yield* Console.log(render.error(`Directory ${dirName} already exists`))
        return
      }

      yield* Console.log("")
      yield* Console.log(render.banner(`Creating ${dirName}...`))
      yield* Console.log("")

      const config = new ProjectConfig({
        name: projectName,
        cliName: `${projectName}-solutions`,
        description: options.description,
      })

      yield* fs.makeDirectory(targetDir, { recursive: true })

      const createdFiles = yield* scaffold.scaffold(targetDir, config)
      yield* configService.write(targetDir, config)

      for (const file of createdFiles) {
        yield* Console.log(render.fileCreated(file))
      }
      yield* Console.log(render.fileCreated("grimoire.json"))

      yield* Console.log("")
      yield* Console.log(render.success(`Project created at ${dirName}/`))

      // If a target codebase was provided, run analysis
      if (!targetRaw) {
        yield* Console.log("")
        yield* Console.log(render.dim("Next steps:"))
        yield* Console.log(render.dim(`  cd ${dirName}`))
        yield* Console.log(render.dim("  npm install"))
        yield* Console.log(render.dim(`  npx tsx src/cli.ts list`))
        yield* Console.log("")
        return
      }

      // Resolve target: clone if URL, resolve if local path
      let codebasePath: string
      let clonedTempDir: string | undefined

      if (isUrl(targetRaw)) {
        yield* Console.log("")
        yield* Console.log(render.info(`Cloning ${targetRaw}...`))
        clonedTempDir = yield* Effect.tryPromise({
          try: () => shallowClone(targetRaw),
          catch: (e) => new Error(`Failed to clone: ${e}`),
        })
        codebasePath = clonedTempDir
      } else {
        codebasePath = targetRaw.startsWith("/")
          ? targetRaw
          : `${cwd}/${targetRaw}`
      }

      try {
        yield* Console.log("")
        yield* Console.log(render.banner(`Analyzing ${projectName}...`))
        yield* Console.log("")

        if (options.mode === "agent") {
          const generator = yield* AgentPromptGenerator
          const promptPath = `${targetDir}/analysis-prompt.md`

          yield* Console.log(render.info("Reading codebase..."))
          yield* generator.generate(codebasePath, promptPath, projectName)

          yield* Console.log("")
          yield* Console.log(render.success(`Analysis prompt written to ${dirName}/analysis-prompt.md`))
          yield* Console.log("")
          yield* Console.log(render.dim("Next steps:"))
          yield* Console.log(render.dim(`  cd ${dirName}`))
          yield* Console.log(render.dim(`  # Feed analysis-prompt.md to Claude Code to generate topics`))
          yield* Console.log(render.dim(`  grimoire build`))
          yield* Console.log(render.dim(`  npx tsx src/cli.ts list`))
          yield* Console.log("")
        } else {
          const topicWriter = yield* TopicWriter
          const manifestGen = yield* ManifestGenerator
          const topicsDir = `${targetDir}/${config.topicsDir}`

          const apiKey = process.env["OPENROUTER_API_KEY"]
          if (!apiKey) {
            yield* Console.log(render.error("OPENROUTER_API_KEY environment variable is required for --mode api"))
            yield* Console.log(render.dim("Tip: use --mode agent (default) to generate a prompt file instead."))
            return
          }

          yield* Console.log(render.info("Running AI analysis pipeline..."))

          const { OpenRouterLanguageModel, OpenRouterClient } = yield* Effect.promise(
            () => import("@effect/ai-openrouter"),
          )
          const { runFullPipeline } = yield* Effect.promise(
            () => import("../ai/pipeline.js"),
          )

          const AiLayer = OpenRouterLanguageModel.layer({
            model: "anthropic/claude-opus-4.5",
          }).pipe(
            Layer.provide(
              OpenRouterClient.layerConfig({
                apiKey: Config.succeed(Redacted.make(apiKey)),
              }),
            ),
            Layer.provide(FetchHttpClient.layer),
          )

          const { topics } = yield* runFullPipeline(codebasePath).pipe(
            Effect.provide(AiLayer),
          )

          for (const topic of topics) {
            yield* topicWriter.write(topicsDir, {
              slug: topic.slug,
              title: topic.title,
              description: topic.description,
              order: topic.order,
              category: topic.category,
              tags: topic.tags as string[],
              relatedFiles: topic.relatedFiles as string[],
              content: "\n" + topic.content,
            })
          }

          // Generate manifest
          const manifestPath = `${targetDir}/src/docs-manifest.ts`
          yield* manifestGen.generate(topicsDir, manifestPath)

          yield* Console.log("")
          yield* Console.log(render.success(`Generated ${topics.length} topics`))
          yield* Console.log("")
          yield* Console.log(render.dim("Next steps:"))
          yield* Console.log(render.dim(`  cd ${dirName}`))
          yield* Console.log(render.dim("  npm install"))
          yield* Console.log(render.dim(`  npx tsx src/cli.ts list`))
          yield* Console.log("")
        }
      } finally {
        // Clean up cloned repo
        if (clonedTempDir) {
          yield* Effect.promise(() => rm(clonedTempDir, { recursive: true, force: true }))
        }
      }
    }),
  ),
)
