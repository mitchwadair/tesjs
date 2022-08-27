// Copyright (c) 2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const fetch = require("node-fetch");
const logger = require("./logger");

const AUTH_API_URL = "https://id.twitch.tv/oauth2";

class AuthManager {
    constructor(clientID, clientSecret) {
        if (AuthManager._instance) {
            return AuthManager._instance;
        }
        AuthManager._instance = this;

        this._clientID = clientID;
        this._clientSecret = clientSecret;

        this._authToken;
        this._validationInterval;

        this.refreshToken();
    }

    static getInstance() {
        return AuthManager._instance;
    }

    /**
     * Gets the current authentication token.  This will wait until the
     * auth token exists before returning.  The auth token will be undefined
     * in the cases of app startup (until initial fetch/refresh) and token
     * refresh.  If getting the token takes longer than 1000 seconds,
     * something catastrophic is up and it will reject.
     *
     * @returns a promise that resolves the current token
     */
    getToken() {
        return new Promise((resolve, reject) => {
            const start = new Date();
            const retry = () => {
                if (this._authToken) {
                    resolve(this._authToken);
                } else if (new Date() - start > 1000000) {
                    const message = "Timed out trying to get token";
                    logger.error(`${message}.  Something catastrophic has happened!`);
                    reject(message);
                } else {
                    setTimeout(retry);
                }
            };
            retry();
        });
    }

    /**
     * Refreshes the authentication token
     */
    async refreshToken() {
        logger.debug("Getting new app access token");
        try {
            this._authToken = undefined; // set current token undefined to prevent API calls from using stale token
            const res = await fetch(
                `${AUTH_API_URL}/token?client_id=${this._clientID}&client_secret=${this._clientSecret}&grant_type=client_credentials`,
                { method: "POST" }
            );
            if (res.ok) {
                const { access_token } = await res.json();
                this._authToken = access_token;
                this._resetValidationInterval();
            } else {
                const { message } = await res.json();
                throw new Error(message);
            }
        } catch (err) {
            logger.error(`Error refreshing app access token: ${err.message}`);
        }
    }

    async _validateToken() {
        logger.debug("Validating app access token");
        const headers = {
            "client-id": this.clientID,
            Authorization: `Bearer ${this._authToken}`,
        };
        const res = await fetch(`${AUTH_API_URL}/validate`, { headers });
        const data = await res.json();
        if (data.status === 401 && data.message === "invalid access token") {
            logger.debug("Access token not valid, refreshing...");
            this.refreshToken();
        }
    }

    _resetValidationInterval() {
        clearInterval(this._validationInterval);
        this._validationInterval = setInterval(this._validateToken, 3600000);
    }
}

module.exports = AuthManager;
