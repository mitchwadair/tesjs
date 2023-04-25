const jsdoc2md = require("jsdoc-to-markdown");
const { writeFileSync } = require("fs");

jsdoc2md.render({ files: "lib/tes.js", separators: true }).then((doc) => {
    writeFileSync("doc/tesjs.md", doc);
});
