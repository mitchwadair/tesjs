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

    addConnection() {
        // TODO: implement connection add
    }
}

module.exports = WebSocketClient;
