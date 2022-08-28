const { expect } = require("chai");
const nock = require("nock");
const AuthManager = require("../lib/auth");

describe("AuthManager", () => {
    const expected1 = "test_token";
    const expected2 = "refreshed_token";

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
        auth = new AuthManager("testID", "testSecret");
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

    it("refreshes token when _validate gets a 401", async () => {
        nock("https://id.twitch.tv").get("/oauth2/validate").reply(401, { message: "invalid token" });

        let token = await auth.getToken();
        expect(token).to.eq(expected1);

        await auth._validateToken();

        token = await auth.getToken();
        expect(token).to.eq(expected2);
    });
});
