<a name="TES"></a>

## TES
**Kind**: global class  
**License**: Copyright (c) 2020-2023 Mitchell Adair

This software is released under the MIT License.
https://opensource.org/licenses/MIT  

* [TES](#TES)
    * [new TES(config)](#new_TES_new)
    * _instance_
        * [.getSubscriptions([cursor])](#TES+getSubscriptions) ⇒ <code>Promise</code>
        * [.getSubscriptionsByType(type, [cursor])](#TES+getSubscriptionsByType) ⇒ <code>Promise</code>
        * [.getSubscriptionsByStatus(status, [cursor])](#TES+getSubscriptionsByStatus) ⇒ <code>Promise</code>
        * [.getSubscription(idOrType, [condition])](#TES+getSubscription) ⇒ <code>Promise</code>
        * [.subscribe(type, condition, [version])](#TES+subscribe) ⇒ <code>Promise</code>
        * [.unsubscribe(idOrType, [condition])](#TES+unsubscribe) ⇒ <code>Promise</code>
        * [.on(type, callback)](#TES+on) ⇒ <code>void</code>
    * _inner_
        * [~Config](#TES..Config) : <code>Object</code>
            * [~Options](#TES..Config..Options) : <code>Object</code>
            * [~Identity](#TES..Config..Identity) : <code>Object</code>
                * [~onAuthenticationFailure](#TES..Config..Identity..onAuthenticationFailure) ⇒ <code>Promise</code>
            * [~Listener](#TES..Config..Listener) : <code>Object</code>
        * [~onEventCallback](#TES..onEventCallback) ⇒ <code>void</code>


* * *

<a name="new_TES_new"></a>

### new TES(config)
**Returns**: [<code>TES</code>](#TES) - The TESjs instance  

| Param | Type | Description |
| --- | --- | --- |
| config | [<code>Config</code>](#TES..Config) | The TES configuration |

**Example**  
Minimum `websocket` config
```js
const config = {
    identity: {
        id: YOUR_CLIENT_ID,
        accessToken: YOUR_USER_ACCESS_TOKEN,
    }
    listener: { type: "websocket" },
};
const tes = new TES(config);
```
**Example**  
Minimum `webhook` config
```js
const config = {
    identity: {
        id: YOUR_CLIENT_ID,
        secret: YOUR_CLIENT_SECRET,
    },
    listener: {
        type: "webhook",
        baseURL: "https://example.com",
        secret: YOUR_WEBHOOKS_SECRET,
    },
};
const tes = new TES(config);
```

* * *

<a name="TES+getSubscriptions"></a>

### tes.getSubscriptions([cursor]) ⇒ <code>Promise</code>
Get a list of your event subscriptions

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - Subscription data. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details  

| Param | Type | Description |
| --- | --- | --- |
| [cursor] | <code>string</code> | The pagination cursor |

**Example**  
```js
const subs = await tes.getSubscriptions();
console.log(`I have ${subs.total} event subscriptions`);
```

* * *

<a name="TES+getSubscriptionsByType"></a>

### tes.getSubscriptionsByType(type, [cursor]) ⇒ <code>Promise</code>
Get a list of your event subscriptions by type

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - Subscription data. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | The type of subscription. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details |
| [cursor] | <code>string</code> | The pagination cursor |

**Example**  
```js
const subs = await tes.getSubscriptionsByType("channel.update");
console.log(`I have ${subs.total} "channel.update" event subscriptions`);
```

* * *

<a name="TES+getSubscriptionsByStatus"></a>

### tes.getSubscriptionsByStatus(status, [cursor]) ⇒ <code>Promise</code>
Get a list of your event subscriptions by status

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - Subscription data. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | The subscription status. See [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details |
| [cursor] | <code>string</code> | The pagination cursor |

**Example**  
```js
const subs = await tes.getSubscriptionsByStatus("enabled");
console.log(`I have ${subs.total} "enabled" event subscriptions`);
```

* * *

<a name="TES+getSubscription"></a>

### tes.getSubscription(idOrType, [condition]) ⇒ <code>Promise</code>
Get subscription data for an individual subscription. Search either by id or by type and condition

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - The subscription data  
**Signature**: `getSubscription(id)`  
**Signature**: `getSubscription(type, condition)`  

| Param | Type | Description |
| --- | --- | --- |
| idOrType | <code>string</code> | The subscription id or [type](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) |
| [condition] | <code>Object</code> | The subscription condition, required when finding by type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#conditions) for details |

**Example**  
Find a subscription by id
```js
const sub = await tes.getSubscription("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef");
console.log(`The status for subscription ${sub.id} is ${sub.status}`);
```
**Example**  
Find a subscription by type and condition
```js
const condition = { broadcaster_user_id: "1337" };
const sub = await tes.getSubscription("channel.update", condition);
console.log(`The status for subscription ${sub.id} is ${sub.status}`);
```

* * *

<a name="TES+subscribe"></a>

### tes.subscribe(type, condition, [version]) ⇒ <code>Promise</code>
Subscribe to an event

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - A Promise that resolves when subscribing is complete with the subscription data  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | <code>string</code> |  | The subscription type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details |
| condition | <code>Object</code> |  | The subscription condition. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#conditions) for details |
| [version] | <code>string</code> | <code>&quot;1&quot;</code> | The subscription version. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details |

**Example**  
```js
const condition = { broadcaster_user_id: "1337" };
const sub = tes.subscribe("channel.update", condition);
console.log(`Created subscription to ${sub.type}, subscription id ${sub.id}`);
```

* * *

<a name="TES+unsubscribe"></a>

### tes.unsubscribe(idOrType, [condition]) ⇒ <code>Promise</code>
Unsubscribe from an event. Unsubscribe either by id, or by type and condition

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - Resolves when unsubscribed  
**Signature**: `unsubscribe(id)`  
**Signature**: `unsubscribe(type, condition)`  

| Param | Type | Description |
| --- | --- | --- |
| idOrType | <code>string</code> | The subscription id or [type](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) |
| [condition] | <code>Object</code> | The subscription condition, required when finding by type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#conditions) for details |

**Example**  
Unsubscribe by id
```js
await tes.unsubscribe("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef");
console.log("Successfully unsubscribed");
```
**Example**  
Unsubscribe by type and condition
```js
const condition = { broadcaster_user_id: "1337" };
await tes.unsubscribe("channel.update", condition);
console.log("Successfully unsubscribed");
```

* * *

<a name="TES+on"></a>

### tes.on(type, callback) ⇒ <code>void</code>
Add an event handler. This will handle ALL events of the type

**Kind**: instance method of [<code>TES</code>](#TES)  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> \| <code>&quot;revocation&quot;</code> \| <code>&quot;connection\_lost&quot;</code> | The subscription type. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details.     See the examples for details on `revocation` and `connection_lost` |
| callback | [<code>onEventCallback</code>](#TES..onEventCallback) | The function to call when the event happens |

**Example**  
```js
tes.on("channel.update", (event, subscription) => {
    console.log(`Event triggered for subscription ${subscription.id}`);
    console.log(`${event.broadcaster_user_id}'s title is now "${event.title}"`);
});
```
**Example**  
The `revocation` event is fired when Twitch revokes a subscription. This can happen
for various reasons [according to Twitch](https://dev.twitch.tv/docs/eventsub/handling-webhook-events/#revoking-your-subscription).
The "event" argument is the subscription data. This means that for this, the first and second arguments are basically identical

**NOTE**: No explicit subscription is needed for this event to be fired
```js
tes.on("revocation", (subscriptionData) => {
    console.log(`Subscription ${subscriptionData.id} has been revoked`);
    // perform necessary cleanup here
});
```
**Example**  
The `connection_lost` event is fired when a WebSocket connection is lost. All related
subscriptions should be considered stale if this happens. You can read more about this case
in the [Twitch doc](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#keepalive-message).
The "event" argument is an `Object` which has subscription ids as keys and type and condition as the values

**NOTE**: No explicit subscription is needed for this event to be fired
```js
tes.on("connection_lost", (subscriptions) => {
    // if your subscriptions are important to you, resubscribe to them
    Object.values(subscriptions).forEach((subscription) => {
        tes.subscribe(subscription.type, subscription.condition);
    });
});
```

* * *

<a name="TES..Config"></a>

### TES~Config : <code>Object</code>
**Kind**: inner typedef of [<code>TES</code>](#TES)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>Options</code>](#TES..Config..Options) | Basic configuration options |
| identity | [<code>Identity</code>](#TES..Config..Identity) | Identity information |
| listener | [<code>Listener</code>](#TES..Config..Listener) | Your notification listener details |


* [~Config](#TES..Config) : <code>Object</code>
    * [~Options](#TES..Config..Options) : <code>Object</code>
    * [~Identity](#TES..Config..Identity) : <code>Object</code>
        * [~onAuthenticationFailure](#TES..Config..Identity..onAuthenticationFailure) ⇒ <code>Promise</code>
    * [~Listener](#TES..Config..Listener) : <code>Object</code>


* * *

<a name="TES..Config..Options"></a>

#### Config~Options : <code>Object</code>
Basic configuration options

**Kind**: inner typedef of [<code>Config</code>](#TES..Config)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [debug] | <code>boolean</code> | <code>false</code> | Set to true for in-depth logging |
| [logging] | <code>boolean</code> | <code>true</code> | Set to false for no logging |


* * *

<a name="TES..Config..Identity"></a>

#### Config~Identity : <code>Object</code>
Identity configuration

**Kind**: inner typedef of [<code>Config</code>](#TES..Config)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Your client ID |
| [secret] | <code>string</code> | Your client secret, required for webhook transport or     when not using `onAuthenticationFailure` in server-side `websocket` applications |
| [onAuthenticationFailure] | [<code>onAuthenticationFailure</code>](#TES..Config..Identity..onAuthenticationFailure) | Callback function called     when API requests get an auth failure. If you already have an authentication solution for your app     elsewhere use this to avoid token conflicts |
| [accessToken] | <code>string</code> | If you already have an access token, put it here. Must     be user access token for `websocket` transport, must be app access token for `webhook` transport.  Should     usually be paired with `onAuthenticationFailure` on server-side applications |
| [refreshToken] | <code>string</code> | The refresh token to use if using `websocket` transport     server-side. Required when not using `onAuthenticationFailure` in server-side `websocket` applications |


* * *

<a name="TES..Config..Identity..onAuthenticationFailure"></a>

##### Identity~onAuthenticationFailure ⇒ <code>Promise</code>
Callback function called when API requests get an auth failure. If you already have an authentication solution
for your app elsewhere use this to avoid token conflicts

**Kind**: inner typedef of [<code>Identity</code>](#TES..Config..Identity)  
**Returns**: <code>Promise</code> - Promise that resolves a new access token  
**Example**  
```js
async function onAuthenticationFailure() {
    const res = await getNewAccessToken(); // your token refresh logic
    return res.access_token;
}
```

* * *

<a name="TES..Config..Listener"></a>

#### Config~Listener : <code>Object</code>
Listener configuration

**Kind**: inner typedef of [<code>Config</code>](#TES..Config)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | <code>&quot;webhook&quot;</code> \| <code>&quot;websocket&quot;</code> |  | The type of transport to use |
| [baseURL] | <code>string</code> |  | Required for `webhook` transport. The base URL where your app is     hosted. See [Twitch doc](https://dev.twitch.tv/docs/eventsub) for details on local development |
| [websocketURL] | <code>string</code> | <code>&quot;wss://eventsub.wss.twitch.tv/ws&quot;</code> | A custom websocket URL to use for `websocket` transport. Useful for     local testing with [Twitch CLI](https://dev.twitch.tv/docs/cli/) |
| [secret] | <code>string</code> |  | Required for `webhook` transport. The secret to use for your `webhook`     subscriptions. Should be different from your client secret |
| [server] | <code>Express</code> |  | The Express app object. Use if integrating with an existing Express app |
| [port] | <code>number</code> | <code>process.env.PORT,8080</code> | A custom port to use |
| [ignoreDuplicateMessages] | <code>boolean</code> | <code>true</code> | Ignore event messages with IDs that have already     been seen. Only used in `webhook` transport |
| [ignoreOldMessages] | <code>boolean</code> | <code>true</code> | Ignore event messages with timestamps older than ten     minutes. Only used in `webhook` transport |


* * *

<a name="TES..onEventCallback"></a>

### TES~onEventCallback ⇒ <code>void</code>
Called when an event TES is listening for is triggered. See [TES.on](#TES+on) for examples

**Kind**: inner typedef of [<code>TES</code>](#TES)  

| Param | Type | Description |
| --- | --- | --- |
| [event] | <code>Object</code> | The event data. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#events) for details.     See the [TES.on](#TES+on) examples for details on `revocation` and `connection_lost` |
| [subscription] | <code>Object</code> | The subscription data corresponding to the event. See [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-reference/#subscription) for details |


* * *

