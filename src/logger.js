// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const levels = {
    'debug': 0,
    'error': 1,
    'warn': 2,
    'info': 3
}

let level = 'warn';
let engine = console;

const formattedDate = _ => {
    const date = new Date();
    const dateString = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'long', day: 'numeric'}).format(date);
    return `${dateString} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
}

const log = lvl => {
    return message => {
        if (levels[lvl] >= levels[level])
            engine.log(`${formattedDate()} - TESjs - ${message}`);
    }
}

module.exports = {
    setLevel: lvl => level = lvl,
    setEngine: e => engine = e,
    debug: log('debug'),
    error: log('error'),
    warn: log('warn'),
    log: log('info')
}