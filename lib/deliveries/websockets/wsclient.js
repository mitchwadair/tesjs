// Copyright (c) 2021 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const _browser = typeof global !== undefined ? global : typeof window !== undefined ? window : {};
const WebSocket = _browser.WebSocket || require("ws");

const logger = require("../../logger");
const EventManager = require("../../events");

class WebSocketClient {
    constructor(config) {
        // singleton
        if (WebSocketClient._instance) return WebSocketClient._instance;
        if (!(this instanceof WebSocketClient)) return new WebSocketClient(config);
        WebSocketClient._instance = this;

        const { ignoreDuplicateMessages, ignoreOldMessages } = config;
        this.ignoreDuplicateMessages = ignoreDuplicateMessages;
        this.ignoreOldMessages = ignoreOldMessages;

        this.connections = {};
    }

    _onMessage(messageRaw) {
        const instance = WebSocketClient._instance;
        const message = JSON.parse(messageRaw);
        const { message_type: type, message_timestamp: timestamp } = message.metadata;
        switch (type) {
            case "websocket_welcome":
                const { minimum_message_frequency_seconds: frequency, id } = message.payload.websocket;
                instance.connections[id] = {
                    socket: this,
                    timeout: setTimeout(() => {
                        // reconnect
                    }, frequency * 1000),
                    frequency,
                };
            case "websocket_keepalive":
                const { id } = message.payload.websocket;
                clearTimeout(instance.connections[id].timeout);
                instance.connections[id].timeout = setTimeout(() => {
                    // reconnect
                }, frequency * 1000);
            case "websocket_reconnect":
                const { id, url } = message.payload.websocket;
                instance.addConnection(url);
                setTimeout(() => {
                    instance.connections[id].socket.close();
                    clearTimeout(instance.connections[id].timeout);
                    delete instance.connections[id];
                }, 10000);
            case "websocket_disconnect":
                const { id, disconnect_reason: reason } = message.payload.websocket;
                logger.debug(`Socket ${id} disconnected for reason "${reason}"`);
                clearTimeout(instance.connections[id].timeout);
                delete instance.connections[id];
            case "notification":
                const { subscription, event } = message.payload;
                EventManager.fire(subscription, event);
            case "revocation":
                const { subscription } = message.payload;
                EventManager.fire({ ...subscription, type: "revocation" }, subscription);
        }
    }

    addConnection(url = "wss://eventsub.wss.twitch.tv") {
        const ws = new WebSocket(url);
        ws.onmessage = this._onMessage.bind(ws);
    }
}

module.exports = WebSocketClient;
