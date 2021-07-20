// Copyright (c) 2021 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const _browser = typeof global !== undefined ? global : typeof window !== undefined ? window : {};
const WebSocket = _browser.WebSocket || require("ws");

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
        const message = JSON.parse(messageRaw);
        const { message_type: type, message_id: id, message_timestamp: timestamp } = message.metadata;
        switch (type) {
            case "websocket_welcome":
                this.connections[id] = this;
        }
    }

    addConnection() {
        const ws = new WebSocket("wss://eventsub.wss.twitch.tv");
        ws.onmessage = this._onMessage.bind(ws);
    }
}

module.exports = WebSocketClient;
