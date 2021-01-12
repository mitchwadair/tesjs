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
tes.on('channel.update', event => {
    console.log(`${event.broadcaster_user_name}'s new title is ${event.title}`);
});
```

## Event Types
Event type names can be found in the Twitch EventSub documentation [here](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types).  Events and their respective parameters can be found in the Twitch EventSub documentation [here](https://dev.twitch.tv/docs/eventsub/eventsub-reference#events).

For example, the `channel.ban` [event](https://dev.twitch.tv/docs/eventsub/eventsub-reference#channel-ban-event) has four parameters `user_id, user_login, user_name, broadcaster_user_id, broadcaster_user_login, broadcaster_user_name`.  The event handler would be created like so:
```js
tes.on('channel.ban', event => {
  console.log(`${event.user_name} with id ${event.user_id} and login ${event.user_login} was banned from channel ${event.broadcaster_user_name} with id ${event.broadcaster_user_id} and login ${event.broadcaster_user_login}`)
});
```

## Subscription Revocation
According to the [Twitch Documentation](https://dev.twitch.tv/docs/eventsub#subscription-revocation), a subscription can be revoked at any time for various reasons.  There may be cases where you want to perform some cleanup based on which subscription got revoked.  You can do this by creating a handler for subscription revocation.
**NOTE:** As this 'event' is fired when a currently subscribed event topic is revoked, no explicit subscription is needed for this event.
```js
tes.on('revocation', event => {
    console.log(`subscription with id ${event.id} has been revoked`);
    // perform cleanup here
});
```