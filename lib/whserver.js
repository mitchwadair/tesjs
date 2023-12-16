// Copyright (c) 2020-2023 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const express = require("express");
const crypto = require("crypto");
const EventManager = require("./events");
const logger = require("./logger");

const verify = (secret) => (req, res, buf) => {
    logger.debug("Verifying webhook request");
    req.valid_signature = false;
    if (req.headers && req.headers["twitch-eventsub-message-signature"]) {
        logger.debug("Request contains message signature, calculating verification signature");

        const id = req.headers["twitch-eventsub-message-id"];
        const timestamp = req.headers["twitch-eventsub-message-timestamp"];
        const [algo, signature] = req.headers["twitch-eventsub-message-signature"].split("=");

        const calculatedSignature = crypto.createHmac(algo, secret).update(`${id}${timestamp}${buf}`).digest("hex");

        if (crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature))) {
            logger.debug("Request message signature match");
            req.valid_signature = true;
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

module.exports = function (server, secret, config) {
    const whserver = server || express();
    let recentMessageIds = {};

    whserver.post("/teswh/event", express.json({ verify: verify(secret) }), (req, res) => {
        if (!req.valid_signature) {
            return;
        }

        const { challenge, subscription, event } = req.body;
        // handle a webhook verification request
        const messageType = req.headers["twitch-eventsub-message-type"];
        if (challenge && messageType === "webhook_callback_verification") {
            logger.log(`Received challenge for ${subscription.type}, ${subscription.id}. Returning challenge.`);
            res.status(200).type("text/plain").send(encodeURIComponent(challenge)); //ensure plain string response
            EventManager.resolveSubscription(subscription.id);
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
                logger.log(`Received notification for type ${subscription.type}`);
                recentMessageIds[messageId] = true;
                setTimeout(() => {
                    delete recentMessageIds[messageId];
                }, 601000);
                EventManager.fire(subscription, event);
                break;
            case "revocation":
                logger.log(`Received revocation notification for subscription id ${subscription.id}`);
                recentMessageIds[messageId] = true;
                setTimeout(() => {
                    delete recentMessageIds[messageId];
                }, 601000);
                EventManager.fire({ ...subscription, type: "revocation" }, subscription);
                break;
            default:
                logger.log(`Received request with unhandled message type ${messageType}`);
                break;
        }
    });

    return whserver;
};
