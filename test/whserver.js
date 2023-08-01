const TES = require("../main");
const request = require("supertest");
const nock = require("nock");
const sinon = require("sinon");
const { cmd } = require("./testUtil");
const { expect } = require("chai");
const AuthManager = require("../lib/auth");

const secret = "s3cRe7";
const whSecret = "s3cRe7tW0o";
const REDIRECT_URL = "http://localhost:8080/teswh/event";

describe("whserver", () => {
    let tes, app;
    before((done) => {
        nock("https://id.twitch.tv").post("/oauth2/token").query(true).reply(200, { access_token: "token" });
        setTimeout(() => {
            AuthManager._instance = undefined;
            TES._instance = undefined;
            tes = new TES({
                identity: {
                    id: "test",
                    secret: secret,
                },
                listener: {
                    type: "webhook",
                    baseURL: "localhost",
                    secret: whSecret,
                },
                options: { logging: false },
            });
            app = tes.whserver;
            done();
        });
    });

    afterEach(() => {
        nock.cleanAll();
    });

    after(() => {
        tes._whserverlistener.close();
    });

    it("responds with 401 to request without twitch message signature", (done) => {
        request(app).post("/teswh/event").send({}).expect(401, done);
    });

    it("responds with 403 to request with signature mismatch", async () => {
        const out = await cmd(`twitch event trigger subscribe -F ${REDIRECT_URL} -s wrongsecret`);
        expect(out).to.contain("Received Status Code: 403");
        expect(out).to.contain("Request signature mismatch");
    });

    it("responds with challenge when challenged", (done) => {
        nock("https://api.twitch.tv")
            .post("/helix/eventsub/subscriptions")
            .reply(201, () => {
                setTimeout(async () => {
                    const out = await cmd(`twitch event verify channel.ban -F ${REDIRECT_URL} -s ${whSecret} -u 1`);
                    expect(out).to.contain("Valid response.");
                    expect(out).to.contain("Valid content-type header.");
                    expect(out).to.contain("Valid status code.");
                    done();
                });
                return {
                    data: [{ id: 1 }],
                };
            });

        tes.subscribe("channel.update", { broadcaster_user_id: "1234" });
    });

    it("responds with 200 OK when receiving a notification and the event should be fired", async () => {
        const cb = sinon.spy();
        tes.on("channel.follow", cb);
        await cmd(`twitch event trigger channel.follow --version 2 -F ${REDIRECT_URL} -s ${whSecret}`);
        sinon.assert.called(cb);
    });

    it("responds with 200 OK when receiving a revocation and the revocation event should be fired", async () => {
        const cb = sinon.spy();
        tes.on("revocation", cb);
        await cmd(
            `twitch event trigger channel.follow --version 2 -F ${REDIRECT_URL} -s ${whSecret} -r authorization_revoked`
        );
        sinon.assert.called(cb);
    });

    it("responds with 200 OK when receiving a duplicate notification and the event should not be fired", async () => {
        let resendID;
        const cb = (_event, { id }) => {
            resendID = id;
        };
        const spy = sinon.spy(cb);
        tes.on("channel.follow", spy);

        await cmd(`twitch event trigger channel.follow --version 2 -F ${REDIRECT_URL} -s ${whSecret}`);
        await cmd(`twitch event retrigger channel.follow -F ${REDIRECT_URL} -s ${whSecret} -i ${resendID}`);
        sinon.assert.calledOnce(spy);
    });

    it("responds with 200 OK when receiving an old notification and the event should not be fired", async () => {
        const oldTimestamp = new Date(Date.now() - 601000).toISOString();
        const cb = sinon.spy();
        tes.on("channel.follow", cb);
        await cmd(
            `twitch event trigger channel.follow --version 2 -F ${REDIRECT_URL} -s ${whSecret} --timestamp ${oldTimestamp}`
        );
        sinon.assert.notCalled(cb);
    });
});
