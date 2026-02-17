# grimoire

AI-assisted codebase navigation CLI generator. Analyzes any codebase (via AI or agent prompts), generates topic documentation, and scaffolds a standalone `@effect/cli` project that agents can use to navigate that codebase.

> **Note:** The directory may still be named `cli-gen/` on disk — the project has been renamed to `grimoire` in all source code, package.json, and CLI commands.

## Project Status

**Phases 1-5 implemented and verified.** All commands work end-to-end.

### What's Done
- `grimoire init [name]` — scaffolds a working solutions CLI project
- `grimoire add <topic>` — adds topic templates with frontmatter
- `grimoire build` — generates manifest from topics
- `grimoire dev <args>` — regenerates manifest and runs scaffolded CLI
- `grimoire analyze --mode agent <path>` — generates prompt file for Claude Code
- `grimoire analyze --mode api <path>` — runs AI analysis pipeline via OpenRouter (needs `OPENROUTER_API_KEY`)

### What's Remaining (Phase 6: Polish)
- `UpdateNotifier` service exists but isn't wired into CLI output
- Error handling could be more user-friendly (raw Effect errors leak in some cases)
- No `--dry-run` support yet
- No tests
- `toolkit.ts` is a placeholder — the pipeline uses `generateObject` directly instead of tool-based interactions

## Architecture

**Runtime**: Node.js (via tsx). **Framework**: Effect with `@effect/cli`.

### Key Patterns
- **Effect.Service class pattern** with `accessors: true` for all services
- **Layer composition** in `cli.ts`: BaseServices → DependentServices → ServiceLayer
- **Templates as TypeScript functions** (not .hbs/.ejs) — type-checked, ship inside the package
- **`grimoire.json`** separate from `package.json` for project config
- **Lazy AI loading** — `@effect/ai-openrouter` is only imported when `--mode api` is used, so no API key needed for other commands

### Service Dependencies
```
CLI Commands
  ├── init      → ScaffoldService, ProjectConfigService, FileSystem
  ├── analyze   → AgentPromptGenerator | (TopicWriter + OpenRouter LanguageModel)
  ├── build     → ProjectConfigService, ManifestGenerator
  ├── add       → ProjectConfigService, TopicWriter
  └── dev       → ProjectConfigService, ManifestGenerator

AgentPromptGenerator → CodebaseReader → FileSystem
CodebaseReader → FileSystem (gitignore parsing, file tree traversal)
```

### AI Pipeline (Direct Mode)
Three-phase pipeline using `LanguageModel.generateObject` with Effect Schema validation:
1. **Discovery** → `CodebaseOverview`
2. **Topic Planning** → `TopicProposalSet` (8-15 proposals)
3. **Topic Generation** → `GeneratedTopic` for each proposal

OpenRouter layer is composed inline in the analyze command:
```
OpenRouterLanguageModel.layer() → OpenRouterClient.layerConfig() → FetchHttpClient.layer
```

## Development

```bash
npm install
npx tsx src/cli.ts --help        # run CLI directly
npm run typecheck                 # tsc --noEmit
```

### Testing init end-to-end
```bash
cd /tmp
npx tsx /path/to/grimoire/src/cli.ts init test-project
cd test-project-solutions
npm install
npx tsx src/cli.ts list           # should show overview topic
```

## File Layout

```
src/
  cli.ts                          # Root entry point, layer composition
  commands/                       # CLI command definitions (init, analyze, build, add, dev)
  services/                       # Effect services (ProjectConfig, Scaffold, TopicWriter, etc.)
  schemas/                        # Effect Schema definitions (project-config, topic, analysis)
  ai/                             # AI pipeline (prompts, tools, pipeline orchestration)
  templates/                      # TypeScript functions generating scaffolded project files
  lib/                            # Utilities (render, gitignore, file-tree)
scripts/
  build-binaries.ts               # Placeholder for cross-platform compilation
```

## Notes

- The `@effect/ai` API uses `Tool`, `Toolkit`, `LanguageModel` (not `AiTool`/`AiToolkit`/`AiLanguageModel`)
- `LanguageModel.generateObject()` returns `GenerateObjectResponse` — access `.value` for the parsed object
- `Options.optional` in `@effect/cli` returns `Option<T>` — use `Option.getOrElse` / `Option.getOrUndefined`
- Scaffolded projects need `@effect/printer`, `@effect/printer-ansi`, `@effect/typeclass` as deps (peer deps of `@effect/cli`)
- The `AiAnalyzer` service from the plan was collapsed into the analyze command to avoid leaking `LanguageModel` requirement at startup
