// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const logger = require('./logger');

class EventManager {
    constructor() {
        EventManager._instance = this;
        this._events = this._events || {};
    }

    fire(sub, data) {
        const handler = this._events[sub.type];
        if (!handler) {
            logger.warn(`Recieved event for unhandled type: ${sub.type}`);
            return false;
        } else {
            handler.call(this, data, sub);
            return true;
        }
    }

    addListener(type, handler) {
        if (typeof handler !== 'function')
            throw TypeError('Event handler must be a function');
    
        this._events[type] = handler;
        return this;
    }

    removeListener(type) {
        if (this._events[type])
            delete this._events[type];
    
        return this;
    }

    removeAllListeners() {
        this._events = {};
        return this;
    }
}

const instance = new EventManager();
module.exports = instance;