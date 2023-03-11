## Classes

<dl>
<dt><a href="#TES">TES</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#TESConfig">TESConfig</a></dt>
<dd></dd>
<dt><a href="#TESConfigOptions">TESConfigOptions</a></dt>
<dd></dd>
<dt><a href="#TESConfigIdentity">TESConfigIdentity</a></dt>
<dd></dd>
<dt><a href="#TESConfigListener">TESConfigListener</a></dt>
<dd></dd>
</dl>

<a name="TES"></a>

## TES
**Kind**: global class  
**License**: Copyright (c) 2020-2023 Mitchell AdairThis software is released under the MIT License.https://opensource.org/licenses/MIT  

* [TES](#TES)
    * [new TES(config)](#new_TES_new)
    * [.getSubscriptions([cursor])](#TES+getSubscriptions) ⇒ <code>Promise</code>
    * [.getSubscriptionsByType(type, [cursor])](#TES+getSubscriptionsByType) ⇒ <code>Promise</code>
    * [.getSubscriptionsByStatus(status, [cursor])](#TES+getSubscriptionsByStatus) ⇒ <code>Promise</code>
    * [.getSubscription(idOrType, [condition])](#TES+getSubscription) ⇒ <code>Promise</code>


* * *

<a name="new_TES_new"></a>

### new TES(config)

| Param | Type | Description |
| --- | --- | --- |
| config | [<code>TESConfig</code>](#TESConfig) | The TES configuration |

**Example**  
```jsconst config = {    identity: {        id: YOUR_CLIENT_ID,        accessToken: YOUR_USER_ACCESS_TOKEN    }    listener: { type: "websocket" },};const tes = new TES(config);```

* * *

<a name="TES+getSubscriptions"></a>

### tes.getSubscriptions([cursor]) ⇒ <code>Promise</code>
Get a list of your event subscriptions

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - Subscription data see [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details  

| Param | Type | Description |
| --- | --- | --- |
| [cursor] | <code>string</code> | The pagination cursor |

**Example**  
```jsconst subs = await tes.getSubscriptions();console.log(`I have ${subs.total} event subscriptions`);```

* * *

<a name="TES+getSubscriptionsByType"></a>

### tes.getSubscriptionsByType(type, [cursor]) ⇒ <code>Promise</code>
Get a list of your event subscriptions by type

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - Subscription data see [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | The type of subscription see [Twitch doc](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#subscription-types) for details |
| [cursor] | <code>string</code> | The pagination cursor |

**Example**  
```jsconst subs = await tes.getSubscriptionsByType("channel.update");console.log(`I have ${subs.total} "channel.update" event subscriptions`);```

* * *

<a name="TES+getSubscriptionsByStatus"></a>

### tes.getSubscriptionsByStatus(status, [cursor]) ⇒ <code>Promise</code>
Get a list of your event subscriptions by status

**Kind**: instance method of [<code>TES</code>](#TES)  
**Returns**: <code>Promise</code> - Subscription data see [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | The subscription status see [Twitch doc](https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions) for details |
| [cursor] | <code>string</code> | The pagination cursor |

**Example**  
```jsconst subs = await tes.getSubscriptionsByType("channel.update");console.log(`I have ${subs.total} "channel.update" event subscriptions`);```

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
```js// find a subscription by idconst sub = await getSubscription("2d9e9f1f-39c3-426d-88f5-9f0251c9bfef");console.log(`The status for subscription ${sub.id} is ${sub.status}`);```
**Example**  
```js// find a subscription by type and conditionconst condition = { broadcaster_user_id: "1337" };const sub = await getSubscription("channel.update", condition);console.log(`The status for subscription ${sub.id} is ${sub.status}`);```

* * *

<a name="TESConfig"></a>

## TESConfig
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>TESConfigOptions</code>](#TESConfigOptions) | Basic configuration options |
| identity | [<code>TESConfigIdentity</code>](#TESConfigIdentity) | Identity information |
| listener | [<code>TESConfigListener</code>](#TESConfigListener) | Your notification listener details |


* * *

<a name="TESConfigOptions"></a>

## TESConfigOptions
**Kind**: global typedef  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [debug] | <code>boolean</code> | <code>false</code> | Set to true for in-depth logging |
| [logging] | <code>boolean</code> | <code>true</code> | Set to false for no logging |


* * *

<a name="TESConfigIdentity"></a>

## TESConfigIdentity
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Your client ID |
| [secret] | <code>string</code> | Your client secret, required for webhook transport or     when not using `onAuthenticationFailure` in server-side `websocket` applications |
| [onAuthenticationFailure] | [<code>onAuthenticationFailure</code>](#TESConfigIdentity..onAuthenticationFailure) | Callback function called     when API requests get an auth failure. If you already have an authentication solution for your app     elsewhere use this to avoid token conflicts |
| [accessToken] | <code>string</code> | If you already have an access token, put it here. Must     be user access token for `websocket` transport, must be app access token for `webhook` transport.  Should     usually be paired with `onAuthenticationFailure` on server-side applications |
| [refreshToken] | <code>string</code> | The refresh token to use if using `websocket` transport     server-side. Required when not using `onAuthenticationFailure` in server-side `websocket` applications |


* * *

<a name="TESConfigIdentity..onAuthenticationFailure"></a>

### TESConfigIdentity~onAuthenticationFailure ⇒ <code>Promise</code>
**Kind**: inner typedef of [<code>TESConfigIdentity</code>](#TESConfigIdentity)  
**Returns**: <code>Promise</code> - Promise that resolves a new access token  
**Example**  
```jsasync function onAuthenticationFailure() {    const res = await getNewAccessToken(); // your token refresh logic    return res.access_token;}```

* * *

<a name="TESConfigListener"></a>

## TESConfigListener
**Kind**: global typedef  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | <code>&quot;webhook&quot;</code> \| <code>&quot;websocket&quot;</code> |  | The type of transport to use |
| [baseURL] | <code>string</code> |  | Required for `webhook` transport. The base URL where your app is     hosted. See [Twitch doc](https://dev.twitch.tv/docs/eventsub) for details on local development |
| [secret] | <code>string</code> |  | Required for `webhook` transport. The secret to use for your `webhook`     subscriptions. Should be different from your client secret |
| [server] | <code>Express</code> |  | The Express app object. Use if integrating with an existing Express app |
| [ignoreDuplicateMessages] | <code>boolean</code> | <code>true</code> | Ignore event messages with IDs that have already     been seen. Only used in `webhook` transport |
| [ignoreOldMessages] | <code>boolean</code> | <code>true</code> | Ignore event messages with timestamps older than ten     minutes. Only used in `webhook` transport |


* * *

