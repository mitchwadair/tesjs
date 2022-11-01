// Copyright (c) 2020-2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const express = require("express");
const crypto = require("crypto");
const EventManager = require("./events");
const logger = require("./logger");

// correct req.body to be a JSON object if the parent app is using a different parsing middleware at the app level
const correctBody = (req, _res, next) => {
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
        logger.debug("Verifying webhook request");
        if (req.headers?.hasOwnProperty("twitch-eventsub-message-signature")) {
            logger.debug("Request contains message signature, calculating verification signature");

            const id = req.headers["twitch-eventsub-message-id"];
            const timestamp = req.headers["twitch-eventsub-message-timestamp"];
            const [algo, signature] = req.headers["twitch-eventsub-message-signature"].split("=");

            const buf = Buffer.from(JSON.stringify(req.body));
            const calculatedSignature = crypto
                .createHmac(algo, secret)
                .update(id + timestamp + buf)
                .digest("hex");

            if (calculatedSignature === signature) {
                logger.debug("Request message signature match");
                next();
            } else {
                logger.debug(
                    `Request message signature ${signature} does not match calculated signature ${calculatedSignature}`
                );
                res.status(403).send("Request signature mismatch");
            }
        } else {
            logger.debug("Received unauthorized request to webhooks endpoint");
            res.status(401).send("Unauthorized request to EventSub webhook");
        }
    };
};

module.exports = function (server, secret, config) {
    const whserver = server || express();
    let recentMessageIds = {};

    whserver.post("/teswh/event", express.json(), correctBody, verify(secret), (req, res) => {
        // handle a webhook verification request
        const messageType = req.headers["twitch-eventsub-message-type"];
        if (req.body.hasOwnProperty("challenge") && messageType === "webhook_callback_verification") {
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
        const messageId = req.headers["twitch-eventsub-message-id"];
        if (config.ignoreDuplicateMessages && recentMessageIds[messageId]) {
            logger.debug(`Received duplicate notification with message id ${messageId}`);
            return;
        }
        const messageAge = Date.now() - new Date(req.headers["twitch-eventsub-message-timestamp"]);
        if (config.ignoreOldMessages && messageAge > 600000) {
            logger.debug(`Received old notification with message id ${messageId}`);
            return;
        }

        // handle different message types
        switch (messageType) {
            case "notification":
                logger.log(`Received notification for type ${req.body.subscription.type}`);
                recentMessageIds[messageId] = true;
                setTimeout(() => {
                    delete recentMessageIds[messageId];
                }, 601000);
                EventManager.fire(req.body.subscription, req.body.event);
                break;
            case "revocation":
                logger.log(`Received revocation notification for subscription id ${req.body.subscription.id}`);
                recentMessageIds[messageId] = true;
                setTimeout(() => {
                    delete recentMessageIds[messageId];
                }, 601000);
                EventManager.fire({ ...req.body.subscription, type: "revocation" }, req.body.subscription);
                break;
            default:
                logger.log(`Received request with unhandled message type ${messageType}`);
                break;
        }
    });

    return whserver;
};
