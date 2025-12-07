import Link from "next/link";
import { toast } from "sonner";

export default function ResultsCard({ model_name, result, url }: any) {
    // const tempResult = { "schemaVersion": 2, "mediaType": "application/vnd.docker.distribution.manifest.v2+json", "config": { "mediaType": "application/vnd.docker.container.image.v1+json", "digest": "sha256:e18ad7af7efbfaecd8525e356861b84c240ece3a3effeb79d2aa7c0f258f71bd", "size": 487 }, "layers": [{ "mediaType": "application/vnd.ollama.image.model", "digest": "sha256:7462734796d67c40ecec2ca98eddf970e171dbb6b370e43fd633ee75b69abe1b", "size": 1629509152 }, { "mediaType": "application/vnd.ollama.image.template", "digest": "sha256:e0a42594d802e5d31cdc786deb4823edb8adff66094d49de8fffe976d753e348", "size": 358 }, { "mediaType": "application/vnd.ollama.image.license", "digest": "sha256:097a36493f718248845233af1d3fefe7a303f864fae13bc31a3a9704229378ca", "size": 8433 }, { "mediaType": "application/vnd.ollama.image.params", "digest": "sha256:2490e7468436707d5156d7959cf3c6341cc46ee323084cfa3fcf30fe76e397dc", "size": 65 }] }
    const tempResult = JSON.parse(result)

    const model_fullname_array = model_name.split("/")
    if (model_fullname_array.length < 2) {
        model_fullname_array.unshift("library")
    }
    const model_image_path = model_fullname_array.join("/")

    const BASE_URL = `https://registry.ollama.ai/v2/${model_image_path}/blobs/`


    function RowItem({ content, size, onlyName, manifest }: any) {
        return (
            <div className="flex flex-col gap-2 hover:bg-black/10 dark:hover:bg-white/5 rounded-lg p-2 cursor-pointer">
                <div className="flex items-center gap-2">
                    {size &&
                        <span className="text-sm w-16 justify-start flex text-slate-600 select-none">{humanFileSize(size)}</span>
                    }
                    {!size &&
                        <span className="text-sm w-16 justify-start flex text-slate-600 select-none">Manifest</span>
                    }
                    <span className="text-sm">
                        {!onlyName && !manifest &&
                            <Link href={BASE_URL + content} download={content}>{BASE_URL + content}</Link>
                        }

                        {onlyName && !manifest &&
                            <span className="text-slate-600 whitespace-nowrap break-keep" onClick={() => { navigator.clipboard.writeText(content); toast.info("Copied to clipboard") }}>{content}</span>
                        }

                        {manifest &&
                            <Link href={url} download={content}>{content}</Link>
                        }
                    </span>
                </div>

            </div>
        )
    }

    function humanFileSize(bytes: number, si: boolean = false, dp: number = 1) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (
            Math.round(Math.abs(bytes) * r) / r >= thresh &&
            u < units.length - 1
        );

        return bytes.toFixed(dp) + ' ' + units[u];
    }

    function generateBlobsCurlCommand() {
        // List of all blobs
        const digests = [
            tempResult.config.digest,
            ...tempResult.layers.map((layer: any) => layer.digest)
        ];

        // Build the curl commands
        const cmds = digests.map(digest => {
            const filename = "blobs/" + digest.replace(":", "-");
            return `curl -L "${BASE_URL}${digest}" -o "${filename}"`;
        });

        return cmds.join("\n");
    }

    function generateManifestCurlCommand() {
        // example url: https://registry.ollama.ai/v2/library/gemma3/manifests/27b
        const urlComponents = url.split("/");
        const filename = [
          "manifests",
          urlComponents[2], // registry.ollama.ai
          urlComponents[4], // library
          urlComponents[5], // gemma3
          urlComponents[7]  // 27b
        ].join("/");
        return `curl -L "${url}" -o "${filename}"`;

    }
    return (
        <div className="flex flex-col items-start gap-2">

            {/* Manifest Section */}
            <span className="text-sm text-slate-600 mt-2 ml-2">Download the Manifest file</span>
            <div className="bg-card rounded-lg p-2 border w-full overflow-x-auto">
                <RowItem content={url} manifest={true} />
            </div>

            {/* Blobs Section */}
            <span className="text-sm text-slate-600 mt-2 ml-2">Download the blobs</span>
            <div className="p-2 rounded-lg border bg-card w-full overflow-x-auto">
                <div className="flex flex-col items-start">
                    <RowItem content={tempResult.config.digest} size={tempResult.config.size} onlyName={false} />
                    {tempResult.layers.map((layer: any, index: number) => (
                        <RowItem content={layer.digest} size={layer.size} key={index} onlyName={false} />
                    ))}
                </div>
            </div >

            {/* Names Section */}
            <span className="text-sm text-slate-600 mt-2 ml-2">Click to copy the names</span>
            <div className="p-2 rounded-lg border bg-card w-full overflow-x-auto">
                <div className="flex flex-col items-start">
                    <RowItem content={tempResult.config.digest.replace(":", "-")} size={tempResult.config.size} onlyName={true} />
                    {tempResult.layers.map((layer: any, index: number) => (
                        <RowItem content={layer.digest.replace(":", "-")} size={layer.size} key={index} onlyName={true} />
                    ))}
                </div>
            </div >

            {/* Curl Download command */}
            <span className="text-sm text-slate-600 mt-2 ml-2">Curl command to download the manifest (cd to ollama models folder)</span>
            <div className="p-2 rounded-lg border bg-card w-full overflow-x-auto">
                <div
                    className="text-xs font-mono whitespace-pre cursor-pointer"
                    onClick={() => {
                        const cmd = generateManifestCurlCommand();
                        navigator.clipboard.writeText(cmd);
                        toast.info("Curl command copied to clipboard");
                    }}
                >
                    {generateManifestCurlCommand()}
                </div>
            </div>
            <span className="text-sm text-slate-600 mt-2 ml-2">Curl commands to download all blobs (cd to ollama models folder)</span>
            <div className="p-2 rounded-lg border bg-card w-full overflow-x-auto">
                <div
                    className="text-xs font-mono whitespace-pre cursor-pointer"
                    onClick={() => {
                        const cmd = generateBlobsCurlCommand();
                        navigator.clipboard.writeText(cmd);
                        toast.info("Curl commands copied to clipboard");
                    }}
                >
                    {generateBlobsCurlCommand()}
                </div>
            </div>
        </div>
    )
}
