# Bun Dynamic Path Plugin

## Features

Adds ability to dynamically resolve paths to assets that are loaded with `file` loader.

This is useful when you are not in control of paths or the environment and just want to insert your code.

It uses `import.meta.resolve` to resolve path relative to current ESM module.

## Usage
`bun i bun-dynamic-path`

```typescript
//build.ts
import { build } from "bun";
await build({
  entrypoints: ["./index.ts"],
  naming: {
    asset: "assets/[name].[ext]",
  },
  outdir: "dist",
  plugins: [dynamicPathPlugin({ fileExtensions: ["jpg"] })],
});
```

`bun run build.ts`

Resulting output will be something like:

```javascript
// E:/Path/To/Your/Asset/assets/blueprint.jpg
var blueprint_default = "./assets/blueprint.jpg";
var init_blueprint = () => {};

// E:/Path/To/Your/Asset/assets/blueprint.jpg
var resolvePath, blueprint_default2;
var init_blueprint2 = __esm(() => {
  init_blueprint();
  resolvePath = import.meta.resolve(blueprint_default);
  blueprint_default2 = resolvePath;
});
```

## Options

`fileExtensions`: Should be same file types that you configured bun to copy over to the output directory. Example: `["jpg","woff"]`

`includeHash`: Optional, if provided adds `?[file_hash]` to the output.
Example:
```javascript
// E:/Path/To/Your/Asset/assets/blueprint.jpg
var blueprint_default = "./assets/blueprint.jpg";
var init_blueprint = () => {
};

// hash:E:/Path/To/Your/Asset/assets/blueprint.jpg
var resolvePath, blueprint_default2;
var init_blueprint2 = __esm(() => {
  init_blueprint();
  resolvePath = import.meta.resolve(`${blueprint_default}?e9577a8b3184f0f8bdfe5202b7060bfd6fbe8c76`);
  blueprint_default2 = resolvePath;
});

```
