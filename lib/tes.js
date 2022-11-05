// Copyright (c) 2020-2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const whserver = require("./whserver");
const WebSocketClient = require("./wsclient");
const EventManager = require("./events");
const AuthManager = require("./auth");
const RequestManager = require("./request");
const { objectShallowEquals, printObject } = require("./utils");
const logger = require("./logger");

const SUBS_API_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";

/**
 *  Twitch EventSub
 */
class TES {
    constructor(config) {
        // TES singleton
        if (TES._instance) return TES._instance;

        // ensure we have an identity
        if (!config.identity) throw new Error("TES config must contain 'identity'");
        if (!config.listener) throw new Error("TES config must contain 'listener'");

        const {
            identity: { id, secret, onAuthenticationFailure, accessToken, refreshToken },
            listener: { type, baseURL, secret: whSecret, port, ignoreDuplicateMessages, ignoreOldMessages, server },
        } = config;

        if (!type || (type !== "webhook" && type !== "websocket")) {
            throw new Error("TES listener config must have 'type' either 'webhook' or 'websocket'");
        }
        if (!id) throw new Error("TES identity config must contain 'id'");
        if (type === "webhook") {
            if (!secret) throw new Error("TES identity config must contain 'secret'");
            if (!baseURL) throw new Error("TES listener config must contain 'baseURL'");
            if (!whSecret) throw new Error("TES listener config must contain 'secret'");
        } else {
            if (!accessToken) throw new Error("TES identity config must contain 'accessToken'");
            if (!onAuthenticationFailure && !refreshToken) {
                throw new Error("TES identity config must contain either 'onAuthenticationFailure' or 'refreshToken'");
            }
            if (refreshToken && !secret) {
                throw new Error("TES identity config must contain 'secret'");
            }
        }

        TES._instance = this;

        this.clientID = id;
        this.transportType = type;

        if (type === "webhook") {
            this.baseURL = baseURL;
            this.whSecret = whSecret;

            this.port = port || process.env.PORT || 8080;
            const serverConfig = {
                ignoreDuplicateMessages: ignoreDuplicateMessages === false ? false : true,
                ignoreOldMessages: ignoreOldMessages === false ? false : true,
            };
            this.whserver = whserver(server, whSecret, serverConfig);
            this._whserverlistener = server ? null : this.whserver.listen(this.port);
        } else {
            this.wsclient = new WebSocketClient();
        }

        config.options = config.options || {};
        config.options.debug && logger.setLevel("debug");
        config.options.logging === false && logger.setLevel("none");

        new AuthManager({
            clientID: id,
            clientSecret: secret,
            onAuthFailure: onAuthenticationFailure,
            initialToken: accessToken,
            refreshToken,
        });
    }

    /**
     * Get subscriptions (with option for pagination)
     *
     * @param {string} cursor (optional) the pagination cursor
     */
    getSubscriptions(cursor) {
        logger.debug(`Getting ${cursor ? `subscriptions for cursor ${cursor}` : "first page of subscriptions"}`);
        return this._getSubs(`${SUBS_API_URL}${cursor ? `?after=${cursor}` : ""}`);
    }

    /**
     *
     * @param {string} type the type of the subscriptions to get
     * @param {string} cursor (optional) the pagination cursor
     */
    getSubscriptionsByType(type, cursor) {
        logger.debug(
            `Getting ${cursor ? `subscriptions for cursor ${cursor}` : "first page of subscriptions"} of type ${type}`
        );
        return this._getSubs(
            `${SUBS_API_URL}?${`type=${encodeURIComponent(type)}`}${cursor ? `&after=${cursor}` : ""}`
        );
    }

    /**
     *
     * @param {string} status the status of the subscriptions to get
     * @param {string} cursor (optional) the pagination cursor
     */
    getSubscriptionsByStatus(status, cursor) {
        logger.debug(
            `Getting ${
                cursor ? `subscriptions for cursor ${cursor}` : "first page of subscriptions"
            } with status ${status}`
        );
        return this._getSubs(
            `${SUBS_API_URL}?${`status=${encodeURIComponent(status)}`}${cursor ? `&after=${cursor}` : ""}`
        );
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
    async getSubscription(...args) {
        if (args.length > 2) {
            throw new Error("getSubscription must have 1 or 2 arguments");
        }

        const [idOrType, condition] = args;
        if (args.length === 1) {
            logger.debug(`Getting subscription for id ${idOrType}`);
        } else {
            logger.debug(`Getting subscription for type ${idOrType} and condition ${printObject(condition)}`);
        }

        let sub;
        const getUntilFound = async (cursor) => {
            let res;
            if (args.length === 1) {
                res = await this.getSubscriptions(cursor);
            } else {
                res = await this.getSubscriptionsByType(idOrType, cursor);
            }

            const { data, pagination } = res;
            sub = data.find((s) => {
                if (condition) {
                    return s.type === idOrType && objectShallowEquals(s.condition, condition);
                } else {
                    return s.id === idOrType;
                }
            });
            if (!sub && pagination.cursor) {
                await getUntilFound(pagination.cursor);
            }
        };
        await getUntilFound();
        return sub;
    }

    /**
     * Subscribe to a new event of given type and condition
     *
     * @param {string} type the event type
     * @param {Object} condition the event condition
     */
    async subscribe(type, condition) {
        logger.debug(`Subscribing to topic with type ${type} and condition ${printObject(condition)}`);
        const token = await AuthManager.getInstance().getToken();
        const headers = {
            "client-id": this.clientID,
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
        };
        let transport = {
            method: this.transportType,
        };
        if (this.transportType === "webhook") {
            transport = {
                ...transport,
                callback: `${baseURL}/teswh/event`,
                secret: this.whSecret,
            };
        } else {
            const session = this.wsclient.getFreeConnection();
            transport = {
                ...transport,
                session_id: session,
            };
        }
        const body = {
            type,
            condition,
            transport,
            version: "1",
        };
        const data = await RequestManager.request(SUBS_API_URL, {
            method: "POST",
            body: JSON.stringify(body),
            headers,
        });
        if (data.data) {
            if (this.transportType === "webhook") {
                return new Promise((resolve, reject) => EventManager.queueSubscription(data, resolve, reject));
            } else {
                const subscription = data.data[0];
                this.wsclient.addSubscription(subscription.transport.session_id, subscription);
                return subscription;
            }
        } else {
            const { error, status, message } = data;
            throw new Error(`${status} ${error}: ${message}`);
        }
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
    async unsubscribe(...args) {
        const token = await AuthManager.getInstance().getToken();
        const headers = {
            "client-id": this.clientID,
            Authorization: `Bearer ${token}`,
        };
        const unsub = async (id) => {
            return RequestManager.request(`${SUBS_API_URL}?id=${id}`, { method: "DELETE", headers }, false);
        };

        if (arguments.length === 1) {
            const id = args[0];
            logger.debug(`Unsubscribing from topic ${id}`);
            return unsub(id);
        } else if (arguments.length === 2) {
            const [type, condition] = args;
            logger.debug(`Unsubscribing from topic with type ${type} and condition ${printObject(condition)}`);
            let id;
            if (this.transportType === "webhook") {
                const sub = await this.getSubscription(type, condition);
                if (sub) {
                    id = sub.id;
                }
            } else {
                id = this.wsclient.findSubscriptionID(type, condition);
            }
            if (id) {
                if (this.transportType === "webhook") {
                    return unsub(id);
                } else {
                    const res = await unsub(id);
                    if (res.ok) {
                        this.wsclient.removeSubscription(id);
                    }
                    return res;
                }
            } else {
                throw new Error("subscription with given type and condition not found");
            }
        } else {
            throw new Error("unsubscribe must only have 1 or 2 arguments");
        }
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

    async _getSubs(url) {
        const token = await AuthManager.getInstance().getToken();
        const headers = {
            "client-id": this.clientID,
            Authorization: `Bearer ${token}`,
        };
        return RequestManager.request(url, { headers });
    }

    /**
     * Use this to ignore TESjs in Express middleware if they conflict and cause problems
     * @param {function} middleware the middleware function to ignore TES
     */
    static ignoreInMiddleware(middleware) {
        return (req, res, next) => {
            return req.path === "/teswh/event" ? next() : middleware(req, res, next);
        };
    }
}

module.exports = TES;
