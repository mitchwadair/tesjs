// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

class EventManager {
    constructor() {
        // EventManager singleton
        if (EventManager._instance)
            return EventManager._instance;

        if (!(this instanceof EventManager))
            return new EventManager(config);

        EventManager._instance = this;

        this._events = this._events || {};
    }

    fire(type, data) {
        if (!this._events)
            this._events = {};
    
        const handler = this._events[type];
        if (!handler) {
            console.log(`Recieved event for unhandled type: ${type}`);
            return false;
        } else {
            handler.call(this, ...Object.values(data));
            return true;
        }
    }

    addListener(type, handler) {
        if (typeof handler !== 'function')
            throw TypeError('Event handler must be a function');
    
        if (!this._events)
            this._events = {};
    
        this._events[type] = handler;
        return this;
    }

    removeListener(type) {
        if (!this._events)
            return this;
    
        if (this._events[type])
            delete this._events[type];
    
        return this;
    }

    removeAllListeners() {
        if (!this._events)
            return this;
    
        this._events = {};
        return this;
    }
}

const instance = new EventManager();
module.exports = instance;