// Copyright (c) 2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const _browser = typeof global !== undefined ? global : typeof window !== undefined ? window : {};
const WebSocket = _browser.WebSocket || require("ws");
const EventManager = require("./events");
const logger = require("./logger");
const { objectShallowEquals } = require("./utils");

const WS_URL = "wss://eventsub-beta.wss.twitch.tv/ws";

class WebSocketClient {
    constructor() {
        // singleton
        if (WebSocketClient._instance) return WebSocketClient._instance;
        WebSocketClient._instance = this;

        this._connections = {};
    }

    /**
     * Get the ID of a free WebSocket connection
     *
     * @returns a Promise resolving to the ID of a free WebSocket connection
     */
    async getFreeConnection() {
        logger.debug("Getting free WebSocket connection");
        const connectionID = Object.keys(this._connections).find((key) => {
            return Object.keys(this._connections[key].subscriptions).length < 100;
        });
        if (connectionID) {
            logger.debug(`Found free WebSocket connection "${connectionID}"`);
            return connectionID;
        } else {
            if (Object.keys(this._connections).length < 3) {
                logger.debug("No free WebSocket connections, creating a new one...");
                return new Promise((resolve) => this._addConnection(resolve));
            } else {
                logger.debug("No free WebSocket connections, maximum number of connections reached");
                throw new Error("Maximum number of WebSocket connections reached");
            }
        }
    }

    /**
     * Remove a subscription from a connection
     *
     * @param {string} id the connection id
     * @param {string} subscriptionID the subscription id
     */
    removeSubscriptionFromConnection(id, subscriptionID) {
        delete this._connections[id].subscriptions[subscriptionID];
    }

    /**
     * Add a subscription to a connection
     *
     * @param {string} id the connection id
     * @param {Subscription} subscription the subscription data
     */
    addSubscriptionToConnection(id, { id: subscriptionID, type, condition }) {
        this._connections[id].subscriptions[subscriptionID] = { type, condition };
    }

    /**
     * Get the subscription ID for a type and condition
     *
     * @param {string} type the subscription type
     * @param {Condition} condition the condition
     */
    findSubscriptionID(type, condition) {
        for (const connection in this._connections) {
            const id = Object.keys(connection.subscriptions).find((key) => {
                subscription = connection.subscriptions[key];
                return subscription.type === type && objectShallowEquals(subscription.condition, condition);
            });
            if (id) {
                return id;
            }
        }
    }

    _addConnection(onWelcome, url = WS_URL) {
        const ws = new WebSocket(url);
        ws.onmessage = (event) => {
            const {
                metadata: { message_type },
                payload,
            } = JSON.parse(event.data);
            if (message_type === "session_welcome") {
                const {
                    session: { id, keepalive_timeout_seconds },
                } = payload;
                ws.resetTimeout = () => {
                    if (ws.keepaliveTimeout) {
                        clearTimeout(ws.keepaliveTimeout);
                    }
                    ws.keepaliveTimeout = setTimeout(() => {
                        EventManager.fire({ type: "connection_lost" }, ws.subscriptions);
                        delete this._connections[id];
                    }, keepalive_timeout_seconds * 1000);
                };
                ws.subscriptions = {};
                this._connections[id] = ws;
                ws.resetTimeout();
                onWelcome(id);
            } else if (message_type === "session_keepalive") {
                ws.resetTimeout();
            } else if (message_type === "session_reconnect") {
                const {
                    session: { id, reconnect_url },
                } = payload;
                this._addConnection(() => delete this._connections[id], reconnect_url);
            } else if (message_type === "notification") {
                ws.resetTimeout();
                const { subscription, event } = payload;
                EventManager.fire(subscription, event);
            } else if (message_type === "revocation") {
                ws.resetTimeout();
                const { subscription } = payload;
                EventManager.fire({ ...subscription, type: "revocation" }, subscription);
                this.removeSubscriptionFromConnection(subscription.transport.session_id, subscription.id);
            } else {
                logger.debug(`Unhandled WebSocket message type "${message_type}"`);
            }
        };
        ws.onclose = (event) => {
            const [connectionID] = Object.entries(this._connections).find(([_id, value]) => value === ws);
            const { code, reason } = event;
            logger.debug(`WebSocket connection "${connectionID}" closed. ${code}:${reason}`);
            delete this._connections[connectionID];
        };
    }
}
