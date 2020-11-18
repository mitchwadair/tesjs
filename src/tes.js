// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const whserver = require('./whserver');
const EventManager = require('./events');
const {request, objectShallowEquals} = require('./utils');

// constructor
class TES {
    constructor(config) {
        // TES singleton
        if (TES._instance)
            return TES._instance;

        if (!(this instanceof TES))
            return new TES(config);

        TES._instance = this;

        this._authToken = undefined;

        this.clientID = config.identity.id;
        this.clientSecret = config.identity.secret;

        this.baseURL = config.listener.baseURL;
        this.port = config.listener.port || process.env.PORT || 8080;
        this.whserver = whserver(this.port, config.listener.server, this.clientSecret);
    }

    getSubscriptions() {
        return new Promise((resolve, reject) => {
            this._refreshAppAccessToken().then(_ => {
                const headers = {
                    'Client-ID': this.clientID,
                    'Authorization': `Bearer ${this._authToken}`
                }
                request('GET', 'https://api.twitch.tv/helix/eventsub/subscriptions', headers).then(data => {
                    resolve(data);
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }

    subscribe(type, condition) {
        return new Promise((resolve, reject) => {
            this.getSubscriptions().then(res => {
                // make sure we are not already subscribed to this topic
                const existingSub = res.data.find(sub => {
                    if (sub.type == type) {
                        return objectShallowEquals(sub.condition, condition);
                    } else
                        return false;
                });
                if (!existingSub) {
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
                        reject(err);
                    });
                } else {
                    resolve(existingSub);
                }
            }).catch(err => {
                reject(err);
            });
        });
    }

    unsubscribe(arg1, arg2) {
        return new Promise((resolve, reject) => {
            this._refreshAppAccessToken().then(_ => {
                const headers = {
                    'Client-ID': this.clientID,
                    'Authorization': `Bearer ${this._authToken}`,
                }
                if (arguments.length === 1) {
                    const id = arg1;
                    request('DELETE', `https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`, headers).then(_ => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                } else if (arguments.length === 2) {
                    const type = arg1;
                    const condition = arg2;
                    this.getSubscriptions().then(res => {
                        const existingSub = res.data.find(sub => {
                            if (sub.type == type) {
                                return objectShallowEquals(sub.condition, condition);
                            } else
                                return false;
                        });
                        if (existingSub) {
                            request('DELETE', `https://api.twitch.tv/helix/eventsub/subscriptions?id=${existingSub.id}`, headers).then(_ => {
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

    on(type, callback) {
        EventManager.addListener(type, callback);
    }

    _refreshAppAccessToken() {
        return new Promise((resolve, reject) => {
            if (this._authToken) {
                resolve();
            } else {
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