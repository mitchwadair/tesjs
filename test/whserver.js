const TES = require('../main');
const request = require('supertest');
const should = require('chai').should();

// example data taken from https://dev.twitch.tv/docs/eventsub examples

const tes = new TES({
    identity: {
        id: 'test',
        secret: 's3cRe7'
    },
    listener: {
        baseURL: 'localhost'
    }
});
const app = tes.whserver;

describe('whserver', _ => {
    it('responds with 401 to request without twitch message signature', done => {
        request(app)
            .post('/teswh/event')
            .send({})
            .expect(401, done);
    });

    it('responds with 401 to request with signature mismatch', done => {
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'e76c6bd4-55c9-4987-8304-da1588d8988b',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'webhook_callback_verification',
                'Twitch-Eventsub-Message-Signature': 'sha256=thisiswrong',
                'Twitch-Eventsub-Message-Timestamp': '2019-11-16T10:11:12.123Z',
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send({})
            .expect(401, done);
    });

    it('responds with challenge when challenged', done => {
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'e76c6bd4-55c9-4987-8304-da1588d8988b',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'webhook_callback_verification',
                'Twitch-Eventsub-Message-Signature': 'sha256=7e5a96480c29cdf834b371e7a5b049638cba6e425ea51b9b2a9fabf69bc5d227',
                'Twitch-Eventsub-Message-Timestamp': '2019-11-16T10:11:12.123Z',
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send({
                "challenge": "pogchamp-kappa-360noscope-vohiyo",
                "subscription": {
                    "id": "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
                    "status": "webhook_callback_verification_pending",
                    "type": "channel.follow",
                    "version": "1",
                    "condition": {
                            "broadcaster_user_id": "12826"
                    },
                    "transport": {
                        "method": "webhook",
                        "callback": "https://example.com/webhooks/callback"
                    },
                    "created_at": "2019-11-16T10:11:12.123Z"
                }
            })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                res.text.should.eq('pogchamp-kappa-360noscope-vohiyo');
                done();
            });
    });

    it('responds with 200 OK when receiving a notification and the event should be fired', done => {
        let notificationRecieved = false;
        tes.on('channel.follow', _ => {
            notificationRecieved = true;
        });
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'e76c6bd4-55c9-4987-8304-da1588d8988b',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'notification',
                'Twitch-Eventsub-Message-Signature': 'sha256=767c6b49387b83b45d10f9954692ad12ddf1fbe388c1752c90bc2e6d278268f3',
                'Twitch-Eventsub-Message-Timestamp': '2019-11-16T10:11:12.123Z',
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send({
                "subscription": {
                    "id": "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
                    "type": "channel.follow",
                    "version": "1",
                    "condition": {
                        "broadcaster_user_id": "12826"
                    },
                    "transport": {
                        "method": "webhook",
                        "callback": "https://example.com/webhooks/callback"
                    },
                    "created_at": "2019-11-16T10:11:12.123Z"
                },
                "event": {
                    "user_id":   "1337",
                    "user_name": "awesome_user",
                    "broadcaster_user_id":     "12826",
                    "broadcaster_user_name":   "twitch"
                }
            })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                res.text.should.eq('OK');
                notificationRecieved.should.eq(true);
                done();
            });
    });

    it('responds with 200 OK when receiving a revocation and the event should not be fired', done => {
        let notificationRecieved = false;
        tes.on('channel.follow', _ => {
            notificationRecieved = true;
        });
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'e76c6bd4-55c9-4987-8304-da1588d8988b',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'revocation',
                'Twitch-Eventsub-Message-Signature': 'sha256=dcd3e15439de1e44b280f8d4c1d66bec57e0cbfc50f6ddf4587a4585675e0604',
                'Twitch-Eventsub-Message-Timestamp': '2019-11-16T10:11:12.123Z',
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send({
                "subscription": {
                    "id": "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
                    "status": "authorization-revoked",
                    "type": "channel.follow",
                    "version": "1",
                    "condition": {
                        "broadcaster_user_id": "12826"
                    },
                    "transport": {
                        "method": "webhook",
                        "callback": "https://example.com/webhooks/callback"
                    },
                    "created_at": "2019-11-16T10:11:12.123Z"
                },
                "limit": 10000,
                "total": 1,
                "pagination": {}
            })
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                res.text.should.eq('OK');
                notificationRecieved.should.eq(false);
                done();
            });
    });
});