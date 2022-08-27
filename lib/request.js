// Copyright (c) 2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const fetch = require("node-fetch");
const AuthManager = require("./auth");
const logger = require("./logger");

class RequestManager {
    constructor() {
        RequestManager._instance = this;
    }

    /**
     *
     * @param {string} url the url to fetch
     * @param {object} config fetch config object
     * @param {boolean} json whether or not to parse response as JSON
     *                       if false, parse as text
     */
    async request(url, config, json = true) {
        const r = async () => {
            const res = await fetch(url, config);
            if (res.status === 401) {
                // TODO: External auth handling (#47)
                logger.debug("Request received 401 unauthorized response. Refreshing token and retrying...");
                const auth = AuthManager.getInstance();
                await auth.refreshToken();
                config.headers.Authorization = `Bearer ${await auth.getToken()}`;
                return r();
            } else {
                if (json) {
                    return res.json();
                } else {
                    return res.text();
                }
            }
        };
        return r();
    }
}

const instance = new RequestManager();
module.exports = instance;
