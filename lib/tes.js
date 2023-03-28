const whserver = require("./whserver");
const WebSocketClient = require("./wsclient");
const EventManager = require("./events");
const AuthManager = require("./auth");
const RequestManager = require("./request");
const { objectShallowEquals, printObject } = require("./utils");
const logger = require("./logger");

const SUBS_API_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";

/**
 * @typedef {Object} TES~Config
 * @param {TES~Config~Options} [options] Basic configuration options
 * @param {TES~Config~Identity} identity Identity information
 * @param {TES~Config~Listener} listener Your notification listener details
 */

/**
 * Basic configuration options
 *
 * @typedef {Object} TES~Config~Options
 * @param {boolean} [debug=false] Set to true for in-depth logging
 * @param {boolean} [logging=true] Set to false for no logging
 */

/**
 * Identity configuration
 *
 * @typedef {Object} TES~Config~Identity
 * @param {string} id Your client ID
 * @param {string} [secret] Your client secret, required for webhook transport or
 *     when not using `onAuthenticationFailure` in server-side `websocket` applications
 * @param {TES~Config~Identity~onAuthenticationFailure} [onAuthenticationFailure] Callback function called
 *     when API requests get an auth failure. If you already have an authentication solution for your app
 *     elsewhere use this to avoid token conflicts
 * @param {string} [accessToken] If you already have an access token, put it here. Must
 *     be user access token for `websocket` transport, must be app access token for `webhook` transport.  Should
 *     usually be paired with `onAuthenticationFailure` on server-side applications
 * @param {string} [refreshToken] The refresh token to use if using `websocket` transport
 *     server-side. Required when not using `onAuthenticationFailure` in server-side `websocket` applications
 */

/**
 * Callback function called when API requests get an auth failure. If you already have an authentication solution
 * for your app elsewhere use this to avoid token conflicts
 *
 * @callback TES~Config~Identity~onAuthenticationFailure
 * @returns {Promise} Promise that resolves a new access token
 * @example
 * ```js
 * async function onAuthenticationFailure() {
 *     const res = await getNewAccessToken(); // your token refresh logic
 *     return res.access_token;
 * }
 * ```
 */

/**
 * Listener configuration
 *
 * @typedef {Object} TES~Config~Listener
 * @param {"webhook"|"websocket"} type The type of transport to use
 * @param {string} [baseURL] Required for `webhook` transport. The base URL where your app is
 *     hosted. See [Twitch doc](https://dev.twitch.tv/docs/eventsub) for details on local development
 * @param {string} [secret] Required for `webhook` transport. The secret to use for your `webhook`
 *     subscriptions. Should be different from your client secret
 * @param {Express} [server] The Express app object. Use if integrating with an existing Express app
 * @param {number} [port=process.env.PORT,8080] A custom port to use
 * @param {boolean} [ignoreDuplicateMessages=true] Ignore event messages with IDs that have already
 *     been seen. Only used in `webhook` transport
 * @param {boolean} [ignoreOldMessages=true] Ignore event messages with timestamps older than ten
 *     minutes. Only used in `webhook` transport
 */

/**
 * @license
 * Copyright (c) 2020-2023 Mitchell Adair
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
class TES {
    /**
     * @typicalname tes
     * @param {TES~Config} config The TES configuration
     * @returns {TES} The TESjs instance
     * @example
     * Minimum `websocket` config
     * ```js
     * const config = {
     *     identity: {
     *         id: YOUR_CLIENT_ID,
     *         accessToken: YOUR_USER_ACCESS_TOKEN,
     *     }
     *     listener: { type: "websocket" },
     * };
     * const tes = new TES(config);
     * ```
     * @example
     * Minimum `webhook` config
     * ```js
     * const config = {
     *     identity: {
     *         id: YOUR_CLIENT_ID,
     *         secret: YOUR_CLIENT_SECRET,
     *     },
     *     listener: {
     *         type: "webhook",
     *         baseURL: "https://example.com",
     *         secret: YOUR_WEBHOOKS_SECRET,
     *     },
     * };
     * const tes = new TES(config);
     * ```
     */
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
            if (typeof window === "undefined" && !onAuthenticationFailure && !refreshToken) {
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
     * Get a list of your event subscriptions
     *
     * @param {string} [cursor] The pagination cursor
     * @returns {Promise} Subscription data. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details
     * @example
     * ```js
     * const subs = await tes.getSubscriptions();
     * console.log(`I have ${subs.total} event subscriptions`);
     * ```
     */
    getSubscriptions(cursor) {
        logger.debug(`Getting ${cursor ? `subscriptions for cursor ${cursor}` : "first page of subscriptions"}`);
        return this._getSubs(`${SUBS_API_URL}${cursor ? `?after=${cursor}` : ""}`);
    }

    /**
     * Get a list of your event subscriptions by type
     *
     * @param {string} type The type of subscription. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details
     * @param {string} [cursor] The pagination cursor
     * @returns {Promise} Subscription data. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details
     * @example
     * ```js
     * const subs = await tes.getSubscriptionsByType("channel.update");
     * console.log(`I have ${subs.total} "channel.update" event subscriptions`);
     * ```
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
     * Get a list of your event subscriptions by status
     *
     * @param {string} status The subscription status. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details
     * @param {string} [cursor] The pagination cursor
     * @returns {Promise} Subscription data. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details
     * @example
     * ```js
     * const subs = await tes.getSubscriptionsByType("channel.update");
     * console.log(`I have ${subs.total} "channel.update" event subscriptions`);
     * ```
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
     * Get subscription data for an individual subscription. Search either by id or by type and condition
     *
     * @signature `getSubscription(id)`
     * @signature `getSubscription(type, condition)`
     * @param {string} idOrType The subscription id or [type](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types)
     * @param {Object} [condition] The subscription condition, required when finding by type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#conditions) for details
     * @returns {Promise} The subscription data
     * @example
     * Find a subscription by id
     * ```js
     * const sub = await tes.getSubscription("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef");
     * console.log(`The status for subscription ${sub.id} is ${sub.status}`);
     * ```
     * @example
     * Find a subscription by type and condition
     * ```js
     * const condition = { broadcaster_user_id: "1337" };
     * const sub = await tes.getSubscription("channel.update", condition);
     * console.log(`The status for subscription ${sub.id} is ${sub.status}`);
     * ```
     */
    async getSubscription(idOrType, condition) {
        if (condition) {
            logger.debug(`Getting subscription for type ${idOrType} and condition ${printObject(condition)}`);
        } else {
            logger.debug(`Getting subscription for id ${idOrType}`);
        }

        let sub;
        const getUntilFound = async (cursor) => {
            let res;
            if (condition) {
                res = await this.getSubscriptionsByType(idOrType, cursor);
            } else {
                res = await this.getSubscriptions(cursor);
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
     * Subscribe to an event
     *
     * @param {string} type The subscription type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details
     * @param {Object} condition The subscription condition. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#conditions) for details
     * @param {string} [version] The subscription version. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details
     * @returns {Promise} A Promise that resolves when subscribing is complete with the subscription data
     * @example
     * ```js
     * const condition = { broadcaster_user_id: "1337" };
     * const sub = tes.subscribe("channel.update", condition);
     * console.log(`Created subscription to ${sub.type}, subscription id ${sub.id}`);
     * ```
     */
    async subscribe(type, condition, version = "1") {
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
            transport.callback = `${this.baseURL}/teswh/event`;
            transport.secret = this.whSecret;
        } else {
            const session = await this.wsclient.getFreeConnection();
            transport.session_id = session;
        }
        const body = {
            type,
            condition,
            transport,
            version,
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
     * Unsubscribe from an event. Unsubscribe either by id, or by type and condition
     *
     * @signature `unsubscribe(id)`
     * @signature `unsubscribe(type, condition)`
     * @param {string} idOrType The subscription id or [type](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types)
     * @param {Object} [condition] The subscription condition, required when finding by type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#conditions) for details
     * @returns {Promise} Resolves when unsubscribed
     * @example
     * Unsubscribe by id
     * ```js
     * await tes.unsubscribe("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef");
     * console.log("Successfully unsubscribed");
     * ```
     * @example
     * Unsubscribe by type and condition
     * ```js
     * const condition = { broadcaster_user_id: "1337" };
     * await tes.unsubscribe("channel.update", condition);
     * console.log("Successfully unsubscribed");
     * ```
     */
    async unsubscribe(idOrType, condition) {
        const token = await AuthManager.getInstance().getToken();
        const headers = {
            "client-id": this.clientID,
            Authorization: `Bearer ${token}`,
        };
        const unsub = async (id) => {
            return RequestManager.request(`${SUBS_API_URL}?id=${id}`, { method: "DELETE", headers }, false);
        };

        if (condition) {
            logger.debug(`Unsubscribing from topic with type ${idOrType} and condition ${printObject(condition)}`);
            let id;
            if (this.transportType === "webhook") {
                const sub = await this.getSubscription(idOrType, condition);
                if (sub) {
                    id = sub.id;
                }
            } else {
                id = this.wsclient.findSubscriptionID(idOrType, condition);
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
            logger.debug(`Unsubscribing from topic ${idOrType}`);
            return unsub(idOrType);
        }
    }

    /**
     * Called when an event TES is listening for is triggered. See [TES.on](#TES+on) for examples
     *
     * @callback TES~onEventCallback
     * @param {Object} [event] The event data. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#events) for details.
     *     See the [TES.on](#TES+on) examples for details on `revocation` and `connection_lost`
     * @param {Object} [subscription] The subscription data corresponding to the event. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#subscription) for details
     * @returns {void}
     */

    /**
     * Add an event handler. This will handle ALL events of the type
     *
     * @param {string|"revocation"|"connection_lost"} type The subscription type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details.
     *     See the examples for details on `revocation` and `connection_lost`
     * @param {TES~onEventCallback} callback The function to call when the event happens
     * @returns {void}
     * @example
     * ```js
     * tes.on("channel.update", (event, subscription) => {
     *     console.log(`Event triggered for subscription ${subscription.id}`);
     *     console.log(`${event.broadcaster_user_id}'s title is now "${event.title}"`);
     * });
     * ```
     * @example
     * The `revocation` event is fired when Twitch revokes a subscription. This can happen
     * for various reasons [according to Twitch](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/#revoking-your-subscription).
     * The "event" argument is the subscription data. This means that for this, the first and second arguments are basically identical
     *
     * **NOTE**: No explicit subscription is needed for this event to be fired
     * ```js
     * tes.on("revocation", (subscriptionData) => {
     *     console.log(`Subscription ${subscriptionData.id} has been revoked`);
     *     // perform necessary cleanup here
     * });
     * ```
     * @example
     * The `connection_lost` event is fired when a WebSocket connection is lost. All related
     * subscriptions should be considered stale if this happens. You can read more about this case
     * in the [Twitch doc](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#keepalive-message).
     * The "event" argument is an `Object` which has subscription ids as keys and type and condition as the values
     *
     * **NOTE**: No explicit subscription is needed for this event to be fired
     * ```js
     * tes.on("connection_lost", (subscriptions) => {
     *     // if your subscriptions are important to you, resubscribe to them
     *     Object.values(subscriptions).forEach((subscription) => {
     *         tes.subscribe(subscription.type, subscription.condition);
     *     });
     * });
     * ```
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

    static ignoreInMiddleware(middleware) {
        return (req, res, next) => {
            return req.path === "/teswh/event" ? next() : middleware(req, res, next);
        };
    }
}

module.exports = TES;
