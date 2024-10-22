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
const hasher = new CryptoHasher("sha1");

async function getContentHash(filePath: string) {
    const fileBytes = await Bun.file(filePath).bytes();
    hasher.update(fileBytes);
    const result = hasher.digest("hex");
    return result;
}

export default function dynamicPathPlugin(pluginConfig: DynamicPathPluginOptions): BunPlugin {
    return {
        name: pluginName,
        target: "browser",
        setup: ({ onLoad, onResolve, module, config }) => {
            const filterRegex = new RegExp(`\\.(${pluginConfig.fileExtensions.join('|')})$`)
            onResolve({ filter: filterRegex, namespace: "file" }, async (args) => {
                if (args.path.startsWith(pluginName)) {
                    return {
                        path: args.path.replace(`${pluginName}:`, ''),
                        //namespace: "file"
                    }
                }
                const relativePath = args.path
                const fromPath = args.importer
                const rs = resolve(dirname(fromPath), relativePath)
                let pretty = type() === 'Windows_NT' ? rs.replace(/\\/g, '/') : rs
                if(pluginConfig.includeHash){
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
                return {
                    contents: `
                        import assetPath from '${pluginName}:${path}';
                        const resolvePath = import.meta.resolve(${importString});
                        export default resolvePath;
                    `,
                    loader: "js",


                }
            })
        }
    }
}