// Copyright (c) 2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const _browser = typeof global !== undefined ? global : typeof window !== undefined ? window : {};
const WebSocket = _browser.WebSocket || require("ws");
const EventManager = require("./events");
const logger = require("./logger");

const WS_URL = "wss://eventsub-beta.wss.twitch.tv/ws";

class WebSocketClient {
    constructor() {
        // singleton
        if (WebSocketClient._instance) return WebSocketClient._instance;
        if (!(this instanceof WebSocketClient)) return new WebSocketClient();
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
            return Object.values(this._connections[key].subscriptions).filter((s) => s.enabled).length < 100;
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

    _resetKeepaliveTimeout(websocket) {
        clearTimeout(websocket.keepaliveTimeout);
        websocket.keepaliveTimeout = setTimeout(() => {
            EventManager.fire("connection_lost", websocket.subscriptions);
        }, websocket.keepaliveTimeoutLength);
    }

    _addConnection(onWelcome, url = WS_URL) {
        const ws = new WebSocket(url);
        ws.onmessage = (message) => {
            const {
                metadata: { message_type },
                payload,
            } = JSON.parse(message);
            if (message_type === "session_welcome") {
                const {
                    session: { id, keepalive_timeout_seconds },
                } = payload;
                ws.keepaliveTimeoutLength = keepalive_timeout_seconds * 1000;
                ws.keepaliveTimeout = setTimeout(() => {});
                ws.subscriptions = {};
                this._connections[id] = ws;
                this._resetKeepaliveTimeout(ws);
                onWelcome(id);
            } else if (message_type === "session_keepalive") {
                this._resetKeepaliveTimeout(ws);
            } else if (message_type === "session_reconnect") {
                const {
                    session: { id, reconnect_url },
                } = payload;
                this._addConnection(() => delete this._connections[id], reconnect_url);
            } else if (message_type === "notification") {
                this._resetKeepaliveTimeout(ws);
                const { subscription, event } = payload;
                EventManager.fire(subscription.type, event);
            } else {
                logger.debug(`Unhandled WebSocket message type "${message_type}"`);
            }
        };
    }
}
