// Copyright (c) 2020-2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const levels = {
    debug: 0,
    error: 1,
    warn: 2,
    info: 3,
    none: 4,
};

let level = "warn";

const log = (lvl) => {
    return (message) => {
        if (levels[lvl] >= levels[level]) {
            console.log(`${new Date().toUTCString()} - TESjs - ${message}`);
        }
    };
};

module.exports = {
    setLevel: (lvl) => (level = lvl),
    debug: log("debug"),
    error: log("error"),
    warn: log("warn"),
    log: log("info"),
};
