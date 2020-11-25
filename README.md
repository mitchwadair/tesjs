<p align="center">
    <img src="/assets/tesjs_logo_stroke.png?raw=true" alt="code analysis"/>
</p>
<p align="center">
    <img src="https://github.com/mitchwadair/tesjs/workflows/code%20analysis/badge.svg?branch=main" alt="code analysis"/>
    <img src="https://github.com/mitchwadair/tesjs/workflows/tests/badge.svg?branch=main" alt="tests"/>
    <a href="LICENSE"><img src='https://img.shields.io/apm/l/atomic-design-ui.svg' alt="license"></a>
    <a href="https://www.npmjs.com/package/tesjs"><img src='https://img.shields.io/npm/dt/tesjs' alt="downloads"></a>
</p>

A module to streamline the use of Twitch EventSub in Node.js applications

# Documentation
Learn how to use TESjs by reading through the [documentation](/doc).  Supplement your development with the Twitch EventSub [documentation](https://dev.twitch.tv/docs/eventsub) as well.

# Install
TESjs is available for install through npm
```sh
npm install tesjs
```

# Basic Usage
Keep in mind that in order for your subscriptions to work, the url you are pointing to for the listener **MUST** use `HTTPS` and port `443`.  More information can be found in the Twitch documentation [here](https://dev.twitch.tv/docs/eventsub).  Their suggestion for testing locally is to use a product like [ngrok](https://ngrok.com/) to create an `HTTPS` endpoint to forward your local server (which is hosted on `HTTP`).
```js
const TES = require('tesjs');

// initialize TESjs
const tes = new TES({
    identity: {
        id: YOUR_CLIENT_ID,
        secret: YOUR_CLIENT_SECRET //do not ship this in plaintext!! use environment variables so this does not get exposed
    },
    listener: {
        baseURL: "https://example.com"
    }
});

// define an event handler for the 'channel.update' event
// NOTES: 
//   this handles ALL events of that type
//   events will not be fired until there is a subscription made for them
tes.on('channel.update', (userId, userName, title, language, categoryId, categoryName, isMature) => {
    console.log(`${userName}'s new title is ${title}`);
});

// create a new subscription for the 'channel.update' event for broadcaster '1337'
tes.subscribe('channel.update', {
    broadcaster_user_id: 1337
}).then(_ => {
    console.log('Subscription successful');
}).catch(err => {
    console.log(err);
});
```

# Use an Existing Express Server
TESjs uses Express under the hood to host a webhooks endpoint.  If you already have a server running on Express that you want to use, you can pass it into the configuration object for TESjs.
```js
const TES = require('tesjs');
const express = require('express');

// create our Express server
const app = express();

app.get('/', (req, res) => {
    res.send('OK');
});

app.listen(8080);

// initialize TESjs
const tes = new TES({
    identity: {
        id: YOUR_CLIENT_ID,
        secret: YOUR_CLIENT_SECRET //do not ship this in plaintext!! use environment variables so this does not get exposed
    },
    listener: {
        baseURL: "https://example.com",
        server: app
    }
});

// define an event handler for the 'channel.update' event
// NOTES: 
//   this handles ALL events of that type
//   events will not be fired until there is a subscription made for them
tes.on('channel.update', (userId, userName, title, language, categoryId, categoryName, isMature) => {
    console.log(`${userName}'s new title is ${title}`);
});

// create a new subscription for the 'channel.update' event for broadcaster '1337'
tes.subscribe('channel.update', {
    broadcaster_user_id: 1337
}).then(_ => {
    console.log('Subscription successful');
}).catch(err => {
    console.log(err);
});
```

# Problems/Suggestions/Questions?
If you have any questions, suggestions, need to report a bug, etc, [submit an issue](https://github.com/mitchwadair/tesjs/issues/new/choose).

# Contribute
Want to contribute to TESjs?  Check out the [contribution guidelines](/CONTRIBUTE.md) to see how.
