import type { ProjectConfig } from "../schemas/project-config.js"

export const packageJson = (config: ProjectConfig): string =>
  JSON.stringify(
    {
      name: `${config.name}-solutions`,
      version: config.version,
      description: config.description,
      type: "module",
      bin: {
        [config.cliName]: "./bin.js",
      },
      scripts: {
        dev: "tsx src/cli.ts",
        "generate-manifest": "tsx scripts/generate-manifest.ts",
      },
      dependencies: {
        "@effect/cli": "^0.73.0",
        "@effect/platform": "^0.94.2",
        "@effect/platform-node": "^0.104.0",
        "@effect/printer": "^0.47.0",
        "@effect/printer-ansi": "^0.47.0",
        "@effect/typeclass": "^0.38.0",
        effect: "^3.19.14",
        "gray-matter": "^4.0.3",
        picocolors: "^1.1.1",
        tsx: "^4.21.0",
      },
      devDependencies: {
        "@types/node": "^22.0.0",
        typescript: "^5.7.0",
      },
    },
    null,
    2,
  ) + "\n"
