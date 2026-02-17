import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { FileSystem } from "@effect/platform"
import { ProjectConfig } from "../schemas/project-config.js"
import { ProjectConfigService } from "../services/project-config.js"
import { ScaffoldService } from "../services/scaffold-service.js"
import * as render from "../lib/render.js"

const nameArg = Args.text({ name: "name" }).pipe(
  Args.withDescription("Project name (e.g. 'my-project')"),
  Args.optional,
)

const descriptionOption = Options.text("description").pipe(
  Options.withAlias("d"),
  Options.withDescription("Project description"),
  Options.withDefault("A codebase navigation CLI"),
)

const targetRepoOption = Options.text("target-repo").pipe(
  Options.withAlias("t"),
  Options.withDescription("Target repository URL"),
  Options.optional,
)

export const initCommand = Command.make("init", {
  args: { name: nameArg },
  options: { description: descriptionOption, targetRepo: targetRepoOption },
}).pipe(
  Command.withDescription("Scaffold a new solutions CLI project"),
  Command.withHandler(({ args, options }) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const scaffold = yield* ScaffoldService
      const configService = yield* ProjectConfigService

      const projectName = Option.getOrElse(args.name, () => "my-project")
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
        targetRepo: Option.getOrUndefined(options.targetRepo),
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
      yield* Console.log("")
      yield* Console.log(render.dim("Next steps:"))
      yield* Console.log(render.dim(`  cd ${dirName}`))
      yield* Console.log(render.dim("  npm install"))
      yield* Console.log(render.dim(`  npx tsx src/cli.ts list`))
      yield* Console.log("")
    }),
  ),
)
