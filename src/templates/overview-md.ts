import type { ProjectConfig } from "../schemas/project-config.js"

export const overviewMd = (config: ProjectConfig): string =>
  `---
title: Overview
slug: overview
description: High-level overview of ${config.name}
order: 0
category: general
tags: [overview, getting-started]
relatedFiles: []
---

# ${config.name} Overview

Welcome to the ${config.name} solutions guide. This CLI provides curated documentation
to help you (and AI agents) navigate the ${config.name} codebase efficiently.

## Getting Started

- Run \`${config.cliName} list\` to see all available topics
- Run \`${config.cliName} show <topic>\` to read a specific topic
- Run \`${config.cliName} setup\` to initialize the reference

## Topics

Topics are organized by category and cover the key concepts, patterns, and
architecture of this project. Each topic includes descriptions, code examples,
and pointers to relevant source files.

## Adding Topics

Add new topics by creating markdown files in the \`${config.topicsDir}/\` directory
with YAML frontmatter, then run \`npx tsx scripts/generate-manifest.ts\` to rebuild.
`
