# TESjs Express Integration
In TESjs you can integrate with an existing Express app.  Here you can learn about some of the gotchas you may run into as part of these integrations.

## Contents
- [The Basics](#the-basics)
- [Middleware Conflicts](#middleware-conflicts)
  - [Middlewares Known to Cause Conflict](#middlewares-known-to-cause-conflict)

## The Basics
At its most basic, TESjs has seamless integration with existing Express apps.  All you need is the app object to pass into TESjs.
```js
const express = require('express');
const TES = require('tesjs');

// Creating the most basic Express app
const app = express();
app.get('/', (req, res) => {
  res.send('OK')
});
app.listen(8080);

// TESjs configuration passing the Express app as the listener's server
const config = {
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    baseURL: 'https://example.com',
    server: app,
  }
}

// Initialize TESjs with the config object
const tes = new TES(config);
```

## Middleware Conflicts
In some cases, especially in more complex Express apps, you may be using some middlewares that conflict with TESjs.  This will happen if you are using a middleware through the `app.use` method, but not if you are using the middleware on individual routes.  To mitigate this problem, TESjs includes a middleware that you can use to ignore TESjs in other middlewares.  This middleware is called `ignoreInMiddleware` and is included in the TES object.  Modifying your Express app to use this would make your app look like this:
```js
const express = require('express');
const myMiddleware = require('my-middleware'); //a fake middleware for example
const TES = require('tesjs');

// Create an Express app which uses the express.json() middleware
const app = express()
app.use(TES.ignoreInMiddleware(myMiddleware)); //pass the middleware you want to ignore TESjs to the TES.ignoreInMiddleware middleware
app.get('/', (req, res) => {
    res.send('OK');
});
app.listen(8080);

// TESjs configuration passing the Express app as the listener's server
const config = {
  identity: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  listener: {
    baseURL: 'https://example.com',
    server: app,
  }
}

// Initialize TESjs with the config object
const tes = new TES(config);
```
With this change made, your Express app will still function normally and not cause any conflict with TESjs.

### Middlewares Known to Cause Conflict
If you use any of these middlewares in your Express app, you will have to use `ignoreInMiddleware` to eliminate conflicts.  
*If you find a middleware that is not on this list, feel free to put a PR in to keep the list up to date!*  
- No known middlewares cause conflict at this time