import { build } from "bun";
import { dynamicPathPlugin } from "bun-dynamic-path";
await build({
  entrypoints: ["./index.ts"],
  naming: {
    asset: "assets/[name].[ext]",
  },
  outdir: "dist",
  plugins: [dynamicPathPlugin({ fileExtensions: ["dummy"] })],
});