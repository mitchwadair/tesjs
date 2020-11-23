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
    const hours = `00${date.getHours()}`.slice(-2);
    const mins = `00${date.getMinutes()}`.slice(-2);
    const seconds = `00${date.getSeconds()}`.slice(-2);
    const millis = `000${date.getMilliseconds()}`.slice(-3);
    return `${dateString} ${hours}:${mins}:${seconds}:${millis}`;
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