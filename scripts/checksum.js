const { readFile, writeFileSync } = require("fs");
const { resolve } = require("path");
const crypto = require("crypto");

const checksum = (data) => {
    return crypto.createHash("sha512").update(data, "utf8").digest("hex");
};

readFile(resolve(__dirname, "../dist/tes.min.js"), (err, data) => {
    if (err) throw err;

    writeFileSync(resolve(__dirname, "../checksum"), checksum(data));
});
