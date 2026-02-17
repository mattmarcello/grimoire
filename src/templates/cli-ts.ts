import type { ProjectConfig } from "../schemas/project-config.js"

export const cliTs = (config: ProjectConfig): string =>
  `import { Args, Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Array as Arr } from "effect"
import pc from "picocolors"
import { topics } from "./docs-manifest.js"

const formatTopicList = () => {
  const maxSlug = Math.max(...topics.map((t) => t.slug.length))
  return topics
    .sort((a, b) => a.order - b.order)
    .map((t) => \`  \${pc.cyan(t.slug.padEnd(maxSlug + 2))}\${pc.dim(t.description)}\`)
    .join("\\n")
}

const listCommand = Command.make("list").pipe(
  Command.withDescription("List all available topics"),
  Command.withHandler(() =>
    Console.log(
      [
        "",
        pc.bold("${config.name} Solutions"),
        pc.dim("Available topics:"),
        "",
        formatTopicList(),
        "",
        pc.dim(\`Run \${pc.cyan("${config.cliName} show <topic>")} for details\`),
        "",
      ].join("\\n"),
    ),
  ),
)

const showTopics = Args.text({ name: "topic" }).pipe(
  Args.withDescription("Topic slug(s) to display"),
  Args.repeated,
)

const showCommand = Command.make("show", { args: { topics: showTopics } }).pipe(
  Command.withDescription("Show detailed information for one or more topics"),
  Command.withHandler(({ args }) =>
    Effect.gen(function* () {
      const slugs = args.topics
      if (Arr.isEmptyReadonlyArray(slugs)) {
        yield* Console.log(pc.yellow("Please specify a topic. Run 'list' to see available topics."))
        return
      }
      for (const slug of slugs) {
        const topic = topics.find((t) => t.slug === slug)
        if (!topic) {
          yield* Console.log(pc.red(\`Unknown topic: \${slug}\`))
          continue
        }
        yield* Console.log(
          [
            "",
            pc.bold(pc.cyan(topic.title)),
            pc.dim(topic.description),
            pc.dim(\`Category: \${topic.category}  Tags: \${topic.tags.join(", ")}\`),
            "",
            topic.content,
            "",
          ].join("\\n"),
        )
      }
    }),
  ),
)

const setupCommand = Command.make("setup").pipe(
  Command.withDescription("Set up the solutions reference for your project"),
  Command.withHandler(() =>
    Console.log(
      [
        "",
        pc.bold("Setup complete!"),
        "",
        pc.dim("You can now use:"),
        \`  \${pc.cyan("${config.cliName} list")}     — see all topics\`,
        \`  \${pc.cyan("${config.cliName} show <topic>")} — read a topic\`,
        "",
      ].join("\\n"),
    ),
  ),
)

const rootCommand = Command.make("${config.cliName}").pipe(
  Command.withDescription("${config.description}"),
  Command.withSubcommands([listCommand, showCommand, setupCommand]),
)

const cli = Command.run(rootCommand, {
  name: "${config.cliName}",
  version: "${config.version}",
})

cli(globalThis.process.argv).pipe(
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
)
`
