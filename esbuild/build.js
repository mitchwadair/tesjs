const esbuild = require("esbuild");

const excludeExternalsPlugin = {
    name: "exclude-externals",
    setup(build) {
        build.onResolve({ filter: /whserver|node-fetch/ }, (args) => {
            return {
                path: args.path,
                namespace: "exclude-externals",
            };
        });

        build.onLoad({ filter: /.*/, namespace: "exclude-externals" }, () => ({ contents: "" }));
    },
};

esbuild
    .build({
        entryPoints: ["lib/tes.js"],
        minify: true,
        bundle: true,
        sourcemap: true,
        entryNames: "tes.min",
        globalName: "TES",
        outdir: "dist",
        //keepNames: true,
        external: ["./node_modules/*", "./lib/whserver.js"],
        plugins: [excludeExternalsPlugin],
    })
    .catch(() => process.exit(1));
