import pc from "picocolors"

export const banner = (text: string): string =>
  pc.bold(pc.cyan(text))

export const success = (text: string): string =>
  pc.green(`✓ ${text}`)

export const error = (text: string): string =>
  pc.red(`✗ ${text}`)

export const info = (text: string): string =>
  pc.blue(`ℹ ${text}`)

export const warning = (text: string): string =>
  pc.yellow(`⚠ ${text}`)

export const dim = (text: string): string =>
  pc.dim(text)

export const label = (key: string, value: string): string =>
  `${pc.bold(key)}: ${value}`

export const heading = (text: string): string =>
  pc.bold(pc.underline(text))

export const fileCreated = (path: string): string =>
  `  ${pc.green("+")} ${pc.dim(path)}`

export const section = (title: string, items: ReadonlyArray<string>): string =>
  [heading(title), ...items].join("\n")
