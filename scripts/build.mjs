import path from "node:path";
import { build as esbuildBuild } from "esbuild";
import { build as viteBuild } from "vite";

const projectRoot = path.resolve(import.meta.dirname, "..");

process.chdir(projectRoot);
process.env.NODE_ENV = "production";

await viteBuild({
  configFile: path.join(projectRoot, "vite.config.ts"),
});

await esbuildBuild({
  entryPoints: [path.join(projectRoot, "server", "_core", "index.ts")],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: path.join(projectRoot, "dist"),
});
