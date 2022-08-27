// Copyright (c) 2020-2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const whserver = require("./whserver");
const EventManager = require("./events");
const AuthManager = require("./auth");
const RequestManager = require("./request");
const { objectShallowEquals } = require("./utils");
const logger = require("./logger");

const SUBS_API_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";
const AUTH_API_URL = "https://id.twitch.tv/oauth2";

/**
 *  Twitch EventSub
 */
class TES {
    constructor(config) {
        // TES singleton
        if (TES._instance) {
            return TES._instance;
        }

        if (!(this instanceof TES)) {
            return new TES(config);
        }

        TES._instance = this;

        // ensure we have an identity
        if (!config.identity) throw new Error("TES config must contain 'identity'");
        if (!config.listener) throw new Error("TES config must contain 'listener'");

        const {
            identity: { id, secret },
            listener: { baseURL, secret: whSecret, port, ignoreDuplicateMessages, ignoreOldMessages, server },
        } = config;

        if (!id) throw new Error("TES identity config must contain 'id'");
        if (!secret) throw new Error("TES identity config must contain 'secret'");
        if (!baseURL) throw new Error("TES listener config must contain 'baseURL'");
        if (!whSecret) throw new Error("TES listener config must contain 'secret'");

        this.clientID = id;
        this.clientSecret = secret;

        this.baseURL = baseURL;
        this.whSecret = whSecret;

        this.port = port || process.env.PORT || 8080;
        const serverConfig = {
            ignoreDuplicateMessages: ignoreDuplicateMessages === false ? false : true,
            ignoreOldMessages: ignoreOldMessages === false ? false : true,
        };
        this.whserver = whserver(server, this.whSecret, serverConfig);
        this._whserverlistener = server ? null : this.whserver.listen(this.port);

        config.options = config.options || {};
        config.options.debug && logger.setLevel("debug");
        config.options.logging === false && logger.setLevel("none");

        new AuthManager(id, secret);
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
            logger.debug(`Getting subscription for type ${idOrType} and condition ${condition}`);
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
                    if (s.type === idOrType) {
                        return objectShallowEquals(s.condition, condition);
                    }
                    return false;
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
        logger.debug(`Subscribing to topic with type ${type} and condition ${condition}`);
        const auth = await AuthManager.getInstance().getToken();
        const headers = {
            "Client-ID": this.clientID,
            Authorization: `Bearer ${auth}`,
            "Content-Type": "application/json",
        };
        const body = {
            type: type,
            version: "1",
            condition: condition,
            transport: {
                method: "webhook",
                callback: `${this.baseURL}/teswh/event`,
                secret: this.whSecret,
            },
        };
        const data = await RequestManager.request(SUBS_API_URL, {
            method: "POST",
            body: JSON.stringify(body),
            headers,
        });
        return new Promise((resolve, reject) => EventManager.queueSubscription(data, resolve, reject));
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
        const auth = await AuthManager.getInstance().getToken();
        const headers = {
            "Client-ID": this.clientID,
            Authorization: `Bearer ${auth}`,
        };
        const unsub = async (id) => {
            return RequestManager.request(`${SUBS_API_URL}?id=${id}`, { method: "DELETE", headers }, false);
        };

        if (arguments.length === 1) {
            const id = args[0];
            logger.debug(`Unsubscribing from topic ${id}`);
            return unsub(id);
        } else if (arguments.length === 2) {
            const type = args[0];
            const condition = args[1];
            logger.debug(`Unsubscribing from topic with type ${type} and condition ${condition}`);
            const sub = await this.getSubscription(type, condition);
            if (sub) {
                return unsub(sub.id);
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
        const auth = await AuthManager.getInstance().getToken();
        const headers = {
            "Client-ID": this.clientID,
            Authorization: `Bearer ${auth}`,
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
