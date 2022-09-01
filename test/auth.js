const { expect } = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const AuthManager = require("../lib/auth");
const { buildObjectWithoutKey } = require("./testUtil");

describe("AuthManager", () => {
    const expected1 = "test_token";
    const expected2 = "refreshed_token";

    const baseConfig = {
        clientID: "testID",
        clientSecret: "testSecret",
    };

    let auth;
    beforeEach(() => {
        let refresh = false;
        nock("https://id.twitch.tv")
            .persist()
            .post("/oauth2/token")
            .query(true)
            .reply(200, () => {
                if (refresh) {
                    return { access_token: expected2 };
                }
                refresh = true;
                return { access_token: expected1 };
            });
        auth = new AuthManager(baseConfig);
    });

    afterEach(() => {
        nock.cleanAll();
        AuthManager._instance = undefined;
    });

    it("returns an instance of itself", async () => {
        expect(auth).to.be.an.instanceOf(AuthManager);
    });

    it("getToken resolves a token", async () => {
        const token = await auth.getToken();
        expect(token).to.eq(expected1);
    });

    it("refreshToken refreshes the token", async () => {
        let token = await auth.getToken();
        expect(token).to.eq(expected1);

        await auth.refreshToken();

        token = await auth.getToken();
        expect(token).to.eq(expected2);
    });

    it("refreshes token when _validateToken gets a 401", async () => {
        nock("https://id.twitch.tv").get("/oauth2/validate").reply(401, { message: "invalid token" });

        let token = await auth.getToken();
        expect(token).to.eq(expected1);

        await auth._validateToken();

        token = await auth.getToken();
        expect(token).to.eq(expected2);
    });

    it("errors when 'clientID' or 'clientSecret' are not defined and 'onAuthFailure' is not defined", async () => {
        AuthManager._instance = undefined;
        expect(() => new AuthManager()).to.throw(Error);
        expect(() => new AuthManager({})).to.throw(Error);
        expect(() => new AuthManager({ initialToken: "initial_token" })).to.throw(Error);
        expect(() => new AuthManager(buildObjectWithoutKey(baseConfig, "clientID"))).to.throw(Error);
        expect(() => new AuthManager(buildObjectWithoutKey(baseConfig, "clientSecret"))).to.throw(Error);
    });

    it("uses custom refresh function when present", async () => {
        AuthManager._instance = undefined;
        const expected = "custom_token";
        const customTokenRefresh = async () => {
            return expected;
        };

        auth = new AuthManager({ ...baseConfig, onAuthFailure: customTokenRefresh });
        const token = await auth.getToken();
        expect(token).to.eq(expected);
    });

    it("uses initial auth token when present", async () => {
        AuthManager._instance = undefined;
        const expected = "initial_token";

        auth = new AuthManager({ ...baseConfig, initialToken: expected });
        const token = await auth.getToken();
        expect(token).to.eq(expected);
    });
});
