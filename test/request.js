const { expect } = require("chai");
const nock = require("nock");
const RequestManager = require("../lib/request");
const AuthManager = require("../lib/auth");

describe("RequestManager", () => {
    const TEST_URL = "https://test.com";

    beforeEach(() => {
        AuthManager._instance = undefined;
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it("makes a request given the url and config", async () => {
        nock(TEST_URL).post("/").reply(200, { data: 1 });

        const { data } = await RequestManager.request(TEST_URL, { method: "POST" });
        expect(data).to.eq(1);
    });

    it("makes a request given the url and config and gets a text response", async () => {
        const RESPONSE_VALUE = "text response";
        nock(TEST_URL).post("/").reply(200, RESPONSE_VALUE);

        const res = await RequestManager.request(TEST_URL, { method: "POST" }, false);
        expect(res).to.eq(RESPONSE_VALUE);
    });

    it("gets a new auth token when receiving 401 response and retries", async () => {
        let requested = false;
        nock("https://id.twitch.tv").persist().post("/oauth2/token").query(true).reply(200, { access_token: "token" });
        nock(TEST_URL)
            .persist()
            .post("/")
            .reply(() => {
                if (requested) {
                    return [200, { data: 1 }];
                } else {
                    requested = true;
                    return [401, { message: "invalid token" }];
                }
            });
        new AuthManager("testID", "testSecret");

        const { data } = await RequestManager.request(TEST_URL, { method: "POST", headers: {} });
        expect(requested).to.eq(true);
        expect(data).to.eq(1);
    });
});
