# Configuration of TESjs

TESjs has a config object that gets passed in when instantiating the instance. This will go over your configuration options.

## The Config Object

The configuration object is required as an argument when creating the TESjs instance. It has three sub-objects for different configuration.

`options`: (Optional) your basic configuration options
- `debug`: _boolean_ - (Optional) set to true for more in-depth logging
  - defaults to false
- `logging`: _boolean_ - (Optional) set to false for no logging
  - takes precendence over debug
  - defaults to true

`identity`: (Required) set up your client's identity
- `id`: _string_ - (Required) your app's client id
- `secret`: _string_ - (Optional) your app's client secret (make sure this is not in plaintext, use environment variables for this)
  - required for `webhook` transport
  - required if not using `onAuthenticationFailure` for `websocket` transport in server-side applications
- `onAuthenticationFailure`: _function_ - (Optional) if you already have an authentication solution for your app elsewhere use this to avoid token conflicts
  - this function should return a Promise that resolves an access token
- `accessToken`: _string_ - (Optional) if you already have an access token at the time of initing TESjs, you can pass it here
  - must be a user access token for `websocket` transport
  - must be an app access token for `webhook` transport
  - this should usually be paired with `onAuthenticationFailure` on server-side applications
- `refreshToken`: _string_ - (Optional) the refresh token to use if using `websocket` transport server-side
  - required if not using `onAuthenticationFailure` for `websocket` transport in server-side applications

`listener`: (Required) setting your notification listener details
- `type`: _string_ - (Required) the type of transport to use
  - can be either `webhook` or `websocket`
- `baseURL`: _string_ - (Optional) the url where your endpoint is hosted
  - See [Twitch doc](https://dev.twitch.tv/docs/eventsub) for details on local development
  - required for `webhook` transport
- `secret`: _string_ - (Optional) the secret to use for your webhooks subscriptions (make sure this is not in plaintext, use environment variables for this)
  - required for `webhook` transport
  - this should be different from your client secret
- `port`: _number_ - (Optional) the port to listen at.
  - defaults to process.env.PORT or 8080
  - keep in mind, this is the port of the Express http server, not your https endpoint (served at `baseURL`) which should have port 443
- `server`: _Express App_ - (Optional) your express app object
  - used if integrating TESjs with an existing Express app
- `ignoreDuplicateMessages`: _boolean_ - (Optional) ignore messages with ids that have already been seen
  - defaults to true
  - only used for `webhook` transport
- `ignoreOldMessages`: _boolean_ - (Optional) ignore messages with timestamps older than 10 minutes
  - defaults to true
  - only used for `webhook` transport

## Examples

### Simple Webhooks Transport

```js
const TES = require("tesjs");

const config = {
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    type: "webhook",
    baseURL: "https://example.com",
    secret: process.env.WEBHOOKS_SECRET,
  },
};

const tes = new TES(config);
```

### Simple WebSockets Transport

```js
// this script tag will be necessary if using TESjs in a browser:
// <script src="https://cdn.jsdelivr.net/gh/mitchwadair/tesjs@<version-number>/dist/tes.min.js"></script>
// otherwise, import as usual
const TES = require("tesjs");

const config = {
  identity: {
    id: "YOUR_CLIENT_ID",
    accessToken: "YOUR_USER_ACCESS_TOKEN",
  },
  listener: {
    type: "websocket",
  },
};

const tes = new TES(config);
```

### With Debug and Custom Port

```js
const TES = require("tesjs");

const config = {
  options: { debug: true },
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    type: "webhook",
    baseURL: "https://example.com",
    secret: process.env.WEBHOOKS_SECRET,
    port: 8081,
  },
};

const tes = new TES(config);
```

### With Existing Express Server

```js
const TES = require("tesjs");
const express = require("express");

// basic express app for example
const app = express();
app.get("/", (req, res) => {
    res.send("OK");
});
app.listen(8080);

const config = {
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    type: "webhook",
    baseURL: "https://example.com",
    secret: process.env.WEBHOOKS_SECRET,
    server: app,
  },
};

const tes = new TES(config);
```
