import { build } from "bun";
await build({
    entrypoints: ["./index.ts"],
    naming: {
        asset: "assets/[name].[ext]",
    },
    outdir: "dist",
    target: "bun"
});