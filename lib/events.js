// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const logger = require('./logger');

class EventManager {
    constructor() {
        EventManager._instance = this;
        this._events = this._events || {};
        this._subscriptionQueue = this._subscriptionQueue || {};
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

    queueSubscription(data, resolve, reject) {
        this._subscriptionQueue[data.data[0].id] = {
            data,
            resolve,
            timeout: setTimeout(_ => {
                reject({
                    message: 'Subscription verification timed out, this will need to be cleaned up',
                    subscriptionID: data.data[0].id
                });
                delete this._subscriptionQueue[data.data[0].id];
            }, 600000)
        }
        return this;
    }

    resolveSubscription(id) {
        const {resolve, timeout, data} = this._subscriptionQueue[id];
        clearTimeout(timeout);
        resolve(data);
        delete this._subscriptionQueue[id];
        return this;
    }
}

const instance = new EventManager();
module.exports = instance;