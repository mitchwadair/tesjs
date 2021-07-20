// Copyright (c) 2020 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const express = require("express");
const crypto = require("crypto");
const EventManager = require("../../events");
const logger = require("../../logger");

// correct req.body to be a JSON object if the parent app is using a different parsing middleware at the app level
const correctBody = (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
        logger.debug("Convert body from raw");
        req.body = JSON.parse(Buffer.toString(req.body)); //if app is using express.raw(), convert body to JSON
    } else if (typeof req.body === "string") {
        logger.debug("Convert body from string");
        req.body = JSON.parse(decodeURIComponent(req.body)); //if app is using express.urlencoded() or express.text(), convert body to JSON
    }
    next();
};

const verify = (secret) => {
    return (req, res, next) => {
        // thanks to https://github.com/BarryCarlyon/twitch_misc/blob/master/eventsub/handlers/nodejs/receive.js for the example
        // is there a hub to verify against
        logger.debug("Verifying webhook request");
        req.twitch_hub = false;
        if (req.headers && req.headers.hasOwnProperty("twitch-eventsub-message-signature")) {
            logger.debug("Request contains message signature, calculating verification signature");
            req.twitch_hub = true;

            const id = req.headers["twitch-eventsub-message-id"];
            const timestamp = req.headers["twitch-eventsub-message-timestamp"];
            const signature = req.headers["twitch-eventsub-message-signature"].split("=");

            const buf = Buffer.from(JSON.stringify(req.body));
            req.calculated_signature = crypto
                .createHmac(signature[0], secret)
                .update(id + timestamp + buf)
                .digest("hex");
            req.twitch_signature = signature[1];
        }
        next();
    };
};

module.exports = function (server, secret, config) {
    const whserver = server || express();
    let recentMessageIds = {};

    whserver.post("/teswh/event", express.json(), correctBody, verify(secret), (req, res) => {
        // check if our middleware detected a request from Twitch
        if (req.twitch_hub) {
            if (req.twitch_signature == req.calculated_signature) {
                logger.debug("Request message signature match");
                // handle a webhook verification request
                if (
                    req.body.hasOwnProperty("challenge") &&
                    req.headers["twitch-eventsub-message-type"] === "webhook_callback_verification"
                ) {
                    logger.log(
                        `Received challenge for ${req.body.subscription.type}, ${req.body.subscription.id}. Returning challenge.`
                    );
                    res.status(200).type("text/plain").send(encodeURIComponent(req.body.challenge)); //ensure plain string response
                    EventManager.resolveSubscription(req.body.subscription.id);
                    return;
                }

                // if normal event, send OK and handle event
                res.status(200).send("OK");

                // handle dupes and old messages (per config)
                let canFire = true;
                const messageId = req.headers["twitch-eventsub-message-id"];
                if (config.ignoreDuplicateMessages && recentMessageIds[messageId]) {
                    logger.debug(`Received duplicate notification with message id ${messageId}`);
                    canFire = false;
                }
                const messageAge = Date.now() - new Date(req.headers["twitch-eventsub-message-timestamp"]);
                if (config.ignoreOldMessages && messageAge > 600000) {
                    logger.debug(`Received old notification with message id ${messageId}`);
                    canFire = false;
                }

                if (canFire) {
                    // handle different message types
                    switch (req.headers["twitch-eventsub-message-type"]) {
                        case "notification":
                            logger.log(`Received notification for type ${req.body.subscription.type}`);
                            recentMessageIds[messageId] = true;
                            setTimeout((_) => {
                                delete recentMessageIds[messageId];
                            }, 601000);
                            EventManager.fire(req.body.subscription, req.body.event);
                            break;
                        case "revocation":
                            logger.log(
                                `Received revocation notification for subscription id ${req.body.subscription.id}`
                            );
                            recentMessageIds[messageId] = true;
                            setTimeout((_) => {
                                delete recentMessageIds[messageId];
                            }, 601000);
                            EventManager.fire({ ...req.body.subscription, type: "revocation" }, req.body.subscription);
                            break;
                        default:
                            logger.log(
                                `Received request with unhandled message type ${req.headers["twitch-eventsub-message-type"]}`
                            );
                            break;
                    }
                }
            } else {
                logger.debug(
                    `Request message signature ${req.twitch_signature} does not match calculated signature ${req.calculated_signature}`
                );
                res.status(403).send("Request signature mismatch");
            }
        } else {
            logger.debug("Received unauthorized request to webhooks endpoint");
            res.status(401).send("Unauthorized request to EventSub webhook");
        }
    });

    return whserver;
};
