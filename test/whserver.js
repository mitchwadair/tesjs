const TES = require('../main');
const request = require('supertest');
const should = require('chai').should();
const crypto = require('crypto');

// example data taken from https://dev.twitch.tv/docs/eventsub examples

const secret = 's3cRe7';
const timestamp = new Date().toISOString();
const tes = new TES({
    identity: {
        id: 'test',
        secret: secret
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

    it('responds with 403 to request with signature mismatch', done => {
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'e76c6bd4-55c9-4987-8304-da1588d8988b',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'webhook_callback_verification',
                'Twitch-Eventsub-Message-Signature': 'sha256=thisiswrong',
                'Twitch-Eventsub-Message-Timestamp': timestamp,
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send({})
            .expect(403, done);
    });

    it('responds with challenge when challenged', done => {
        const payload = {
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
        }
        const signature = crypto.createHmac('sha256', secret)
            .update('e76c6bd4-55c9-4987-8304-da1588d8988b' + timestamp + Buffer.from(JSON.stringify(payload), 'utf-8'))
            .digest('hex');
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'e76c6bd4-55c9-4987-8304-da1588d8988b',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'webhook_callback_verification',
                'Twitch-Eventsub-Message-Signature': `sha256=${signature}`,
                'Twitch-Eventsub-Message-Timestamp': timestamp,
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send(payload)
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
        const payload = {
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
        }
        const signature = crypto.createHmac('sha256', secret)
            .update('befa7b53-d79d-478f-86b9-120f112b044e' + timestamp + Buffer.from(JSON.stringify(payload), 'utf-8'))
            .digest('hex');
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'befa7b53-d79d-478f-86b9-120f112b044e',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'notification',
                'Twitch-Eventsub-Message-Signature': `sha256=${signature}`,
                'Twitch-Eventsub-Message-Timestamp': timestamp,
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send(payload)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                res.text.should.eq('OK');
                notificationRecieved.should.eq(true);
                done();
            });
    });

    it('responds with 200 OK when receiving a revocation and the revocation event should be fired', done => {
        let notificationRecieved = false;
        tes.on('revocation', _ => {
            notificationRecieved = true;
        });
        const payload = {
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
        }
        const signature = crypto.createHmac('sha256', secret)
            .update('84c1e79a-2a4b-4c13-ba0b-4312293e9308' + timestamp + Buffer.from(JSON.stringify(payload), 'utf-8'))
            .digest('hex');
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': '84c1e79a-2a4b-4c13-ba0b-4312293e9308',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'revocation',
                'Twitch-Eventsub-Message-Signature': `sha256=${signature}`,
                'Twitch-Eventsub-Message-Timestamp': timestamp,
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send(payload)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                res.text.should.eq('OK');
                notificationRecieved.should.eq(true);
                done();
            });
    });

    it('responds with 200 OK when receiving a duplicate notification and the event should not be fired', done => {
        let notificationRecieved = false;
        tes.on('channel.follow', _ => {
            notificationRecieved = true;
        });
        const payload = {
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
        }
        const signature = crypto.createHmac('sha256', secret)
            .update('befa7b53-d79d-478f-86b9-120f112b044e' + timestamp + Buffer.from(JSON.stringify(payload), 'utf-8'))
            .digest('hex');
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'befa7b53-d79d-478f-86b9-120f112b044e',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'notification',
                'Twitch-Eventsub-Message-Signature': `sha256=${signature}`,
                'Twitch-Eventsub-Message-Timestamp': timestamp,
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send(payload)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                res.text.should.eq('OK');
                notificationRecieved.should.eq(false);
                done();
            });
    });

    it('responds with 200 OK when receiving an old notification and the event should not be fired', done => {
        let notificationRecieved = false;
        tes.on('channel.follow', _ => {
            notificationRecieved = true;
        });
        const payload = {
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
        }
        const oldTime = new Date(Date.now() - 601000).toISOString()
        const signature = crypto.createHmac('sha256', secret)
            .update('befa7b53-d79d-478f-86b9-120f112b044d' + oldTime + Buffer.from(JSON.stringify(payload), 'utf-8'))
            .digest('hex');
        request(app)
            .post('/teswh/event')
            .set({
                'Twitch-Eventsub-Message-Id': 'befa7b53-d79d-478f-86b9-120f112b044d',
                'Twitch-Eventsub-Message-Retry': 0,
                'Twitch-Eventsub-Message-Type': 'notification',
                'Twitch-Eventsub-Message-Signature': `sha256=${signature}`,
                'Twitch-Eventsub-Message-Timestamp': oldTime,
                'Twitch-Eventsub-Subscription-Type': 'channel.follow',
                'Twitch-Eventsub-Subscription-Version': 1
            })
            .send(payload)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                res.text.should.eq('OK');
                notificationRecieved.should.eq(false);
                done();
            });
    });
});