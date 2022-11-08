# TESjs Events
In TESjs you listen for events and can provide a handler for each type

## Creating an Event Handler
To create an event handler, it is as simple as calling the `on` function and passing the event type and handler function. The event handler created for each event type is intended to handle ALL events of that type regardless of which subscription the notification came from.
```js
const TES = require("tesjs");

const tes = new TES({
    identity: {
        id: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET
    },
    listener: {
        type: "webhook",
        baseURL: "https://example.com",
        secret: process.env.WEBHOOKS_SECRET,
    }
});

// an example of an event handler for the `channel.update` event
tes.on("channel.update", (event) => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
});
```

## Getting Subscription Data
When an event is fired, TESjs will also include subscription information as an optional second argument to your callback.  This second argument will be the subscription object of the EventSub payload as described in the [Twitch Doc](https://dev.twitch.tv/docs/eventsub#receive-a-notification).
```js
tes.on("channel.update", (event, subscription) => {
  console.log(`Channel Update event for subscription with id ${subscription.id}`);
});
```

## Event Types
Event type names can be found in the Twitch EventSub documentation [here](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types).  Events and their respective parameters can be found in the Twitch EventSub documentation [here](https://dev.twitch.tv/docs/eventsub/eventsub-reference#events).

For example, the `channel.ban` [event](https://dev.twitch.tv/docs/eventsub/eventsub-reference#channel-ban-event) has six parameters `user_id, user_login, user_name, broadcaster_user_id, broadcaster_user_login, broadcaster_user_name`.  The event handler would be created like so:
```js
tes.on("channel.ban", (event) => {
  console.log(`${event.user_name} with id ${event.user_id} and login ${event.user_login} was banned from channel ${event.broadcaster_user_name} with id ${event.broadcaster_user_id} and login ${event.broadcaster_user_login}`)
});
```

## Subscription Revocation
According to the [Twitch documentation](https://dev.twitch.tv/docs/eventsub/handling-webhook-events#revoking-your-subscription), a subscription can be revoked at any time for various reasons.  There may be cases where you want to perform some cleanup based on which subscription got revoked.  You can do this by creating a handler for subscription revocation.  
**NOTE:** As this "event" is fired when a currently subscribed event topic is revoked, no explicit subscription is needed for this event.
```js
tes.on("revocation", (subscriptionData) => {
    console.log(`subscription with id ${subscriptionData.id} has been revoked`);
    // perform necessary cleanup here
});
```

## WebSocket Connection Lost
When working with WebSockets, it is possible that the connection to the Twitch's WebSocket server is lost.  All related subscriptions should be assumed as stale if this happens.  This event will fire if an event or `session_keepalive` message is not received as specified in the [Twitch documentation](https://dev.twitch.tv/docs/eventsub/handling-websocket-events#keepalive-message). When this event is fired, the first argument to the callback function will be an object which is structured with subscription ids as keys and the type and condition as the value.   
**NOTE:** No explicit subscription is needed for this event to be fired
```js
tes.on("connection_lost", (subscriptions) => {
    // if your subscriptions are important, resubscribe to them
    Object.values(subscriptions).forEach((subscription) => {
        tes.subscribe(subscription.type, subscription.condition);
    });
});
```