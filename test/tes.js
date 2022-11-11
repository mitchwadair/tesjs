const { expect } = require("chai");
const nock = require("nock");
const TES = require("../main");
const { buildObjectWithoutKey } = require("./testUtil");

describe("TES", () => {
    const validWebhookIdentity = {
        id: "test",
        secret: "t35t",
    };
    const validWebhookListener = {
        type: "webhook",
        baseURL: "https://test.com",
        secret: "wh5ecr3t",
    };
    const validWebhookConfig = {
        identity: validWebhookIdentity,
        listener: validWebhookListener,
    };

    const webhookConfigMissingIdentity = buildObjectWithoutKey(validWebhookConfig, "identity");
    const webhookConfigMissingListener = buildObjectWithoutKey(validWebhookConfig, "listener");
    const configMissingId = {
        identity: buildObjectWithoutKey(validWebhookIdentity, "id"),
        listener: validWebhookListener,
    };
    const webhookConfigMissingIdentitySecret = {
        identity: buildObjectWithoutKey(validWebhookIdentity, "secret"),
        listener: validWebhookListener,
    };
    const webhookConfigMissingBaseURL = {
        identity: validWebhookIdentity,
        listener: buildObjectWithoutKey(validWebhookListener, "baseURL"),
    };
    const webhookConfigMissingListenerSecret = {
        identity: validWebhookIdentity,
        listener: buildObjectWithoutKey(validWebhookListener, "secret"),
    };

    const validWebSocketIdentity = { id: "test", accessToken: "aCc3sSt0kEn" };
    const validWebSocketListner = { type: "websocket" };
    const validWebSocketConfigForBrowser = {
        identity: validWebSocketIdentity,
        listener: validWebSocketListner,
    };

    const websocketConfigMissingAccessToken = {
        identity: buildObjectWithoutKey(validWebSocketIdentity, "accessToken"),
        listener: validWebSocketListner,
    };
    const websocketConfigWithRefreshTokenMissingSecret = {
        identity: { ...validWebSocketIdentity, refreshToken: "r3fReShT0kEn" },
        listener: validWebSocketListner,
    };

    const configMissingType = {
        identity: validWebSocketIdentity,
        listener: {},
    };
    const configWithInvalidType = {
        ...configMissingType,
        listener: { type: "invalid" },
    };

    const tryInitTES = (config) => {
        const tes = new TES(config);
        return tes;
    };

    before(() => {
        nock("https://id.twitch.tv").persist().post("/oauth2/token").query(true).reply(200, { access_token: "token" });
    });

    beforeEach(() => {
        TES._instance = null;
    });

    after(() => {
        nock.cleanAll();
    });

    it("errors when 'identity' is missing in config", () => {
        expect(() => tryInitTES(webhookConfigMissingIdentity)).to.throw(Error);
    });

    it("errors when 'listener' is missing from config", () => {
        expect(() => tryInitTES(webhookConfigMissingListener)).to.throw(Error);
    });

    it("errors when 'id' is missing from identity", () => {
        expect(() => tryInitTES(configMissingId)).to.throw(Error);
    });

    it("errors when 'type' is missing from listener", () => {
        expect(() => tryInitTES(configMissingType)).to.throw(Error);
    });

    it("errors when 'type' is not 'websocket' or 'webhook'", () => {
        expect(() => tryInitTES(configWithInvalidType)).to.throw(Error);
    });

    it("errors when 'secret' is missing from 'webhook' identity", () => {
        expect(() => tryInitTES(webhookConfigMissingIdentitySecret)).to.throw(Error);
    });

    it("errors when 'baseURL' is missing from 'webhook' listener", () => {
        expect(() => tryInitTES(webhookConfigMissingBaseURL)).to.throw(Error);
    });

    it("errors when 'secret' is missing from 'webhook' listener", () => {
        expect(() => tryInitTES(webhookConfigMissingListenerSecret)).to.throw(Error);
    });

    it("errors when 'accessToken' is missing from 'websocket' identity", () => {
        expect(() => tryInitTES(websocketConfigMissingAccessToken)).to.throw(Error);
    });

    it("errors when 'secret' is missing from 'websocket' identity with 'refreshToken'", () => {
        expect(() => tryInitTES(websocketConfigWithRefreshTokenMissingSecret)).to.throw(Error);
    });

    it("errors when 'onAuthenticationFailure' and 'refreshToken' are missing from 'websocket' not on browser", () => {
        expect(() => tryInitTES(validWebSocketConfigForBrowser)).to.throw(Error);
    });

    it("returns an instance of itself", (done) => {
        const tes = tryInitTES(validWebhookConfig);
        setTimeout(() => {
            tes._whserverlistener.close();
            expect(tes).to.be.an.instanceOf(TES);
            done();
        }, 100);
    });
});
