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
<a name="new_TES_new"></a>

### new TES(config)
TESjs


| Param | Type | Description |
| --- | --- | --- |
| config | [<code>TESConfig</code>](#TESConfig) | The TES configuration |

**Example**  
```jsconst config = {    identity: {        id: YOUR_CLIENT_ID,        accessToken: YOUR_USER_ACCESS_TOKEN    }    listener: { type: "websocket" },}const tes = new TES(config)```
<a name="TESConfig"></a>

## TESConfig
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>TESConfigOptions</code>](#TESConfigOptions) | Basic configuration options |
| identity | [<code>TESConfigIdentity</code>](#TESConfigIdentity) | Identity information |
| listener | [<code>TESConfigListener</code>](#TESConfigListener) | Your notification listener details |

<a name="TESConfigOptions"></a>

## TESConfigOptions
**Kind**: global typedef  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [debug] | <code>boolean</code> | <code>false</code> | Set to true for in-depth logging |
| [logging] | <code>boolean</code> | <code>true</code> | Set to false for no logging |

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

<a name="TESConfigIdentity..onAuthenticationFailure"></a>

### TESConfigIdentity~onAuthenticationFailure ⇒ <code>Promise</code>
**Kind**: inner typedef of [<code>TESConfigIdentity</code>](#TESConfigIdentity)  
**Returns**: <code>Promise</code> - Promise that resolves a new access token  
**Example**  
```jsasync function onAuthenticationFailure() {    const res = await getNewAccessToken(); // your token refresh logic    return res.access_token;}```
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

