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

        this.connections = {};
    }

    /**
     * Get the ID of a free WebSocket connection
     *
     * @returns a Promise resolving to the ID of a free WebSocket connection
     */
    async getFreeConnection() {
        logger.debug("Getting free WebSocket connection");
        const connectionID = Object.keys(this.connections).find((key) => {
            return Object.values(this.connections[key].subscriptions).filter((s) => s.enabled).length < 100;
        });
        if (connectionID) {
            logger.debug(`Found free WebSocket connection "${connectionID}"`);
            return connectionID;
        } else {
            if (Object.keys(this.connections).length < 3) {
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

    _addConnection(resolve) {
        const ws = new WebSocket(WS_URL);
        ws.onmessage = (message) => {
            const {
                metadata: { message_type },
                payload,
            } = JSON.parse(message);
            switch (message_type) {
                case "session_welcome":
                    const {
                        session: { id, keepalive_timeout_seconds },
                    } = payload;
                    ws.keepaliveTimeoutLength = keepalive_timeout_seconds * 1000;
                    ws.keepaliveTimeout = setTimeout(() => {});
                    ws.subscriptions = {};
                    this.connections[id] = ws;
                    this._resetKeepaliveTimeout(ws);
                    resolve(id);
                    break;
                case "session_keepalive":
                    this._resetKeepaliveTimeout(ws);
                    break;
                default:
                    logger.debug(`Unhandled WebSocket message type "${message_type}"`);
                    break;
            }
        };
    }
}
