import { build, $ } from "bun";
await $`rm -rf dist`;
await build({
    entrypoints: ["./src/index.ts"],
    naming: {
        asset: "assets/[name].[ext]",
    },
    check: true,
    outdir: "dist",
    target: "bun"
});
await $`tsc`