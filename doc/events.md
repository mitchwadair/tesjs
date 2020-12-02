# TESjs Events
In TESjs you listen for events and can provide a handler for each type

## Creating an Event Handler
To create an event handler, it is as simple as calling the `on` function and passing the event type and handler function. The event handler created for each event type is intended to handle ALL events of that type regardless of which subscription the notification came from.
```js
const TES = require('tesjs');

const tes = new TES({
    identity: {
        id: CLIENT_ID,
        secret: CLIENT_SECRET
    },
    listener: {
        baseURL: "https://example.com"
    }
});

// an example of an event handler for the 'channel.update' event
tes.on('channel.update', (userId, userName, title, language, categoryId, categoryName, isMature) => {
    console.log(`${userName}'s new title is ${title}`);
});
```

## Event Types
Event type names can be found in the Twitch EventSub documentation [here](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types).  Events and their respective parameters can be found in the Twitch EventSub documentation [here](https://dev.twitch.tv/docs/eventsub/eventsub-reference#events).  When creating a handler for any event, the order of arguments to the handler function is reflected in the order they are listed in the documentation.

For example, the `channel.ban` [event](https://dev.twitch.tv/docs/eventsub/eventsub-reference#channel-ban-event) has four parameters `user_id, user_name, broadcaster_user_id, broadcaster_user_name`.  The event handler would be created like so:
```js
tes.on('channel.ban', (userId, userName, broadcasterId, broadcasterName) => {
  // do your things here
});
```

## Subscription Revocation
According to the [Twitch Documentation](https://dev.twitch.tv/docs/eventsub#subscription-revocation), a subscription can be revoked at any time for various reasons.  There may be cases where you want to perform some cleanup based on which subscription got revoked.  You can do this by creating a handler for subscription revocation.
```js
tes.on('revocation', (subscriptionId, status, type, version, condition, transport, createdAt) => {
    console.log(`subscription with ${subscriptionId} has been revoked`);
});
```