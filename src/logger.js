// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const levels = {
    'debug': 0,
    'error': 1,
    'warn': 2,
    'info': 3,
    'none': 4
}

let level = 'warn';

const formattedDate = _ => {
    const date = new Date();
    const dateString = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'long', day: 'numeric'}).format(date);
    return `${dateString} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
}

const log = lvl => {
    return message => {
        if (levels[lvl] >= levels[level])
            console.log(`${formattedDate()} - TESjs - ${message}`);
    }
}

module.exports = {
    setLevel: lvl => level = lvl,
    debug: log('debug'),
    error: log('error'),
    warn: log('warn'),
    log: log('info')
}