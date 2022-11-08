# TESjs Functions
The functions included with TESjs

## Contents
- [getSubscription](#getsubscription) - Get a specific subscription's data by subscription id
  - By id
  - By type and condition
- [getSubscriptions](#getsubscriptions) - Get a list of subscriptions
  - With pagination
- [getSubscriptionsByType](#getsubscriptionsbytype) - Get a list of subscriptions by type
  - With pagination
- [getSubscriptionsByStatus](#getsubscriptionsbystatus) - Get a list of subscriptions by status
  - With pagination
- [subscribe](#subscribe) - Subscribe to a topic
- [unsubscribe](#unsubscribe) - Unsubscribe to a topic
  - By id
  - By type and condition
  
All examples assume a TESjs instance created
```js
const TES = require("tesjs");

const tes = new TES({
    identity: {
        id: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET
    },
    listener: {
        baseURL: "https://example.com",
        secret: process.env.WEBHOOKS_SECRET,
    }
});
```

## getSubscription
Get a specific subscription's data.  This is done in two possible ways.
### By id
```js
tes.getSubscription("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef").then((data) => {
  console.log(data);
});
```
### By type and condition
```js
const getCondition = { broadcaster_user_id: "1337" };
tes.getSubscription("channel.update", getCondition).then((data) => {
  console.log(data);
});
```

## getSubscriptions
Get a list of your subscriptions.  When calling this with no arguments, it will give you the first page of results.
```js
tes.getSubscriptions().then((data) => {
  console.log(data);
});
```
### With pagination
Use the optional cursor argument to get a specific page of results
```js
let subsArray = []
//define a recursive function to get ALL subscriptions
const getAll = (callback, cursor) => {
  tes.getSubscriptions(cursor).then((data) => {
    subsArray = subsArray.concat(data.data);
    if (data.pagination.cursor)
      getAll(callback, data.pagination.cursor);
    else
      callback();
  });
}
//call our function and pass an arrow func that will print our results
getAll(() => console.log(subsArray));
```

## getSubscriptionsByType
Get a list of your subscriptions of a specific type.  When calling this with no second argument, it will give you the first page of results.
```js
tes.getSubscriptionsByType("channel.update").then((data) => {
  console.log(data);
});
```
### With pagination
Use the optional cursor argument to get a specific page of results
```js
let subsArray = []
//define a recursive function to get ALL subscriptions
const getAll = (callback, cursor) => {
  tes.getSubscriptionsByType("channel.update", cursor).then((data) => {
    subsArray = subsArray.concat(data.data);
    if (data.pagination.cursor)
      getAll(callback, data.pagination.cursor);
    else
      callback();
  });
}
//call our function and pass an arrow func that will print our results
getAll(() => console.log(subsArray));
```

## getSubscriptionsByStatus
Get a list of your subscriptions with a certain status.  When calling this with no second argument, it will give you the first page of results.
```js
tes.getSubscriptionsByStatus("enabled").then((data) => {
  console.log(data);
});
```
### With pagination
Use the optional cursor argument to get a specific page of results
```js
let subsArray = []
//define a recursive function to get ALL subscriptions
const getAll = (callback, cursor) => {
  tes.getSubscriptionsByStatus("enabled", cursor).then((data) => {
    subsArray = subsArray.concat(data.data);
    if (data.pagination.cursor)
      getAll(callback, data.pagination.cursor);
    else
      callback();
  });
}
//call our function and pass an arrow func that will print our results
getAll(() => console.log(subsArray));
```

## subscribe
Subscribe to an EventSub topic
```js
const condition = { broadcaster_user_id: "1337" };
tes.subscribe("channel.update", condition);
```
Optionally, you can do something once the subscription has been made, and catch any errors.  The subscription promise will resolve after the handshake with Twitch is complete.  If the handshake times out for whatever reason, the promise will reject with the subscriptionID for any needed cleanup.
```js
const condition = { broadcaster_user_id: "1337" };
tes.subscribe("channel.update", condition)
  .then(() => {
    console.log("subscription has been created");
  })
  .catch((err) => {
    if (err.subscriptionID) {
      // perform any cleanup needed
      /* 
        if the subscriptionID is present, the subscription was made but an error occurred when verifying it
        this means that you will need to unsubscribe from that subscription to clean it up.
      */
      tes.unsubscribe(err.subscriptionID);
    }
    // if err.subscriptionID is not present, an error occurred with the request to Twitch
    console.log(err);
  });
```
## unsubscribe
Unsubscribe from a topic.  This can be done by id or by type and condition (a bit slower)
### By id
```js
tes.unsubscribe("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef")
```
Like subscribe, things can be done once unsubscribed
```js
tes.unsubscribe("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef")
  .then(() => {
    console.log("topic unsubscribed");
  })
  .catch((err) => {
    console.log(err);
  });
```
### By type and condition
This method is slightly slower because type and condition are used to find the correct id
```js
const condition = { broadcaster_user_id: "1337" };
tes.unsubscribe("channel.update", condition);
```
Like subscribe, things can be done once unsubscribed
```js
const condition = { broadcaster_user_id: "1337" };
tes.unsubscribe("channel.update", condition)
  .then(() => {
    console.log("topic unsubscribed");
  })
  .catch((err) => {
    console.log(err);
  });
```
