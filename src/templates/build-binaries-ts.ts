import type { ProjectConfig } from "../schemas/project-config.js"

export const buildBinariesTs = (_config: ProjectConfig): string =>
  `// Cross-platform binary compilation is not available with the Node.js runtime.
// To distribute your CLI, publish to npm with 'npm publish'.
// Users install with: npm install -g ${_config.name}-solutions
//
// For standalone binaries, consider:
//   - Node.js Single Executable Applications (SEA): https://nodejs.org/api/single-executable-applications.html
//   - pkg: https://github.com/vercel/pkg

console.log("Binary compilation is not configured.")
console.log("Publish to npm with: npm publish")
`
