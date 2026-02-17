import type { ProjectConfig } from "../schemas/project-config.js"

export const buildBinariesTs = (config: ProjectConfig): string =>
  `import { $ } from "bun"

const targets = [
  { name: "linux-x64", target: "bun-linux-x64" },
  { name: "linux-arm64", target: "bun-linux-arm64" },
  { name: "darwin-x64", target: "bun-darwin-x64" },
  { name: "darwin-arm64", target: "bun-darwin-arm64" },
] as const

const outDir = "dist/binaries"

console.log("Building cross-platform binaries...")

for (const { name, target } of targets) {
  const outPath = \`\${outDir}/${config.cliName}-\${name}\`
  console.log(\`  Building \${name}...\`)
  await $\`bun build src/cli.ts --compile --target=\${target} --outfile=\${outPath}\`
  console.log(\`  ✓ \${outPath}\`)
}

console.log("\\nDone! Binaries written to", outDir)
`
