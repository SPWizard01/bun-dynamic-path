import { type BunPlugin, CryptoHasher } from "bun"
import { resolve, dirname } from "path";
import { type } from "os";
export interface DynamicPathPluginOptions {
    /**
     * File extensions to be considered for dynamic path resolution
     * 
     * Example: `[ 'jpg', 'png', 'woff' ]`
     * 
     * Should be same file types that you configured bun to copy over to the output directory
     */
    fileExtensions: string[]
    includeHash?: boolean
}
const pluginName = `bun-dynamic-path`
//NEW
const resolver = `${pluginName}-resolver`
const hasher = new CryptoHasher("sha1");

async function getContentHash(filePath: string) {
    const fileBytes = await Bun.file(filePath).bytes();
    hasher.update(fileBytes);
    const result = hasher.digest("hex");
    return result;
}

export function dynamicPathPlugin(pluginConfig: DynamicPathPluginOptions): BunPlugin {
    return {
        name: pluginName,
        target: "browser",
        setup: ({ onLoad, onResolve, module, config, onBeforeParse }) => {
            const filterRegex = new RegExp(`\\.(${pluginConfig.fileExtensions.join('|')})$`)
            //NEW, ORDER MATTERS
            onResolve({ filter: /bun-dynamic-path-resolver/ }, (args) => {
                const path = args.path.replace(`${resolver}:`, "")
                return {
                    path: path,
                    namespace: resolver
                }
            })

            onResolve({ filter: filterRegex, namespace: "file" }, async (args) => {
                //REMOVED PREVIOUS HANDLING
                const relativePath = args.path
                const fromPath = args.importer
                const rs = resolve(dirname(fromPath), relativePath)
                // error: onResolve plugin "path" must be absolute when the namespace is "file"
                //     at E:\Proj\bun-dynamic-path\example\test.dummy:0
                let pretty = type() === "Windows_NT" ? rs.replace(/\\/g, "/") : rs
                if (pluginConfig.includeHash) {
                    pretty = `hash:${pretty}`
                }
                return {
                    path: pretty,
                    namespace: pluginName,
                }
            })

            onLoad({ filter: /./, namespace: pluginName }, async (args) => {
                let importString = `assetPath`
                let path = args.path
                if (path.startsWith("hash:")) {
                    path = path.replace("hash:", "")
                    const hash = await getContentHash(path)
                    importString = `\`\${assetPath}?${hash}\``
                }
                //NEW resolver
                const fullPath = `${resolver}:${path}`;
                return {
                    contents: `
                        import assetPath from '${fullPath}';
                        const resolvePath = import.meta.resolve(${importString});
                        export default resolvePath;
                    `,
                    loader: "js",
                }
            })
            //NEW, handle resolved paths
            onLoad({ filter: /./, namespace: resolver }, (args) => {
                return {
                    contents: ``,
                    loader: "file",
                }
            })
        }
    }
}