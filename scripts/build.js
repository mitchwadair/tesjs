const esbuild = require("esbuild");

const whserverExcludePlugin = {
    name: "exclude-whserver",
    setup(build) {
        build.onResolve({ filter: /whserver/ }, (args) => {
            return {
                path: args.path,
                namespace: "exclude-whserver",
            };
        });

        build.onLoad({ filter: /.*/, namespace: "exclude-whserver" }, () => ({ contents: "" }));
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
        plugins: [whserverExcludePlugin],
    })
    .catch(() => process.exit(1));
