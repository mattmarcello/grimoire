export const renderTs = (): string =>
  `import pc from "picocolors"

export const banner = (text: string): string =>
  pc.bold(pc.cyan(text))

export const success = (text: string): string =>
  pc.green(\`✓ \${text}\`)

export const error = (text: string): string =>
  pc.red(\`✗ \${text}\`)

export const info = (text: string): string =>
  pc.blue(\`ℹ \${text}\`)

export const dim = (text: string): string =>
  pc.dim(text)

export const label = (key: string, value: string): string =>
  \`\${pc.bold(key)}: \${value}\`
`
