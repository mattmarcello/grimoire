import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { ProjectConfigService } from "../services/project-config.js"
import { TopicWriter } from "../services/topic-writer.js"
import * as render from "../lib/render.js"

const slugArg = Args.text({ name: "topic" }).pipe(
  Args.withDescription("Topic slug (e.g. 'architecture')"),
)

const titleOption = Options.text("title").pipe(
  Options.withAlias("t"),
  Options.withDescription("Topic title"),
  Options.optional,
)

const categoryOption = Options.text("category").pipe(
  Options.withAlias("c"),
  Options.withDescription("Topic category"),
  Options.withDefault("general"),
)

export const addCommand = Command.make("add", {
  args: { slug: slugArg },
  options: { title: titleOption, category: categoryOption },
}).pipe(
  Command.withDescription("Add a new topic manually"),
  Command.withHandler(({ args, options }) =>
    Effect.gen(function* () {
      const configService = yield* ProjectConfigService
      const topicWriter = yield* TopicWriter

      const cwd = process.cwd()
      const config = yield* configService.read(cwd)
      const topicsDir = `${cwd}/${config.topicsDir}`

      const order = yield* topicWriter.nextOrder(topicsDir)
      const title = Option.getOrElse(options.title, () =>
        args.slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      )

      const filePath = yield* topicWriter.write(topicsDir, {
        slug: args.slug,
        title,
        description: `Documentation for ${title.toLowerCase()}`,
        order,
        category: options.category,
      })

      yield* Console.log("")
      yield* Console.log(render.success(`Created topic: ${args.slug}`))
      yield* Console.log(render.fileCreated(filePath))
      yield* Console.log("")
      yield* Console.log(render.dim("Edit the file to add content, then run:"))
      yield* Console.log(render.dim("  cli-gen build"))
      yield* Console.log("")
    }),
  ),
)
