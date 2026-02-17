# grimoire

Generate navigable documentation CLIs for any codebase. Grimoire analyzes a project, produces curated topic guides, and scaffolds a standalone CLI that AI agents (or humans) can use to look things up fast.

```
$ grimoire init effect-atom --target https://github.com/tim-smart/effect-atom --mode api
$ cd effect-atom-solutions
$ npm install
$ npx tsx src/cli.ts list
```

The output is a self-contained CLI:

```
$ effect-atom-solutions list

effect-atom Solutions
Available topics:

  overview            What effect-atom is and how the packages fit together
  architecture        Service layer design and dependency injection
  error-handling      Error types, recovery patterns, and boundaries
  ...

$ effect-atom-solutions show architecture
```

## Why

AI agents waste context window exploring codebases — reading directory trees, opening files speculatively, rediscovering structure across sessions. Grimoire creates a curated reference that gives agents (and developers) the right information immediately.

## Install

Requires Node.js 20+ and [tsx](https://tsx.is).

```bash
npm install -g grimoire-gen
```

## Quick Start

```bash
# From a GitHub URL — scaffold + analyze in one step
grimoire init my-lib --target https://github.com/user/my-lib --mode api

# From a local path
grimoire init my-lib --target ./path/to/my-lib --mode api

# Agent mode (default) — generates a prompt file for Claude Code instead of calling the API
grimoire init my-lib --target https://github.com/user/my-lib
```

The `--target` flag accepts a local path or a GitHub URL (cloned automatically). The name is inferred from the URL if omitted.

API mode (`--mode api`) requires `OPENROUTER_API_KEY` set in the environment.

## Commands

### `grimoire init [name]`

Scaffold a new solutions CLI project, optionally analyzing a codebase.

```bash
# Scaffold + analyze a GitHub repo
grimoire init effect-atom --target https://github.com/tim-smart/effect-atom

# Scaffold + analyze with API (generates topics directly)
OPENROUTER_API_KEY=sk-... grimoire init effect-atom --target ./effect-atom --mode api

# Scaffold only (no analysis)
grimoire init my-project
```

Options:
- `-t, --target` — Path or GitHub URL of the codebase to analyze
- `--mode agent|api` — Analysis mode (default: agent)
- `-d, --description` — Project description

### `grimoire analyze [path]`

Analyze a codebase and generate topic documentation (standalone, outside of init).

```bash
grimoire analyze --mode agent ./my-codebase
OPENROUTER_API_KEY=sk-... grimoire analyze --mode api ./my-codebase
```

Options:
- `--mode agent|api` — Analysis mode (default: agent)
- `-o, --output` — Output path
- `-n, --name` — Project name

### `grimoire add <topic>`

Add a topic manually.

```bash
grimoire add error-handling
grimoire add architecture --title "System Architecture" --category architecture
```

Creates a markdown file in `topics/` with YAML frontmatter. Edit it, then rebuild.

### `grimoire build`

Build the scaffolded CLI (generates `docs-manifest.ts` from topic files).

```bash
grimoire build
```

### `grimoire dev <args>`

Run the scaffolded CLI in development mode (regenerates manifest first).

```bash
grimoire dev list
grimoire dev show architecture
```

## Topic Format

Topics are markdown files with YAML frontmatter in the `topics/` directory:

```markdown
---
title: Error Handling
slug: error-handling
description: Error types, recovery patterns, and boundaries
order: 3
category: patterns
tags: [errors, recovery, boundaries]
relatedFiles: [src/errors.ts, src/middleware/error-handler.ts]
---

# Error Handling

## Overview
How errors flow through the system...

## Key Concepts
...

## Code Examples
...
```

## How It Works

1. **`grimoire init --target`** clones the repo (if URL), scaffolds a project, and analyzes the codebase
2. **Topics** are markdown files with frontmatter, compiled into a typed `docs-manifest.ts` registry
3. **Analysis** reads the codebase (respecting `.gitignore`), then either generates a prompt for an AI agent or calls OpenRouter to produce topics directly
4. **The output CLI** is a standalone `@effect/cli` project — `list` shows topics, `show <topic>` renders them

## Configuration

`grimoire.json` in the scaffolded project root:

```json
{
  "name": "my-project",
  "cliName": "my-project-solutions",
  "description": "A codebase navigation CLI",
  "version": "0.1.0",
  "topicsDir": "topics",
  "outputDir": "dist"
}
```

## Built With

- [Effect](https://effect.website) — typed functional programming for TypeScript
- [@effect/cli](https://github.com/Effect-TS/effect/tree/main/packages/cli) — type-safe CLI framework
- [@effect/ai-openrouter](https://github.com/Effect-TS/effect/tree/main/packages/ai-openrouter) — OpenRouter API client (optional, for `--mode api`)
- [tsx](https://tsx.is) — TypeScript runtime for Node.js

## License

MIT
