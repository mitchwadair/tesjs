const { exec } = require("child_process");

const buildObjectWithoutKey = (obj, key) => {
    const { [key]: _removed, ...rest } = obj;
    return rest;
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
