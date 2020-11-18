# TESjs
A module to streamline the use of Twitch EventSub in Node.js applications

# Disclaimer
The current version of TESjs is likely to be extremely unstable, as it has not had rigorous testing yet.

# Install
TESjs is available for install through npm
```sh
npm install tesjs
```

# Basic Usage
Keep in mind that in order for your subscriptions to work, the url you are pointing to for the listener **MUST** use `HTTPS` and port `443`.  More information can be found in the Twitch documentation [here](https://dev.twitch.tv/docs/eventsub).  Their suggestion for testing locally is to use a product like [ngrok](https://ngrok.com/) to create an `HTTPS` enpoint to forward your local server (which is hosted on `HTTP`).
```js
const TES = require('tesjs');

const tes = new TES({
  identity: {
    id: YOUR_CLIENT_ID,
    secret: YOUR_CLIENT_SECRET
  },
  listener: {
    baseURL: "https://example.com"
  }
});

tes.on('channel.update', (userId, userName, title, language, categoryId, categoryName, isMature) => {
  console.log(`${userName}'s new title is ${title}`);
});

tes.subscribe('channel.update', {
  broadcaster_user_id: 1337
}).then(_ => {
  console.log('Subscription successful');
}).catch(err => {
  console.log(err);
});
```
