import { Command } from "@effect/cli"
import { BunContext, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import { initCommand } from "./commands/init.js"
import { analyzeCommand } from "./commands/analyze.js"
import { buildCommand } from "./commands/build.js"
import { addCommand } from "./commands/add.js"
import { devCommand } from "./commands/dev.js"
import { ProjectConfigService } from "./services/project-config.js"
import { ScaffoldService } from "./services/scaffold-service.js"
import { TopicWriter } from "./services/topic-writer.js"
import { ManifestGenerator } from "./services/manifest-generator.js"
import { CodebaseReader } from "./services/codebase-reader.js"
import { AgentPromptGenerator } from "./services/agent-prompt-generator.js"
import { UpdateNotifier } from "./services/update-notifier.js"

const rootCommand = Command.make("cli-gen").pipe(
  Command.withDescription("AI-assisted codebase navigation CLI generator"),
  Command.withSubcommands([
    initCommand,
    analyzeCommand,
    buildCommand,
    addCommand,
    devCommand,
  ]),
)

// Base services that don't have inter-service dependencies
const BaseServices = Layer.mergeAll(
  ProjectConfigService.Default,
  TopicWriter.Default,
  ManifestGenerator.Default,
  CodebaseReader.Default,
  UpdateNotifier.Default,
)

// Services that depend on base services
const DependentServices = Layer.mergeAll(
  ScaffoldService.Default,
  AgentPromptGenerator.Default,
)

const ServiceLayer = Layer.provideMerge(DependentServices, BaseServices)

const cli = Command.run(rootCommand, {
  name: "cli-gen",
  version: "0.1.0",
})

cli(globalThis.process.argv).pipe(
  Effect.provide(ServiceLayer),
  Effect.provide(BunContext.layer),
  BunRuntime.runMain,
)
