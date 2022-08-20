const { exec } = require("child_process");

const buildObjectWithoutKey = (obj, key) => {
    const filteredEntries = Object.entries(obj).filter(([k]) => {
        return k !== key;
    });
    return Object.fromEntries(filteredEntries);
};

const cmd = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, _stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
};

module.exports = {
    buildObjectWithoutKey,
    cmd,
};
