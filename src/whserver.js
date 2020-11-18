// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const EventManager = require('./events');

const verify = (secret, req, res, buf, encoding) => {
    // thanks to https://github.com/BarryCarlyon/twitch_misc/blob/master/eventsub/handlers/nodejs/receive.js for the example
    // is there a hub to verify against
    req.twitch_hub = false;
    if (req.headers && req.headers.hasOwnProperty('twitch-eventsub-message-signature')) {
        req.twitch_hub = true;
        
        const id = req.headers['twitch-eventsub-message-id'];
        const timestamp = req.headers['twitch-eventsub-message-timestamp'];
        const signature = req.headers['twitch-eventsub-message-signature'].split('=');

        req.calculated_signature = crypto.createHmac(signature[0], secret)
            .update(id + timestamp + buf)
            .digest('hex');
        req.twitch_signature = signature[1];
    }
}

module.exports = function(port, server, secret) {
    const whserver = server || express();

    whserver.post('/teswh/event', bodyParser.json({verify: (req, res, buf, encoding) => {verify(secret, req, res, buf, encoding)}}), (req, res) => {
        // check if our middleware detected a request from Twitch
        if (req.twitch_hub) {
            if (req.twitch_signature == req.calculated_signature) {
                console.log('Request signature match');
                // handle a webhook verification request
                if (req.body.hasOwnProperty('challenge') && req.headers['twitch-eventsub-message-type'] === 'webhook_callback_verification') {
                    console.log('Got subscription verification challenge, returning challenge');
                    res.status(200).type('text/plain').send(req.body.challenge); //ensure plain string response
                    return;
                }

                // if normal event, send OK and handle event
                res.status(200).send('OK');

                // if the request is not revoking the subscription, fire the event
                if (req.body.subscription.status !== 'authorization-revoked') {
                    EventManager.fire(req.body.subscription.type, req.body.event);
                }
            } else {
                console.log('Request signature mismatch');
                res.status(401).send('Request signature mismatch');
            }
        } else {
            console.log('Ivalid webhook request');
            res.status(401).send('Unauthorized request to EventSub webhook');
        }
    });

    if (!server)
        whserver.listen(port);

    return whserver;
}