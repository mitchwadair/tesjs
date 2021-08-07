const path = require("path");
const ne = require("webpack-node-externals");

module.exports = {
    entry: "./lib/tes.js",
    mode: "production",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "tesjs.min.js",
    },
    module: {
        rules: [
            // don't include whserver in the browser package
            {
                test: /whserver\.js/,
                use: path.resolve(__dirname, "webpack/exclude.js"),
            },
        ],
    },
    externals: [ne()],
    externalsPresets: { node: true },
};
