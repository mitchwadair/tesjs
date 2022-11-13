<p align="center">
    <img src="/assets/tesjs_logo_stroke.png?raw=true" height="175px" alt="TESjs logo"/>
</p>
<p align="center">
    <img src="https://github.com/mitchwadair/tesjs/workflows/code%20analysis/badge.svg?branch=main" alt="code analysis"/>
    <img src="https://github.com/mitchwadair/tesjs/workflows/tests/badge.svg?branch=main" alt="tests"/>
    <a href="LICENSE"><img src='https://img.shields.io/apm/l/atomic-design-ui.svg' alt="license"></a>
    <a href="https://www.npmjs.com/package/tesjs"><img src='https://img.shields.io/npm/dt/tesjs' alt="downloads"></a>
</p>

A module to streamline the use of Twitch EventSub in Node.js applications

# WebSockets now Available!
WebSocket transport is now available in TESjs!  You can use TESjs with WebSocket transport in your client and server-side applications.  Keep in mind that the WebSocket transport is currently in [open beta](https://discuss.dev.twitch.tv/t/eventsub-websockets-are-now-available-in-open-beta/41639), so changes could be made that may affect your application negatively until TESjs is able to update.  You can try this out in TESjs `v1.0.0-beta.0` and higher.

# Documentation
Learn how to use TESjs by reading through the [documentation](/doc).  Supplement your development with the Twitch EventSub [documentation](https://dev.twitch.tv/docs/eventsub) as well.

# Install
TESjs is available for install through npm
```sh
npm install tesjs
```
Or in browsers through a CDN
```html
<script src="https://cdn.jsdelivr.net/gh/mitchwadair/tesjs@v1.0.0-beta.0/dist/tes.min.js"></script>
```

# Basic Usage
Keep in mind that in order for your subscriptions to work when using `webhook` transport, the url you are pointing to for the listener **MUST** use `HTTPS` and port `443`.  More information can be found in the Twitch documentation [here](https://dev.twitch.tv/docs/eventsub).  Their suggestion for testing locally is to use a product like [ngrok](https://ngrok.com/) to create an `HTTPS` endpoint to forward your local server (which is hosted on `HTTP`).
```js
const TES = require("tesjs");

// initialize TESjs
const tes = new TES({
    identity: {
        id: YOUR_CLIENT_ID,
        secret: YOUR_CLIENT_SECRET //do not ship this in plaintext!! use environment variables so this does not get exposed
    },
    listener: {
        type: "webhook",
        baseURL: "https://example.com",
        secret: WEBHOOKS_SECRET,
    }
});

// define an event handler for the `channel.update` event
// NOTES: 
//   this handles ALL events of that type
//   events will not be fired until there is a subscription made for them
tes.on("channel.update", (event) => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
});

// create a new subscription for the `channel.update` event for broadcaster "1337"
tes.subscribe("channel.update", { broadcaster_user_id: "1337" })
    .then(() => {
        console.log("Subscription successful");
    }).catch(err => {
        console.log(err);
    });
```

# Browser
TESjs supports WebSocket transport, and can be used in a browser environment
```html
<script src="https://cdn.jsdelivr.net/gh/mitchwadair/tesjs@v1.0.0-beta.0/dist/tes.min.js"></script>
<script>
    const config = {
        identity: {
            id: YOUR_CLIENT_ID,
            accessToken: YOUR_USER_ACCESS_TOKEN,
        },
        listener: { type: "websocket" },
    };
    const tes = new TES(config);

    // define an event handler for the `channel.update` event
    // NOTES: 
    //   this handles ALL events of that type
    //   events will not be fired until there is a subscription made for them
    tes.on("channel.update", (event) => {
        console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
    });

    // create a new subscription for the `channel.update` event for broadcaster "1337"
    tes.subscribe("channel.update", { broadcaster_user_id: "1337" })
        .then(() => {
            console.log("Subscription successful");
        }).catch(err => {
            console.log(err);
        });
</script>
```

# Use an Existing Express Server
TESjs uses Express under the hood to host a webhooks endpoint.  If you already have a server running on Express that you want to use, you can pass it into the configuration object for TESjs.
```js
const TES = require("tesjs");
const express = require("express");

// create our Express server
const app = express();

app.get("/", (req, res) => {
    res.send("OK");
});

app.listen(8080);

// initialize TESjs
const tes = new TES({
    identity: {
        id: YOUR_CLIENT_ID,
        secret: YOUR_CLIENT_SECRET //do not ship this in plaintext!! use environment variables so this does not get exposed
    },
    listener: {
        type: "webhook",
        baseURL: "https://example.com",
        secret: WEBHOOKS_SECRET,
        server: app
    }
});

// define an event handler for the `channel.update` event
// NOTES: 
//   this handles ALL events of that type
//   events will not be fired until there is a subscription made for them
tes.on("channel.update", (event) => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
});

// create a new subscription for the `channel.update` event for broadcaster "1337"
tes.subscribe("channel.update", { broadcaster_user_id: "1337" })
    .then(() => {
        console.log("Subscription successful");
    }).catch(err => {
        console.log(err);
    });
```

# Problems/Suggestions/Questions?
If you have any questions, suggestions, need to report a bug, etc, [submit an issue](https://github.com/mitchwadair/tesjs/issues/new/choose).

# Contribute
Want to contribute to TESjs?  Check out the [contribution guidelines](/CONTRIBUTING.md) to see how.

# Support
Want to help support me in maintaining TESjs? Consider sponsoring me on [GitHub Sponsors](https://github.com/sponsors/mitchwadair).  You can also give a one-time donation through [PayPal](https://paypal.me/mitchwadair).

<p align="center">
    <a href="https://paypal.me/mitchwadair">
        <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" height="75px" alt="PayPal Logo">
    </a>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <a href="https://github.com/sponsors/mitchwadair">
        <img src="https://github.githubassets.com/images/modules/site/sponsors/logo-mona-2.svg" height="75px" alt="GH Sponsors">
    </a>
</p>

# Community
Have you made something with TESjs?  I'd love to hear about it!  You can tweet me [@imMtB_](https://twitter.com/imMtB_) and show off your project.
