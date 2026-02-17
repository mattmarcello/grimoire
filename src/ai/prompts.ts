export const SYSTEM_PROMPT = `You are an expert software architect analyzing codebases to generate structured documentation.
Your goal is to produce topic documentation that helps AI agents navigate codebases efficiently.

Key principles:
- Focus on what an AI agent needs to write correct code
- Identify architecture patterns, module boundaries, and public APIs
- Use real code examples from the codebase
- Point to specific files for deeper understanding
- Be concise but comprehensive`

export const discoveryPrompt = (fileTree: string, keyFileContents: string): string =>
  `Analyze this codebase and produce a structured overview.

## File Tree
\`\`\`
${fileTree}
\`\`\`

## Key Files
${keyFileContents}

Produce a structured overview including:
- Project name and type
- Primary language and build system
- Key modules with paths and descriptions
- Architecture patterns used
- Main entry points`

export const topicPlanningPrompt = (overview: string): string =>
  `Based on this codebase overview, propose 8-15 documentation topics.

## Codebase Overview
${overview}

For each topic, provide:
- A URL-friendly slug
- A clear title
- A one-line description
- A category (architecture, patterns, api, guides, setup)
- Relevant file paths to read
- A suggested order number (0 = most general, higher = more specific)`

export const topicGenerationPrompt = (
  proposal: { slug: string; title: string; description: string; relevantFiles: ReadonlyArray<string> },
  fileContents: string,
): string =>
  `Generate complete documentation for this topic.

## Topic
- Slug: ${proposal.slug}
- Title: ${proposal.title}
- Description: ${proposal.description}

## Relevant File Contents
${fileContents}

Generate a complete markdown topic with:
1. Overview section explaining what this covers and why it matters
2. Key concepts with clear explanations
3. Real code examples from the files above (not generic examples)
4. List of related files an agent should read for deeper understanding

Use the actual code from the files provided. Include appropriate tags.`
