import { Args, Command, Options } from "@effect/cli"
import { Console, Config, Effect, Layer, Option, Redacted } from "effect"
import { FetchHttpClient } from "@effect/platform"
import { AgentPromptGenerator } from "../services/agent-prompt-generator.js"
import { ProjectConfigService } from "../services/project-config.js"
import { TopicWriter } from "../services/topic-writer.js"
import { AnthropicLanguageModel, AnthropicClient } from "@effect/ai-anthropic"
import * as pipeline from "../ai/pipeline.js"
import * as render from "../lib/render.js"

const pathArg = Args.directory({ name: "path" }).pipe(
  Args.withDescription("Path to the codebase to analyze"),
  Args.withDefault("."),
)

const modeOption = Options.choice("mode", ["agent", "api"]).pipe(
  Options.withDescription("Analysis mode: 'agent' generates a prompt file, 'api' uses Claude API directly"),
  Options.withDefault("agent"),
)

const outputOption = Options.text("output").pipe(
  Options.withAlias("o"),
  Options.withDescription("Output path for generated prompt or topics"),
  Options.optional,
)

const nameOption = Options.text("name").pipe(
  Options.withAlias("n"),
  Options.withDescription("Project name for the analysis"),
  Options.optional,
)

export const analyzeCommand = Command.make("analyze", {
  args: { path: pathArg },
  options: { mode: modeOption, output: outputOption, name: nameOption },
}).pipe(
  Command.withDescription("AI-assisted codebase analysis"),
  Command.withHandler(({ args, options }) =>
    Effect.gen(function* () {
      const codebasePath = args.path.startsWith("/")
        ? args.path
        : `${process.cwd()}/${args.path}`

      const projectName = Option.getOrElse(options.name, () =>
        codebasePath.split("/").pop() ?? "project",
      )

      yield* Console.log("")
      yield* Console.log(render.banner(`Analyzing ${projectName}...`))
      yield* Console.log("")

      if (options.mode === "agent") {
        const generator = yield* AgentPromptGenerator
        const outputPath = Option.getOrElse(options.output, () =>
          `${process.cwd()}/${projectName}-analysis-prompt.md`,
        )

        yield* Console.log(render.info("Reading codebase..."))
        yield* generator.generate(codebasePath, outputPath, projectName)

        yield* Console.log("")
        yield* Console.log(render.success(`Agent prompt written to: ${outputPath}`))
        yield* Console.log("")
        yield* Console.log(render.dim("Use this prompt with Claude Code or another AI agent to generate topics."))
        yield* Console.log(render.dim("Then run 'cli-gen build' to compile the CLI."))
        yield* Console.log("")
      } else {
        const topicWriter = yield* TopicWriter
        const configService = yield* ProjectConfigService

        const topicsDir = yield* configService.read(process.cwd()).pipe(
          Effect.map((config) => `${process.cwd()}/${config.topicsDir}`),
          Effect.orElseSucceed(() =>
            Option.getOrElse(options.output, () => `${process.cwd()}/topics`),
          ),
        )

        yield* Console.log(render.info("Running AI analysis pipeline..."))
        yield* Console.log(render.dim("  Phase 1: Discovery"))
        yield* Console.log(render.dim("  Phase 2: Topic Planning"))
        yield* Console.log(render.dim("  Phase 3: Topic Generation"))
        yield* Console.log("")

        const apiKey = process.env["ANTHROPIC_API_KEY"]
        if (!apiKey) {
          yield* Console.log(render.error("ANTHROPIC_API_KEY environment variable is required for --mode api"))
          return
        }

        const AiLayer = AnthropicLanguageModel.model("claude-sonnet-4-20250514").pipe(
          Layer.provide(
            AnthropicClient.layerConfig({
              apiKey: Config.succeed(Redacted.make(apiKey)),
            }),
          ),
          Layer.provide(FetchHttpClient.layer),
        )

        const { topics } = yield* pipeline.runFullPipeline(codebasePath).pipe(
          Effect.provide(AiLayer),
        )

        const writtenFiles: string[] = []
        for (const topic of topics) {
          const filePath = yield* topicWriter.write(topicsDir, {
            slug: topic.slug,
            title: topic.title,
            description: topic.description,
            order: topic.order,
            category: topic.category,
            tags: topic.tags as string[],
            relatedFiles: topic.relatedFiles as string[],
            content: "\n" + topic.content,
          })
          writtenFiles.push(filePath)
        }

        yield* Console.log(render.success(`Generated ${topics.length} topics`))
        for (const file of writtenFiles) {
          yield* Console.log(render.fileCreated(file))
        }
        yield* Console.log("")
        yield* Console.log(render.dim("Run 'cli-gen build' to compile the CLI."))
        yield* Console.log("")
      }
    }),
  ),
)
