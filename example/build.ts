import { build, $ } from "bun";
import { dynamicPathPlugin } from "bun-dynamic-path";
await $`rm -rf ./dist`;
await build({
  entrypoints: ["./index.ts"],
  naming: {
    asset: "assets/[name].[ext]",
  },
  minify: false,
  splitting: true,
  format: "esm",
  target: "browser",
  sourcemap: true,
  outdir: "dist",
  // loader: {
  //   ".png": "file",
  //   ".svg": "file",
  //   ".dummy": "file",
  // },
  plugins: [dynamicPathPlugin({ fileExtensions: ["dummy", "svg", "png"], includeHash: true })],
});