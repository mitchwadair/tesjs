# TESjs Express Integration
In TESjs you can integrate with an existing Express app.  Here you can learn about some of the gotchas you may run into as part of these integrations.

At its most basic, TESjs has seamless integration with existing Express apps.  All you need is the app object to pass into TESjs.
```js
const express = require("express");
const TES = require("tesjs");

// Creating the most basic Express app
const app = express();
app.get("/", (req, res) => {
  res.send("OK")
});
app.listen(8080);

// TESjs configuration passing the Express app as the listener's server
const config = {
  identity: {
    id: YOUR_CLIENT_ID,
    secret: YOUR_CLIENT_SECRET,
  },
  listener: {
    type: "webhook",
    baseURL: "https://example.com",
    secret: YOUR_WEBHOOKS_SECRET,
    server: app,
  }
}

// Initialize TESjs with the config object
const tes = new TES(config);
```
