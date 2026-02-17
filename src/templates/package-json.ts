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
        dev: `bun run src/cli.ts`,
        "generate-manifest": "bun run scripts/generate-manifest.ts",
        build: "bun run generate-manifest && bun build src/cli.ts --outdir dist --target bun",
        "build-binaries": "bun run scripts/build-binaries.ts",
      },
      dependencies: {
        "@effect/cli": "^0.73.0",
        "@effect/platform": "^0.94.1",
        "@effect/platform-bun": "^0.87.0",
        "@effect/printer": "^0.47.0",
        "@effect/printer-ansi": "^0.47.0",
        "@effect/typeclass": "^0.38.0",
        effect: "^3.19.14",
        "gray-matter": "^4.0.3",
        picocolors: "^1.1.1",
      },
      devDependencies: {
        "@types/bun": "^1.2.0",
        typescript: "^5.7.0",
      },
    },
    null,
    2,
  ) + "\n"
