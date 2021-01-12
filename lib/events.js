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

    fire(type, data) {
        const handler = this._events[type];
        if (!handler) {
            logger.warn(`Recieved event for unhandled type: ${type}`);
            return false;
        } else {
            handler.call(this, data);
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