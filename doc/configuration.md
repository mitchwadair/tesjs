# Configuration of TESjs
TESjs has a config object that gets passed in when instantiating the instance.  This will go over your configuration options.

## The Config Object
The configuration object is required as an argument when creating the TESjs instance.  It has three sub-objects for different configuration.

`options`: (Optional) Your basic configuration options
- `debug`: *boolean* - (Optional) set to true for more in-depth logging
  - defaults to false
- `logging`: *boolean* - (Optional) set to false for no logging. Takes precendence over debug
  - defaults to true

`identity`: (Required) Set up your client's identity
- `id`: *string* - (Required) your app's client id
- `secret`: *string* - (Required) your app's client secret (make sure this is not in plaintext, use environment variables for this)

`listener`: (Required) Setting your notification listener details
- `baseURL`: *string* - (Required) the url where your endpoint is hosted
  - See [Twitch doc](https://dev.twitch.tv/docs/eventsub) for details on local development
- `secret`: *string* - (Required) the secret to use for your webhooks subscriptions (make sure this is not in plaintext, use environment variables for this)
- `port`: *number* - (Optional) the port to listen at.
  - defaults to process.env.PORT or 8080
  - Keep in mind, this is the port of the Express http server, not your https endpoint (served at `baseURL`) which should have port 443
- `server`: *Express App* - (Optional) your express app object
  - Used if integrating TESjs with an existing Express app
- `ignoreDuplicateMessages`: *boolean* - (Optional) ignore messages with ids that have already been seen
  - defaults to true
- `ignoreOldMessages`: *boolean* - (Optional) ignore messages with timestamps older than 10 minutes
  - defaults to true

## Examples
### Barebones
```js
const TES = require('tesjs');

const config = {
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    baseURL: 'https://example.com',
    secret: process.env.WEBHOOKS_SECRET,
  }
}

const tes = new TES(config);
```
### With Debug and Custom Port
```js
const TES = require('tesjs');

const config = {
  options: { debug: true },
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    baseURL: 'https://example.com',
    secret: process.env.WEBHOOKS_SECRET,
    port: 8081,
  }
}

const tes = new TES(config);
```
### With Existing Express Server
```js
const TES = require('tesjs');
const express = require('express');

// basic express app for example
const app = express();
app.get('/', (req, res) => {
  res.send('OK')
});
app.listen(8080);

const config = {
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    baseURL: 'https://example.com',
    secret: process.env.WEBHOOKS_SECRET,
    server: app,
  }
}

const tes = new TES(config);
```
