// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const whserver = require('./whserver');
const EventManager = require('./events');
const {request, objectShallowEquals} = require('./utils');
const logger = require('./logger');

/**
 *  Twitch EventSub
 */
class TES {
    constructor(config) {
        // TES singleton
        if (TES._instance)
            return TES._instance;

        if (!(this instanceof TES))
            return new TES(config);

        TES._instance = this;

        config.identity = config.identity ? config.identity : {};
        config.listener = config.listener ? config.listener : {};
        config.options = config.options ? config.options : {};

        this._authToken = undefined;

        this.clientID = config.identity.id;
        this.clientSecret = config.identity.secret;

        this.baseURL = config.listener.baseURL;
        this.port = config.listener.port || process.env.PORT || 8080;
        this.whserver = whserver(config.listener.server, this.clientSecret);
        this._whserverlistener = config.listener.server ? null : this.whserver.listen(this.port);

        config.options.logger && logger.setEngine(config.options.logger);
        config.options.debug && logger.setLevel('debug');
    }

    /**
     * Get subscriptions (with option for pagination)
     * 
     * @param {string} cursor (optional) the pagination cursor
     */
    getSubscriptions(cursor) {
        logger.debug(`Getting ${cursor ? `subscriptions for cursor ${cursor}` : 'first page of subscriptions'}`);
        return new Promise((resolve, reject) => {
            this._refreshAppAccessToken().then(_ => {
                const headers = {
                    'Client-ID': this.clientID,
                    'Authorization': `Bearer ${this._authToken}`
                }
                request('GET', `https://api.twitch.tv/helix/eventsub/subscriptions${cursor ? `?after=${cursor}` : ''}`, headers).then(data => {
                    resolve(data);
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * Get a specific condition by id or by type and condition
     * 
     * @param  {...any} args 
     *      @param {string} id the id of the subscription
     *      OR
     *      @param {string} type the type of the subscription
     *      @param {Object} condition the condition of the subscription
     */
    getSubscription(...args) {
        return new Promise((resolve, reject) => {
            let comparator;
            if (arguments.length === 1) {
                logger.debug(`Getting subscription for id ${args[0]}`);
                comparator = sub => sub.id === args[0];
            } else if (arguments.length === 2) {
                logger.debug(`Getting subscription for type ${args[0]} and condition ${args[1]}`);
                comparator = sub => {
                    if (sub.type == args[0]) {
                        return objectShallowEquals(sub.condition, args[1]);
                    } else
                        return false;
                }
            } else { 
                reject('getSubscription must have 1 or 2 arguments');
            }
            const getUntilFound = (callback, cursor) => {
                this.getSubscriptions(cursor).then(data => {
                    const sub = data.data.find(comparator);
                    if (!sub) {
                        if (data.pagination.cursor)
                            getUntilFound(callback, data.pagination.cursor);
                        else
                            callback(null);
                    } else
                        callback(sub);
                });
            }
            getUntilFound(resolve);
        });
    }

    /**
     * Subscribe to a new event of given type and condition
     * 
     * @param {string} type the event type
     * @param {Object} condition the event condition
     */
    subscribe(type, condition) {
        logger.debug(`Subscribing to topic with type ${type} and condition ${condition}`);
        return new Promise((resolve, reject) => {
            this._refreshAppAccessToken().then(_ => {
                const headers = {
                    'Client-ID': this.clientID,
                    'Authorization': `Bearer ${this._authToken}`,
                    'Content-Type': 'application/json',
                }
                const body = {
                    type: type,
                    version: '1',
                    condition: condition,
                    transport: {
                        method: 'webhook',
                        callback: `${this.baseURL}/teswh/event`,
                        secret: this.clientSecret
                    }
                }
                request('POST', 'https://api.twitch.tv/helix/eventsub/subscriptions', headers, body).then(data => {
                    resolve(data);
                }).catch(err => {
                    if (err.status === 409) {
                        this.getSubscription(type, condition).then(res => {
                            resolve(res);
                        }).catch(err => {
                            reject(err);
                        });
                    } else 
                        reject(err);
                });
            });
        });
    }

    /**
     * Unsubscribe from event of given id or given type and condition
     * 
     * @param  {...any} args 
     *      @param {string} id the id of the subscription
     *      OR
     *      @param {string} type the type of the subscription
     *      @param {Object} condition the condition of the subscription
     */
    unsubscribe(...args) {
        return new Promise((resolve, reject) => {
            this._refreshAppAccessToken().then(_ => {
                const headers = {
                    'Client-ID': this.clientID,
                    'Authorization': `Bearer ${this._authToken}`,
                }
                if (arguments.length === 1) {
                    const id = args[0];
                    logger.debug(`Unsubscribing from topic ${id}`);
                    request('DELETE', `https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`, headers).then(_ => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                } else if (arguments.length === 2) {
                    const type = args[0];
                    const condition = args[1];
                    logger.debug(`Unsubscribing from topic with type ${type} and condition ${condition}`);
                    this.getSubscription(type, condition).then(res => {
                        if (res) {
                            request('DELETE', `https://api.twitch.tv/helix/eventsub/subscriptions?id=${res.id}`, headers).then(_ => {
                                resolve();
                            }).catch(err => {
                                reject(err);
                            });
                        } else {
                            reject('subscription with given type and condition not found');
                        }
                    });
                } else {
                    reject('unsubscribe must only have 1 or 2 arguments');
                }
            }).catch(err => {
                reject(err);
            })
        });
    }

    /**
     * Provide a callback function to respond to when event of given type is fired
     * 
     * @param {string} type 
     * @param {function} callback 
     */
    on(type, callback) {
        logger.debug(`Adding notification listener for type ${type}`);
        EventManager.addListener(type, callback);
    }

    _refreshAppAccessToken() {
        return new Promise((resolve, reject) => {
            if (this._authToken) {
                resolve();
            } else {
                logger.debug('Refreshing app access token');
                request('POST', `https://id.twitch.tv/oauth2/token?client_id=${this.clientID}&client_secret=${this.clientSecret}&grant_type=client_credentials`).then(data => {
                    this._authToken = data.access_token;
                    setTimeout(_ => {this._authToken = undefined}, data.expires_in);
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }
        })
    }
}

module.exports = TES;