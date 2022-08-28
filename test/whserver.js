const TES = require("../main");
const request = require("supertest");
const nock = require("nock");
const sinon = require("sinon");
const crypto = require("crypto");
const { cmd } = require("./testUtil");
const { expect } = require("chai");
const AuthManager = require("../lib/auth");

// example data taken from https://dev.twitch.tv/docs/eventsub examples

const secret = "s3cRe7";
const whSecret = "s3cRe7tW0o";
const timestamp = new Date().toISOString();

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

    it("responds with 401 to request without twitch message signature", (done) => {
        request(app).post("/teswh/event").send({}).expect(401, done);
    });

    it("responds with 403 to request with signature mismatch", async () => {
        const out = await cmd(`twitch event trigger subscribe -F ${REDIRECT_URL} -s wrongsecret`);
        expect(out).to.contain("Recieved Status Code: 403");
        expect(out).to.contain("Request signature mismatch");
    });

    it("responds with challenge when challenged", (done) => {
        nock("https://api.twitch.tv")
            .post("/helix/eventsub/subscriptions")
            .reply(201, () => {
                setTimeout(async () => {
                    const out = await cmd(`twitch event verify channel.update -F ${REDIRECT_URL} -s ${whSecret}`);
                    expect(out).to.contain("Valid response");
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
        await cmd(`twitch event trigger channel.follow -F ${REDIRECT_URL} -s ${whSecret}`);
        sinon.assert.called(cb);
    });

    // TODO: update when able to send a revocation notification in Twitch CLI
    it("responds with 200 OK when receiving a revocation and the revocation event should be fired", (done) => {
        let notificationRecieved = false;
        tes.on("revocation", () => {
            notificationRecieved = true;
        });
        const payload = {
            subscription: {
                id: "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
                status: "authorization-revoked",
                type: "channel.follow",
                version: "1",
                condition: {
                    broadcaster_user_id: "12826",
                },
                transport: {
                    method: "webhook",
                    callback: "https://example.com/webhooks/callback",
                },
                created_at: "2019-11-16T10:11:12.123Z",
            },
            limit: 10000,
            total: 1,
            pagination: {},
        };
        const signature = crypto
            .createHmac("sha256", whSecret)
            .update("84c1e79a-2a4b-4c13-ba0b-4312293e9308" + timestamp + Buffer.from(JSON.stringify(payload), "utf-8"))
            .digest("hex");
        request(app)
            .post("/teswh/event")
            .set({
                "Twitch-Eventsub-Message-Id": "84c1e79a-2a4b-4c13-ba0b-4312293e9308",
                "Twitch-Eventsub-Message-Retry": 0,
                "Twitch-Eventsub-Message-Type": "revocation",
                "Twitch-Eventsub-Message-Signature": `sha256=${signature}`,
                "Twitch-Eventsub-Message-Timestamp": timestamp,
                "Twitch-Eventsub-Subscription-Type": "channel.follow",
                "Twitch-Eventsub-Subscription-Version": 1,
            })
            .send(payload)
            .expect(200)
            .end((err, { text }) => {
                if (err) return done(err);
                expect(text).to.eq("OK");
                expect(notificationRecieved).to.eq(true);
                done();
            });
    });

    it("responds with 200 OK when receiving a duplicate notification and the event should not be fired", async () => {
        let resendID;
        const cb = (_event, { id }) => {
            resendID = id;
        };
        const spy = sinon.spy(cb);
        tes.on("channel.follow", spy);

        await cmd(`twitch event trigger channel.follow -F ${REDIRECT_URL} -s ${whSecret}`);
        await cmd(`twitch event retrigger channel.follow -F ${REDIRECT_URL} -s ${whSecret} -i ${resendID}`);
        sinon.assert.calledOnce(spy);
    });

    // TODO: update when able to set timestamps in Twitch CLI
    it("responds with 200 OK when receiving an old notification and the event should not be fired", (done) => {
        let notificationRecieved = false;
        tes.on("channel.follow", () => {
            notificationRecieved = true;
        });
        const payload = {
            subscription: {
                id: "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
                type: "channel.follow",
                version: "1",
                condition: {
                    broadcaster_user_id: "12826",
                },
                transport: {
                    method: "webhook",
                    callback: "https://example.com/webhooks/callback",
                },
                created_at: "2019-11-16T10:11:12.123Z",
            },
            event: {
                user_id: "1337",
                user_name: "awesome_user",
                broadcaster_user_id: "12826",
                broadcaster_user_name: "twitch",
            },
        };
        const oldTime = new Date(Date.now() - 601000).toISOString();
        const signature = crypto
            .createHmac("sha256", whSecret)
            .update("befa7b53-d79d-478f-86b9-120f112b044d" + oldTime + Buffer.from(JSON.stringify(payload), "utf-8"))
            .digest("hex");
        request(app)
            .post("/teswh/event")
            .set({
                "Twitch-Eventsub-Message-Id": "befa7b53-d79d-478f-86b9-120f112b044d",
                "Twitch-Eventsub-Message-Retry": 0,
                "Twitch-Eventsub-Message-Type": "notification",
                "Twitch-Eventsub-Message-Signature": `sha256=${signature}`,
                "Twitch-Eventsub-Message-Timestamp": oldTime,
                "Twitch-Eventsub-Subscription-Type": "channel.follow",
                "Twitch-Eventsub-Subscription-Version": 1,
            })
            .send(payload)
            .expect(200)
            .end((err, { text }) => {
                if (err) return done(err);
                expect(text).to.eq("OK");
                expect(notificationRecieved).to.eq(false);
                done();
            });
    });
});
