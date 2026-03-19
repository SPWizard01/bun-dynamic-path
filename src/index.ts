import { type BunPlugin, hash } from "bun"
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
const resolver = `${pluginName}-resolver`

async function getContentHash(filePath: string) {
    const fileBytes = await Bun.file(filePath).bytes();
    const result = hash.rapidhash(fileBytes);
    return result;
}

export function dynamicPathPlugin(pluginConfig: DynamicPathPluginOptions): BunPlugin {
    return {
        name: pluginName,
        target: "browser",
        setup: ({ onLoad, onResolve, module, config, onBeforeParse }) => {
            const filterRegex = new RegExp(`\\.(${pluginConfig.fileExtensions.join('|')})$`)
            const resolverRegex = new RegExp(`^${resolver}:`)
            //ORDER MATTERS
            onResolve({ filter: resolverRegex }, (args) => {
                // console.log("RESOLVE", args.path)
                let path = args.path.replace(`${resolver}:`, "");
                // console.log("RESOLVE2", path)
                //replace forward slashes on Windows back to backslashes or it fails to find the file
                //not required anymore?
                //path = type() === "Windows_NT" ? path.replace(/\//g, "\\") : path;
                return {
                    path,
                    //namespace: "file"
                }
            })

            onResolve({ filter: filterRegex, namespace: "file" }, async (args) => {
                const relativePath = args.path
                const fromPath = args.importer
                const rs = resolve(dirname(fromPath), relativePath)
                //we need this or top onResolve on Windows will have garbled path like:
                //RESOLVE bun-dynamic-path-resolver:E:Proun-dynamic-pathexamplunlogo.svg
                let pretty = type() === "Windows_NT" ? rs.replace(/\\/g, "/") : rs
                pretty = `${resolver}:${pretty}`
                //console.log("PRETTY", pretty)
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
                    let filePath = path.replace(`${resolver}:`, "")
                    const hash = await getContentHash(filePath)
                    importString = `\`\${assetPath}?${hash}\``
                }
                //forward to resolver
                //resolver is already part of the path
                //const fullPath = `${resolver}:${path}`;
                return {
                    contents: `
                        import assetPath from '${path}';
                        const resolvePath = import.meta.resolve(${importString});
                        export default resolvePath;
                    `,
                    loader: "js",
                }
            })

        }
    }
}