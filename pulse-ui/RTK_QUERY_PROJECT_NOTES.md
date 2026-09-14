<style>
@media print {
  @page { size: A4; margin: 18mm 16mm; }
  body { max-width: none; margin: 0; padding: 0; font-size: 10.5pt; line-height: 1.5; color: #111; }
  h2 { break-before: page; page-break-before: always; }
  h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
  pre { white-space: pre-wrap; overflow: visible; overflow-wrap: anywhere; font-size: 8.5pt; }
  pre code, pre > code.sourceCode { white-space: pre-wrap; overflow-wrap: anywhere; }
  pre > code.sourceCode > span { text-indent: 0; padding-left: 0; }
  table { display: table; table-layout: fixed; width: 100%; overflow: visible; border-collapse: collapse; font-size: 9pt; }
  th, td { padding: 5px; border: 1px solid #bbb; vertical-align: top; overflow-wrap: anywhere; }
  td code, th code { white-space: pre-wrap; overflow-wrap: anywhere; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  p, li { orphans: 3; widows: 3; }
  a { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
}
</style>

# RTK Query in Pulse UI

*A project-based study guide*

**Project:** `pulse-ui` — React, TypeScript, Redux Toolkit, and Vite.  
**Reviewed:** 14 September 2026; repository revision `6c8dbf9`.  
**Redux Toolkit:** `package.json` requests `^2.12.0`; the lockfile and installed package identify `2.12.0`. RTK Query is included in Redux Toolkit.

These notes explain the RTK Query code in this frontend: what each important piece does, why that pattern fits its location, how components use it, and which limitations follow from the implementation. The review covers the shared API infrastructure, all **26 endpoints — 11 queries and 15 mutations — across six feature modules**, their generated hooks, and the supporting authentication, loading, error, and UI flows.

“Why this fits here” explains the practical rationale supported by the code; it does not claim to know the original author's undocumented intentions. Examples labeled **current code** are excerpts from the project, sometimes reformatted or shortened as stated. Examples labeled **suggested improvement** or **illustrative** are learning material, not changes applied to the application. Backend behavior is described as the frontend's expected contract unless explicitly qualified.

**Table of contents**

1. [Must-know RTK Query concepts](#concepts)
2. [The project's API architecture and source map](#architecture)
3. [Creating the shared API and connecting Redux](#store)
4. [The custom base query: HTTP, headers, loader, and errors](#base-query)
5. [TypeScript contracts and response transformation](#contracts)
6. [Authentication and session lifecycle](#authentication)
7. [Tickets: lists, details, assignment, status, and creation](#tickets)
8. [Comments: dependent reads and refreshing after writes](#comments)
9. [Assets: filtered inventory and assignment](#assets)
10. [Users and settings: administration and local identity](#users)
11. [Notifications: polling, optimistic updates, and rollback](#notifications)
12. [React hook usage, pagination, and derived UI data](#react-usage)
13. [The complete cache invalidation map](#invalidation)
14. [End-to-end request walkthroughs](#walkthroughs)
15. [Current limitations and suggested improvements](#limitations)
16. [How to add another endpoint in this project](#extension)
17. [Revision questions and practical debugging](#revision)
18. [PDF conversion and reference material](#references)

<a id="concepts"></a>

## 1. Must-know RTK Query concepts

### 1.1 Redux, Redux Toolkit, and RTK Query

Redux holds application state in a store and changes it through dispatched actions and reducers. Redux Toolkit supplies utilities such as `configureStore` and `createSlice` for writing that logic. RTK Query supplies a data-fetching and caching layer within Redux Toolkit.

In Pulse UI, ticket data belongs to the backend, while the frontend keeps a cached copy. The global loading overlay and error modal are frontend presentation state. This explains why the store contains both the generated API reducer and manually written `loader` and `error` reducers.

RTK Query manages request status, cached responses, subscriptions, and cache refreshes. A component still decides how to display data, validate a form, navigate, or show a local error. It does not need to manually implement a separate ticket-fetching reducer and fetching effect for every screen.

### 1.2 Server state, client state, and form state

| Kind of state | Pulse UI examples | Current owner |
| --- | --- | --- |
| Server data | Tickets, comments, assets, users, unread count | RTK Query cache |
| Shared presentation state | Global request count and error modal | Redux slices |
| Local UI state | Selected asset ID, open notification menu, active filters | React state |
| Form state | Validation errors, dirty fields, submission state | React Hook Form |
| Stored identity | Tokens and the signed-in user's profile | `authStorage` and browser storage |

These categories interact, but one does not automatically synchronize the others. Invalidating `Users` refreshes matching RTK Query entries; it does not rewrite the stored signed-in user. The profile form explicitly performs that storage update.

### 1.3 An API slice and an endpoint

An **API slice** is the service created by `createApi`. It provides a reducer, middleware, endpoint definitions, hooks, and utilities. An **endpoint** is a named operation inside that service, such as `getTicket` or `updateTicketStatus`.

The endpoint name is a frontend identifier. It is distinct from the backend URL:

```text
Frontend endpoint: getTicket
HTTP request:      GET /ticket/42
Generated hook:    useGetTicketQuery(42)
Redux state key:   pulseApi
```

The same URL can serve a query and a mutation. For example, comments use GET and POST against `/ticket/{ticketId}/comments`, with different frontend endpoint names.

### 1.4 Query versus mutation

| Property | Query | Mutation |
| --- | --- | --- |
| Usual purpose | Read server data | Perform an operation that changes server state |
| Pulse example | `getTicket` | `updateTicketStatus` |
| Definition | `builder.query<Result, Arg>` | `builder.mutation<Result, Arg>` |
| Hook result | Object containing data, status, and helpers | Tuple containing a trigger and status object |
| When it starts | Subscription normally starts automatically unless skipped | Calling the trigger starts the operation |
| Synchronization | Can provide tags | Can invalidate query tags |

The distinction is about the operation, not just the HTTP verb. Pulse declares login and refresh as mutations because they are explicit session operations with request bodies. Their hooks should not initiate those operations simply because a component rendered. See the official [query guide](https://redux-toolkit.js.org/rtk-query/usage/queries) and [mutation guide](https://redux-toolkit.js.org/rtk-query/usage/mutations).

### 1.5 Generated React hooks

The import from `@reduxjs/toolkit/query/react` enables React hook generation. Pulse exports hooks from each feature's injected API:

```ts
export const { useGetTicketQuery } = ticketApi;
```

The naming pattern is `use` + capitalized endpoint name + `Query` or `Mutation`.

```tsx
// Illustrative usage of existing project hooks.
const { data: ticket, isLoading } = useGetTicketQuery(42);
const [updateStatus, { isLoading: isSaving }] =
  useUpdateTicketStatusMutation();
```

The first statement subscribes to a query. The second prepares an operation; `updateStatus(...)` must be called to send it. Names such as `ticket` and `isSaving` are ordinary destructuring aliases chosen by the component.

### 1.6 The base query

The base query is the shared function an endpoint uses to execute its request. `fetchBaseQuery` wraps the browser's Fetch API. Pulse wraps that function again to add global loading and error behavior.

There are two different functions named through the API vocabulary:

```text
Endpoint query(argument)
  builds a URL or request description

Shared baseQuery(request, api, extraOptions)
  executes the request and returns data or an error
```

Returning `"/ticket/42"` from an endpoint's `query` does not itself call the network. RTK Query passes that description to the configured base query. The custom wrapper's `return result` preserves RTK Query's expected result contract. See [customizing queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries).

### 1.7 Cache identity: endpoint plus serialized argument

Conceptually, a query cache entry is identified by:

```text
endpoint name + serialized original query argument
```

Two components requesting `getTicket(42)` can share one entry. `getTicket(43)` has a different entry. `getTickets(undefined)` and `getTicket(42)` also have different entries, even if both responses contain ticket 42.

Pulse passes filter objects directly to query hooks. A new object with the same serializable values does not itself create a new cache identity. The installed default serializer sorts plain-object keys and serializes their values. However, number `42` and string `"42"` represent different arguments.

The URL is not the cache key. Defaults and transformations inside an endpoint's `query` function do not rewrite its original cache argument. This matters for Pulse's `"All"` filter normalization. See [cache behavior](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior).

### 1.8 Subscriptions, reuse, and cache lifetime

A query hook subscribes its component to a particular cache entry. Multiple subscribers to the same entry share its updates. Leaving a screen removes that screen's subscription; it does not necessarily delete the cached response immediately.

Pulse does not configure `keepUnusedDataFor`. The installed Redux Toolkit defaults to **60 seconds after the final subscriber leaves**. A subscription can keep data around much longer. This setting controls unused-entry retention, not a periodic refresh interval or a maximum age for active data.

Ordinary remounts can reuse retained data. A refresh policy, invalidation, or missing cache entry can instead require a request. These defaults are visible in the installed package's `src/query/createApi.ts` and described in the [createApi reference](https://redux-toolkit.js.org/rtk-query/api/createApi).

### 1.9 Loading and result states

| Value | Meaning for a query | How to think about it in Pulse |
| --- | --- | --- |
| `data` | Latest available result surfaced by the hook | Can preserve previous data while arguments change |
| `currentData` | Data specifically for the current argument | Useful when showing the previous ticket would be misleading |
| `isUninitialized` | Query has not started for this subscription state | Relevant to skipped queries |
| `isLoading` | Initial loading state without usable data | Initial ticket or notification loading message |
| `isFetching` | A request is in progress, including refreshes | Suitable for a subtle refresh indicator |
| `isSuccess` | Hook reports a successful data state | Can coexist with background fetching |
| `isError` / `error` | A request failed and its error information | Retry UI or local failure message |
| `refetch` | Function to request fresh data for this query | Retry buttons in detail views |

Mutation hooks expose `isLoading` for their own pending operation. They do not use the query distinction between initial loading and fetching cached data. The installed hook implementation is in `src/query/react/buildHooks.ts`; the public behavior is explained in [query result usage](https://redux-toolkit.js.org/rtk-query/usage/queries).

### 1.10 Tags and invalidation

Tags label query entries with dependencies. They are not the data itself and are not cache keys.

```ts
// Current styles used in the project.
providesTags: ["Tickets"];
invalidatesTags: ["Tickets"];
```

The query declares, “this result depends on Tickets.” The mutation declares, “Tickets-related results need reconsideration.” Once invalidation is processed, matching subscribed queries are refetched; matching entries without subscribers are removed.

Invalidation does not insert a mutation's returned object into every cached list. It also does not notify another browser or another user's Redux store. The project's notifications use polling to discover remote changes. See [automated refetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching).

### 1.11 Broad tags and tags with IDs

Pulse uses broad strings such as `"Users"` and `"Assets"`, and notification tags with synthetic IDs:

```ts
{ type: "Notifications", id: "LIST" }
{ type: "Notifications", id: "COUNT" }
```

`LIST` and `COUNT` are developer-chosen identifiers, not reserved RTK Query keywords. Tags with IDs allow dependency groups within one tag type. The actual provided tags determine the effect: Pulse's notification list provides both IDs, so invalidating `COUNT` also matches that list.

### 1.12 Response transformation versus promise unwrapping

`transformResponse` controls the endpoint's successful result shape. `.unwrap()` controls how the caller consumes a trigger's result.

```ts
// Current endpoint pattern.
transformResponse: (response: ApiResponse<Ticket>) => response.data
```

After this transform, the endpoint result is a `Ticket`. When a mutation preserves the envelope, `.unwrap()` still returns that envelope. Thus `login(...).unwrap()` returns `LoginResponse`, while `refreshSession(...).unwrap()` returns the transformed token pair.

Unwrapping does not automatically extract an application's nested `data` property. It returns the endpoint's successful result, or rejects with the failure, enabling `try/catch` at the call site.

### 1.13 Conditional fetching

`skip` temporarily disables a hook's query subscription without conditionally calling the hook itself:

```tsx
// Current code from TicketDetails.tsx.
useGetTicketQuery(ticketId, { skip: !isValidTicketId });
```

The hook remains at the top level of the component. Invalid IDs do not start a ticket request. Pulse also skips assignee loading when management controls are unavailable and skips the notification list while its menu is closed.

`skipToken` is an alternative useful when TypeScript cannot accept a possibly missing argument. It is not used in this project. A lazy query hook is another option for explicitly triggered reads; Pulse currently uses regular query hooks with conditional subscription.

### 1.14 Refetch policies and polling

Pulse uses these options on notification subscriptions:

| Option | Meaning | Unit or dependency |
| --- | --- | --- |
| `pollingInterval: 15_000` | Periodically request fresh data while subscribed | Milliseconds |
| `skipPollingIfUnfocused: true` | Suppress polling requests while unfocused | Requires listener setup |
| `refetchOnFocus: true` | Refresh when focus returns | Requires listener setup |
| `refetchOnReconnect: true` | Refresh after reconnect | Requires listener setup |
| `refetchOnMountOrArgChange: true` | Refresh on a new subscription/argument even with cached data | Used on the notification list |

`setupListeners` enables event tracking; it does not automatically opt every endpoint into these refetch policies. Polling is repeated HTTP fetching, not a WebSocket connection. See [polling](https://redux-toolkit.js.org/rtk-query/usage/polling) and [setupListeners](https://redux-toolkit.js.org/rtk-query/api/setupListeners).

### 1.15 Optimistic and pessimistic updates

An **optimistic update** changes the visible cache before the server confirms a write. Pulse immediately decreases the unread count and marks a notification read. If the request fails, the code attempts to undo those patches.

A **pessimistic cache update** waits for server success before explicitly changing cached data. Pulse's ticket and asset mutations generally use invalidation and a subsequent query instead of manually copying returned objects into query caches.

`onQueryStarted` is the request lifecycle callback used for notification patches. It receives `dispatch` and `queryFulfilled`; that promise settles with the corresponding request. `updateQueryData` edits an existing entry selected by endpoint and exact argument. It does not create a missing entry. See [manual cache updates](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates).

### 1.16 Immer drafts and primitive results

Inside notification cache recipes, object data can be edited through an Immer draft:

```ts
notification.read = true;
```

This produces an immutable cache update. It does not authorize directly mutating `data` obtained from a component hook.

The unread count is a number, so the recipe returns its replacement:

```ts
(count) => Math.max(0, count - 1)
```

The installed `updateQueryData` implementation treats draftable values and primitives separately. This is why both recipe styles appear in the same notification mutation.

### 1.17 HTTP errors, application envelopes, and validation

The backend envelope contains `success`, `statusCode`, and `message`, but those are JSON fields. They are different from the actual HTTP response status. Pulse uses the default HTTP success classification and does not inspect `success: false` as a separate failure condition.

TypeScript interfaces describe the expected data during development; they do not validate received JSON at runtime. The local `isApiResponse` helper checks the presence of several fields, not their complete types or nested content. A malformed response can still violate a declared endpoint type.

### 1.18 API reset and authentication boundaries

`baseApi.util.resetApiState()` clears the API's Redux state. Pulse dispatches it after successful login so retained responses from an earlier identity are cleared before navigating into the app.

This matters because the bearer token is injected into headers and is not included in query arguments. The cache key for `getAssets(undefined)` does not change just because browser storage now contains another token. A cache reset is distinct from clearing stored tokens, navigating away, or invalidating one tag. See [API utilities](https://redux-toolkit.js.org/rtk-query/api/created-api/api-slice-utils).

### 1.19 Additional concepts to recognize

These capabilities are useful background knowledge, but no application use was found in this review:

| Concept | Purpose | Relevance if Pulse grows |
| --- | --- | --- |
| `selectFromResult` | Subscribe to a selected portion of a query result | Large tables or isolated counters |
| Lazy queries | Trigger reads from an event | Explicit server search |
| Prefetching | Warm a cache before navigation | Hovering a ticket link |
| `queryFn` | Define custom endpoint execution | Combining requests or using another client |
| `onCacheEntryAdded` | Manage work over a cache entry's lifetime | Streaming notification connections |
| `serializeQueryArgs` | Customize query identity | Canonical filter arguments |
| Infinite queries | Manage multiple fetched pages in one result | Loading more notifications |
| `fixedCacheKey` | Share mutation result state between hook instances | A shared operation indicator |
| Retry wrappers | Retry selected request failures | Explicit transient-failure handling |
| Persistence/rehydration | Restore cached state across store recreation | Requires careful freshness and identity rules |

The current project has none of these configured. Its complexity comes primarily from a shared base query, domain endpoint injection, tags, and notification lifecycle callbacks.

**Key takeaways:** Learn the difference between cache identity, dependency tags, response transformation, and promise unwrapping. These four distinctions explain most of the patterns in the rest of this guide.

<a id="architecture"></a>

## 2. The project's API architecture and source map

### 2.1 One API service, six feature modules

```text
React application
  |
  +-- Generated hooks in feature components
        |
        +-- authApi.ts           2 mutations
        +-- ticketApi.ts         4 queries, 3 mutations
        +-- commentApi.ts        1 query,  1 mutation
        +-- assetApi.ts          3 queries, 2 mutations
        +-- userApi.ts           1 query,  4 mutations
        +-- notificationApi.ts   2 queries, 3 mutations
              |
              +-- injectEndpoints into baseApi
                    |
                    +-- Redux state: pulseApi
                    +-- One API middleware
                    +-- baseQueryWithLoader
                          |
                          +-- fetchBaseQuery
                          +-- authStorage
                          +-- loader/error slices
```

All six exported feature APIs extend the same runtime API object. They are not six independent caches or six separately registered reducers. The returned injected API references expose the added endpoint types to TypeScript. See the official [code splitting explanation](https://redux-toolkit.js.org/rtk-query/usage/code-splitting).

### 2.2 Source files to keep beside these notes

Paths below are relative to this Markdown file's location in the `pulse-ui` root.

| Area | Source | Responsibility |
| --- | --- | --- |
| Shared API | [baseApi.ts](src/services/api/baseApi.ts) | API identity, base query, tag vocabulary |
| HTTP infrastructure | [baseQuery.ts](src/services/api/baseQuery.ts) | Headers, request wrapper, error guard, response envelope |
| Store | [store.ts](src/app/store.ts) | Reducers, middleware, listeners, inferred types |
| Typed Redux hooks | [hooks.ts](src/hooks.ts) | App-specific dispatch and selector types |
| React integration | [main.tsx](src/main.tsx), [App.tsx](src/App.tsx) | Provider, routes, global presentation components |
| Authentication | [authApi.ts](src/services/auth/authApi.ts), [authStorage.ts](src/services/auth/authStorage.ts) | Session mutations and browser storage |
| Tickets | [ticketApi.ts](src/services/tickets/ticketApi.ts) | Reads, pagination, status, assignment, creation |
| Comments | [commentApi.ts](src/services/comments/commentApi.ts) | Ticket-scoped discussion |
| Assets | [assetApi.ts](src/services/assets/assetApi.ts) | Inventory, personal assets, assignment |
| Users | [userApi.ts](src/services/users/userApi.ts) | User administration and settings writes |
| Notifications | [notificationApi.ts](src/services/notifications/notificationApi.ts) | Pollable reads and optimistic writes |
| Shared UI state | [loaderSlice.ts](src/redux/loaderSlice.ts), [errorSlice.ts](src/redux/errorSlice.ts) | Request counter and modal state |
| Domain models | [ticket.ts](src/types/ticket.ts), [user.ts](src/types/user.ts), [notification.ts](src/types/notification.ts) | Expected entity and page shapes |

### 2.3 Why feature injection fits this project

Each domain has a small, focused file, while authentication headers and global request behavior remain centralized. Shared tags also cross module boundaries: creating a user can refresh assignee queries declared in both the ticket and asset modules because all of them belong to `baseApi`.

The store registers the API once. New injected modules do not require another middleware or reducer registration. A component imports hooks from its own feature module, which evaluates that module and injects its endpoints before those hooks are used.

This is a modular service design that supports later code splitting. It does not prove that feature code is currently downloaded lazily: `App.tsx` statically imports the route components, and the reviewed route setup does not use dynamic imports for those features.

### 2.4 Inactive code that can mislead a reader

[pulseApi.ts](src/services/api/pulseApi.ts) is entirely commented out. Its `localhost:8080` base URL and its older endpoint examples have no runtime effect. The active reducer key is still named `pulseApi`, but the active service is the `baseApi` export.

[endpoints.ts](src/services/api/endpoints.ts) defines an `API` constant that is not imported by the active service files. In particular, its `REFRESH: "auth/refresh"` does not match the actual refresh endpoint, `auth/refreshToken`. Read active `query` definitions to determine the requests being made.

[authSlice.ts](src/redux/authSlice.ts) is empty and is not registered in the store. The identity currently comes from browser storage, not an auth reducer. The `posts`/`comments` example comment below `RootState` in `store.ts` is also stale; the actual registered state keys are `pulseApi`, `loader`, and `error`.

**Key takeaways:** Follow `baseApi` and its injected modules to understand the running application. Filenames, commented examples, and unused URL constants are not reliable evidence of runtime behavior.

<a id="store"></a>

## 3. Creating the shared API and connecting Redux

### 3.1 The shared definition

Current code from [baseApi.ts](src/services/api/baseApi.ts):

```ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithLoader } from "./baseQuery";

export const baseApi = createApi({
  reducerPath: "pulseApi",
  baseQuery: baseQueryWithLoader,
  tagTypes: [
    "Users", "Tickets", "Assets",
    "Comments", "Notifications", "Auth",
  ],
  endpoints: () => ({}),
});
```

`reducerPath` names the store location where this API's reducer state lives. It does not set an HTTP route or determine which feature files can inject endpoints.

`baseQuery` connects every endpoint to the project-wide HTTP wrapper. The empty `endpoints` function is intentional: the shared module establishes infrastructure, and feature modules add actual operations.

`tagTypes` declares the allowed dependency names. Merely declaring `Auth` does not create auth caching or invalidate anything at login. No active endpoint provides or invalidates `Auth` in the reviewed code.

### 3.2 Reducer and middleware wiring

Current code from [store.ts](src/app/store.ts):

```ts
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    loader: loaderReducer,
    error: errorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

The computed object key evaluates to `pulseApi`, placing cached data and request metadata under `state.pulseApi`. The reducer records state transitions. The middleware implements coordination such as invalidation, polling, and cache lifecycle behavior.

Calling `getDefaultMiddleware()` preserves Redux Toolkit's default middleware, including thunk support used by dispatched RTK Query operations. `.concat(baseApi.middleware)` adds the API middleware to that existing chain.

The two manual reducers are separate because a global request overlay and a modal are application choices. RTK Query does not inherently render either one.

### 3.3 Listener setup

`setupListeners(store.dispatch)` is called once at module initialization. Notification hooks later opt into focus and network-reconnection behavior. Without event tracking, those options would not work as intended.

The rest of the API uses its default refetch policies. A `getTicket` subscription does not automatically become a focus-refetching subscription merely because listeners were installed.

### 3.4 React Provider and typed helpers

The relevant portion of [main.tsx](src/main.tsx) wraps the application with `<Provider store={store}>`. Generated hooks access that Redux context. The router is nested inside it, so route components and global application components can all use the same store.

Current code from [hooks.ts](src/hooks.ts):

```ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

These helpers preserve the actual store's types. For example, the login component can dispatch the API reset, while the global modal selects `state.error`. Generated RTK Query hooks already carry their endpoint types; these Redux helpers complement them for custom actions and state.

**Key takeaways:** The API needs its reducer, middleware, and React Provider. Listener setup supports optional browser-event behavior. Feature injection reuses all of this wiring.

<a id="base-query"></a>

## 4. The custom base query: HTTP, headers, loader, and errors

Source: [baseQuery.ts](src/services/api/baseQuery.ts).

### 4.1 Shared HTTP configuration

Current code:

```ts
const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:80/",
  prepareHeaders: (headers, { endpoint }) => {
    const token = authStorage.getAccessToken();
    if (token && endpoint !== "login" && endpoint !== "refreshSession") {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  },
});
```

**What this is:** A reusable HTTP executor with a base address and a per-request header preparation function.

**Why it fits here:** Every feature talks to the same configured backend address. Putting the bearer-token logic here prevents a ticket, asset, or notification endpoint from needing its own token lookup and header construction.

**What happens:** Before a request, the function reads the token currently in storage. The token is not captured once at application startup; later calls can use tokens saved by login or refresh. The `endpoint` value is the RTK Query endpoint name, such as `refreshSession`, rather than the URL string.

Only `login` and `refreshSession` are exempted from bearer headers. `createUser`, although it sends to `/auth/register`, is not exempted. The frontend treats it as an authenticated administrative operation.

Object bodies from endpoint definitions are handled by `fetchBaseQuery` as JSON. The project sets `Content-Type` on all requests, including GET requests. For a future file-upload endpoint, this unconditional JSON header would need reconsideration. The active base URL is hardcoded; `localhost` refers to the machine running the browser. See [fetchBaseQuery configuration](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery).

### 4.2 Understanding the wrapper's generic signature

Current declaration:

```ts
export const baseQueryWithLoader: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  BaseQueryExtraOptions
> = async (args, api, extraOptions) => {
  // Request handling follows.
};
```

| Type | Meaning in this wrapper |
| --- | --- |
| `string \| FetchArgs` | Accept either a URL string or an object containing URL, method, body, and other fetch options |
| `unknown` | Different endpoints return different data; the shared executor does not claim one universal entity type |
| `FetchBaseQueryError` | Expected error union produced by the fetch wrapper |
| `BaseQueryExtraOptions` | Project-specific per-endpoint options, currently loader suppression |

The runtime arguments have separate purposes. `args` is the endpoint's constructed request. `api` supplies execution context, including dispatch and cancellation information. `extraOptions` contains the endpoint configuration intended for this wrapper.

This separation is visible in notifications: the notification ID is a mutation argument, while `suppressGlobalLoader` is an endpoint option. Loader suppression is neither a URL parameter nor a backend request field.

### 4.3 The global-loader lifecycle

Current logic, with error handling omitted from this excerpt:

```ts
const shouldShowGlobalLoader = !extraOptions?.suppressGlobalLoader;
if (shouldShowGlobalLoader) {
  api.dispatch(showLoader());
}

try {
  const result = await baseQuery(args, api, extraOptions);
  // Inspect result.error and dispatch selected global errors.
  return result;
} finally {
  if (shouldShowGlobalLoader) {
    api.dispatch(hideLoader());
  }
}
```

The wrapper increments the counter before a participating request and decrements it afterward. `finally` runs for normal success, a returned error, and an unexpected exception. This avoids leaving the overlay visible when a request fails along a handled execution path.

The slice deliberately tracks a count rather than one Boolean:

```text
Event                    loadingCount       Overlay
Ticket request starts          1            visible
Comments request starts        2            visible
Ticket request finishes        1            visible
Comments request finishes      0            hidden
```

[Loader.tsx](src/components/Util/Loader.tsx) renders the overlay whenever `state.loader.loadingCount` is nonzero. The decrement reducer guards against negative values. The exported `resetLoader` exists, but no call site was found in `src`.

A cache hit that does not execute the base query does not increment this counter. Conversely, a tag-triggered refresh of a regular endpoint does execute the wrapper and can show the global overlay even when cached data is already visible.

### 4.4 Why notifications suppress the overlay

Current endpoint option:

```ts
extraOptions: { suppressGlobalLoader: true }
```

All five notification endpoints use it. A badge refresh every 15 seconds should not repeatedly place an overlay over the whole application. Notification operations still have RTK Query loading state, errors, cache writes, and invalidation. The option only bypasses the global counter in this wrapper.

The notification list can therefore show its own initial loading message, and “Mark all read” can disable itself during its mutation. Suppressing the loader does not suppress the wrapper's global 401 or 500 handling.

### 4.5 The error-routing rules

The wrapper looks at `result.error`. `fetchBaseQuery` reports ordinary request failures through a result object rather than requiring this wrapper to catch every non-2xx response as a thrown exception.

| Observed error | Extra requirement | Current wrapper action |
| --- | --- | --- |
| HTTP 401 | Non-login/non-refresh URL; body passes `isApiResponse` | Open “Session Expired. Please Login” modal, set status 401 and `/login` redirect |
| HTTP 401 from login or refresh | Auth URL is recognized | Return error for local handling without that global session-expired modal |
| HTTP 500 | Body passes `isApiResponse` | Open “Internal Server Error” modal with support reference |
| Other HTTP errors | No matching global branch | Return error to the endpoint/hook/caller |
| Network or parsing errors | String error status rather than 401/500 | Return error without those numeric-status modal branches |

`handlesAuthErrorLocally` removes leading slashes and a query string, then checks `auth/login` and `auth/refreshToken`. This URL-based rule is separate from the endpoint-name-based header exemption. A future rename or route change needs to keep both rules aligned.

The wrapper finally returns the original result. Displaying a modal does not turn a failed mutation into success. A caller's `.unwrap()` can still reject, so a global modal and a local form error can both occur for the same failure.

### 4.6 When session cleanup actually happens

The 401 wrapper branch dispatches modal state. It does not immediately clear storage or replay the failed request. In [Modal.tsx](src/components/Util/Modal.tsx), closing a modal with `statusCode === 401` clears authentication storage and navigates to login.

For a 500, the wrapper does not supply a `statusCode` field to its modal action. The modal still displays the error presentation because its success presentation is limited to 200 and 201. This is an implementation detail to recognize when reading the modal reducer; do not assume every error action carries a numeric status.

### 4.7 The response guard's actual strength

`isApiResponse` checks that a value is a non-null object with `success`, `statusCode`, `message`, and `data` properties. It does not check the property types or require `errorRef` to exist, despite declaring a type predicate for the full interface.

It is useful for avoiding obvious property-access mistakes on unknown errors. It is not full runtime schema validation. The error reducer supplies a blank fallback if `errorRef` is missing. A 401 with a plain string body fails this guard and does not take the session-expired modal branch.

**Key takeaways:** The wrapper centralizes request presentation and headers while preserving the RTK Query result. Its name mentions the loader, but its responsibilities also include selected global errors. Background endpoint options change presentation, not cache semantics.

<a id="contracts"></a>

## 5. TypeScript contracts and response transformation

### 5.1 Three layers commonly named data

Current shared envelope:

```ts
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errorRef: string;
}
```

For a successful `getTicket`, the layers are:

```text
HTTP JSON body
  ApiResponse<Ticket>
    data: Ticket
      |
      +-- transformResponse returns the Ticket
            |
            +-- hook result.data is now that Ticket
```

For `getAssets`, there is no transform. Its hook result's `data` is still an `ApiResponse<Asset[]>`, and the component must access the envelope's nested `data`. The repeated word is a naming coincidence, not extra RTK Query wrapping of the domain object.

### 5.2 Generic parameter order

```ts
builder.query<Ticket, number>(...)
builder.mutation<Ticket, {
  ticketId: number;
  status: Ticket["status"];
}>(...)
```

The first generic describes the endpoint's exposed successful result, after transformation if there is one. The second describes the argument passed by the component.

`void` in the argument position means the endpoint needs no caller-supplied value. This explains `useGetAssetsQuery()` and the explicit `undefined` passed to notification hooks when supplying a second options argument.

`void` in the result position means consumers are not expected to use a payload. Pulse's mark-read mutations use it. That type annotation does not itself strip a response body or run a transformation at runtime.

### 5.3 The project's response-shape map

| Endpoint(s) | Exposed successful result | Component consequence |
| --- | --- | --- |
| `login` | `LoginResponse` envelope | Read `response.data.accessToken` and `response.data.user` |
| `refreshSession` | `RefreshedTokens` | Read `tokens.accessToken` directly |
| `getTickets` | `Ticket[]` | Iterate hook data directly |
| `getUserTickets` | `TicketsResponse` | Read `content`, `totalPages`, and `totalElements` |
| `getTicket`, status/assignee mutations | `Ticket` | Read ticket fields directly |
| `getTicketAssignees` | `TicketAssignee[]` | Populate the assignee dropdown |
| `createTicket` | `ApiResponse<unknown>` | Check envelope `statusCode` for the success modal |
| `getTicketComments` | `TicketComment[]` | Render comments directly |
| `createTicketComment` | `ApiResponse<null>` | Caller awaits success and clears the form |
| `getAssets` | `ApiResponse<Asset[]>` | Read `assetsResponse?.data` |
| `getAllAssets` | `Asset[]` | Render the inventory array directly |
| `getAssetAssignees` | `AssetAssignee[]` | Populate assignment choices |
| `createAsset`, `assignAsset` | `Asset` | Creation callback receives the created asset |
| `getUsers` | `UsersResponse` | Read paginated `content` and counts |
| `createUser` | `CreatedUser` | Creation callback receives ID, name, and email |
| `updateUser`, `updateProfile` | `ApiResponse<User>` | Profile reads `response.data`; edit form ignores result |
| `changePassword` | `ApiResponse<null>` | Await success and clear the form |
| `getNotifications` | `NotificationsResponse` | Read `content` for the dropdown |
| `getUnreadNotificationCount` | `number` | Display and patch the count directly |
| Three mark-read mutations | `void` | Completion matters; no payload consumed |

Some transformations make the consuming UI simpler. Other endpoints preserve metadata their current callers use. The mixed style is observable; it should not be mistaken for a rule that RTK Query requires.

### 5.4 Useful domain types

`Ticket["status"]` reuses the union `"OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"`, connecting a status mutation to the entity's declared status vocabulary. `User["role"]` and `User["status"]` serve a similar purpose for forms and requests.

`Pick<AuthTokens, "accessToken" | "refreshToken">` describes a refresh result without requiring a user object. `Pick<User, "id" | "name" | "email">` describes the smaller created-user payload. These types make endpoint contracts more specific than returning an unstructured object.

The active asset service declares and exports its own `Asset`. A separate [types/asset.ts](src/types/asset.ts) declares another shape, but the reviewed asset and ticket-form consumers import the service's type. The similarly named `Response` in [types/apiResponse.ts](src/types/apiResponse.ts) is not the shared `ApiResponse<T>` used by the active endpoint modules.

### 5.5 HTTP success is not envelope success

There is no custom `validateStatus` or shared envelope-failure conversion in the active service. If the server returns valid JSON with HTTP 200 and `success: false`, the endpoint can still be treated as fulfilled. `.unwrap()` will not reject solely because a JSON field is false.

Likewise, `TicketForm`'s `response.statusCode === 201` reads a JSON field, not the HTTP metadata. Its behavior depends on the backend returning that envelope field as expected. This is a contract observation, not evidence that the backend currently violates it.

**Key takeaways:** Determine an endpoint's result type by reading both its generic and its transform. Keep the network envelope, the endpoint result, and the hook result distinct.

<a id="authentication"></a>

## 6. Authentication and session lifecycle

Sources: [authApi.ts](src/services/auth/authApi.ts), [Login.tsx](src/components/Login/Login.tsx), [SessionExpiryWarning.tsx](src/components/Login/SessionExpiryWarning.tsx), and [authStorage.ts](src/services/auth/authStorage.ts).

### 6.1 Endpoint inventory

| Endpoint / hook | Request | Argument | Result and cache behavior |
| --- | --- | --- | --- |
| `login` / `useLoginMutation` | POST `auth/login` | Email, password, optional `rememberMe` | `LoginResponse`; no tags |
| `refreshSession` / `useRefreshSessionMutation` | POST `auth/refreshToken` | `{ refreshToken }` | Transformed token pair; no tags |

Both operations use the normal global-loader behavior. The header function omits the bearer token for them. Refresh sends its refresh token in the body.

### 6.2 Login: trigger, save, reset, navigate

Current successful-login sequence:

```tsx
const response = await login(data).unwrap();
authStorage.saveTokens(
  response.data.accessToken,
  response.data.refreshToken,
  data.rememberMe,
  response.data.user,
);
dispatch(baseApi.util.resetApiState());
navigate(destination, { replace: true });
```

**What it does:** Executes the login mutation, stores the returned identity, clears API state, then navigates to the requested internal route or dashboard.

**Why this order fits:** Requests on the destination route should use the new token. Clearing API state prevents a retained personal-assets, tickets, or notification response from being reused simply because its argument is unchanged under a new login.

The login form handles mutation rejection by clearing the password and setting a form-level error. It uses React Hook Form's `isSubmitting` for submission UI, so it does not need to destructure the mutation's `isLoading` just to render the login button.

### 6.3 What remember-me changes

`saveTokens` first clears the project's authentication keys from both storage locations. It then selects `localStorage` when `rememberMe` is true, or `sessionStorage` otherwise. Tokens and the user object go into that selected storage.

This persists identity according to the storage choice. It does not persist RTK Query query results. Reloading the page recreates the in-memory Redux store because the project has no RTK Query persistence integration.

The storage helper dispatches custom browser events when tokens or user data change. These are ordinary DOM events for application synchronization, not RTK Query cache lifecycle events.

### 6.4 Refresh is an explicit UI operation

`SessionExpiryWarning` reads the access token's `exp` field, schedules a warning five minutes before expiry, and schedules session termination at expiry. Decoding the token here drives UI timing; it is not server-side verification of the token's authenticity.

The user-facing extension action does this:

```tsx
const tokens = await refreshSession({ refreshToken }).unwrap();
authStorage.updateTokens(tokens.accessToken, tokens.refreshToken);
setIsOpen(false);
```

The refresh endpoint transforms the envelope first, which is why the component reads `tokens.accessToken` without another `.data`. `updateTokens` retains the selected storage location and emits a token-change event. The listener schedules new timers using the replacement token.

The shared base query does not automatically refresh a token on a protected request's 401, and it does not replay failed requests. Such a reauthorization wrapper would be a different implementation from the current explicit session-extension flow.

### 6.5 Logout and the cache boundary

The logout action in [NavItems.tsx](src/components/NavBar/NavItems.tsx), session termination in `SessionExpiryWarning`, and the 401 modal close path clear auth storage and navigate to login. None of those paths dispatches `resetApiState`; the existing reset is in successful login.

Consequently, clearing identity does not immediately erase the API cache from memory. Protected routes and navigation remove the authenticated UI, and unused query entries can later expire. A centralized logout helper that also resets API state would make the cleanup boundary explicit; see Section 15.

**Key takeaways:** Login and refresh are RTK Query mutations, but token persistence is implemented by `authStorage`. Header injection uses the current token. Cache clearing and token clearing are separate operations in this project.

<a id="tickets"></a>

## 7. Tickets: lists, details, assignment, status, and creation

Source: [ticketApi.ts](src/services/tickets/ticketApi.ts).

### 7.1 Complete endpoint inventory

| Endpoint / generated hook | Request | Argument and result | Tags |
| --- | --- | --- | --- |
| `getTickets` / `useGetTicketsQuery` | GET `/ticket/all` | `void` → `Ticket[]` | Provides `Tickets` |
| `getUserTickets` / `useGetUserTicketsQuery` | GET `/ticket/mine` with parameters | Filter/page object → `TicketsResponse` | Provides `Tickets` |
| `getTicket` / `useGetTicketQuery` | GET `/ticket/{ticketId}` | `number` → `Ticket` | Provides `Tickets` |
| `getTicketAssignees` / `useGetTicketAssigneesQuery` | GET `/ticket/assignees` | `void` → `TicketAssignee[]` | Provides `Users` |
| `updateTicketStatus` / `useUpdateTicketStatusMutation` | PATCH `/ticket/{ticketId}/status` | ID and status → `Ticket` | Invalidates `Tickets` |
| `updateTicketAssignee` / `useUpdateTicketAssigneeMutation` | PATCH `/ticket/{ticketId}/assignee` | ID and nullable assignee ID → `Ticket` | Invalidates `Tickets` |
| `createTicket` / `useCreateTicketMutation` | POST `ticket/create` | `TicketCreationRequest` → `ApiResponse<unknown>` | None |

### 7.2 The basic detail query

Current code:

```ts
getTicket: builder.query<Ticket, number>({
  query: (ticketId) => `/ticket/${ticketId}`,
  transformResponse: (response: ApiResponse<Ticket>) => response.data,
  providesTags: ["Tickets"],
}),
```

**What this is:** A parameterized read for one ticket, with a domain object result and a cache dependency label.

**Why it fits here:** The route contains a ticket ID, and the detail screen needs fields such as title, status, assignee, and description. A dedicated detail query can be loaded directly from a URL even when the list screen has never mounted.

**How it is used:** `TicketDetails` converts the route parameter to a number, checks for a positive integer, and skips invalid IDs. It renders an initial loading state, a failure state with retry, or the ticket content.

The detail response is stored independently of list responses. Matching ticket IDs inside those results do not create automatic shared object identity.

### 7.3 Pagination and filter encoding

`getUserTickets` takes an interface named `GetUsersParams`, although it contains ticket filters. The name is misleading; its actual fields are page, page size, status, priority, sort, and direction.

Current query builder:

```ts
query: ({
  page = 0,
  pageSize = 25,
  status = "",
  priority = "",
  sort,
  direction,
}) => {
  status = status === "All" ? "" : status;
  priority = priority === "All" ? "" : priority;
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(pageSize));
  if (priority) params.set("priority", priority);
  if (status) params.set("status", status);
  if (sort) params.set("sort", sort);
  if (direction) params.set("direction", direction);
  return `/ticket/mine?${params.toString()}`;
},
```

`URLSearchParams` handles query-string encoding. The frontend field `pageSize` becomes the backend parameter `size`. Empty filters are omitted, so the UI's “All” selection does not become a literal filter value sent to the backend.

The argument type's fields are optional, but the argument itself is an object. Callers can pass `{}` to use endpoint defaults; this is not a `void` endpoint. The ticket table passes an initial page size of 10, overriding the endpoint's default of 25. Dashboard passes 100.

### 7.4 A shared endpoint with different cached results

[Tickets.tsx](src/components/Tickets/Tickets.tsx) passes current pagination, sorting, and filters. [Dashboard.tsx](src/components/Dashboard/Dashboard.tsx) passes page 0, size 100, and creation-date sorting. These are different arguments and therefore different cache entries.

[Reports.tsx](src/components/Reports/Reports.tsx) uses `getTickets`, a different endpoint hitting `/ticket/all`. The frontend treats this response as the report ticket collection; actual server authorization and completeness remain backend responsibilities.

The dashboard computes several metrics from `data.content`, meaning at most the returned page of 100 tickets. `totalElements` can represent a larger result set, but it does not make status counts computed over that page complete across all pages.

### 7.5 Status updates: why use invalidation

Current mutation:

```ts
updateTicketStatus: builder.mutation<
  Ticket,
  { ticketId: number; status: Ticket["status"] }
>({
  query: ({ ticketId, status }) => ({
    url: `/ticket/${ticketId}/status`,
    method: "PATCH",
    body: { status },
  }),
  transformResponse: (response: ApiResponse<Ticket>) => response.data,
  invalidatesTags: ["Tickets"],
}),
```

The caller awaits `updateStatus(...).unwrap()` and displays a local management error on failure. Its select is disabled using `isUpdatingStatus` while the mutation is pending.

A status change may affect the detail screen, a status-filtered list, dashboard counts, and reports. Refreshing matching queries delegates those calculations to their existing query flows. Although the mutation returns a `Ticket`, this code does not manually replace ticket objects in those cached queries.

The broad tag makes the dependency easy to express. It can also refetch more ticket entries than necessary, and their requests participate in the global loader.

### 7.6 Assignment and assignee dependencies

`updateTicketAssignee` sends `{ assigneeId }` with a PATCH. `TicketDetails` converts an HTML select's string value to a number; an empty value becomes `null` for unassignment.

`getTicketAssignees` provides `Users`, not `Tickets`, because the available assignees are a user-dependent collection. Creating or changing a user's status/role can make that collection outdated. The shared API lets user mutations invalidate the ticket module's assignee query.

The component skips this query when `canManage` is false. That avoids loading management-only data for a screen that cannot show those controls. Frontend permission checks shape UI and requests; the backend must still authorize each operation.

### 7.7 Creation: payload conversion and the missing refresh link

[TicketForm.tsx](src/components/Tickets/TicketForm.tsx) trims text, uppercases category and priority, and converts selected asset rows into `affectedAssetIds`. It then awaits `createTicket(payload).unwrap()`.

The full response envelope is preserved because the form checks `response.statusCode === 201` before opening the success modal. Closing that modal navigates to `/tickets`.

The current mutation has **no `invalidatesTags`**. There is no manual ticket-cache patch or explicit ticket-list refetch in this creation flow. Returning to a retained list entry can therefore show the list from before creation. Navigating away and back is not a guarantee of a new network request.

Suggested improvement, not applied to the application:

```ts
// Add to createTicket's endpoint definition.
invalidatesTags: ["Tickets"],
```

That would align ticket creation with asset and user creation. The form also has no local `try/catch` around its unwrapped mutation, so failures outside the wrapper's global branches do not receive a form-specific message here.

**Key takeaways:** Ticket reads have separate identities but share a broad dependency tag. Status and assignment refresh those dependencies. Creation currently omits that connection.

<a id="comments"></a>

## 8. Comments: dependent reads and refreshing after writes

Sources: [commentApi.ts](src/services/comments/commentApi.ts) and [TicketDetails.tsx](src/components/Tickets/TicketDetails.tsx).

### 8.1 The two endpoints

| Endpoint / hook | Request | Argument → result | Tags |
| --- | --- | --- | --- |
| `getTicketComments` / `useGetTicketCommentsQuery` | GET `/ticket/{ticketId}/comments` | Ticket ID → `TicketComment[]` | Provides `Comments` |
| `createTicketComment` / `useCreateTicketCommentMutation` | POST `/ticket/{ticketId}/comments` | `{ ticketId, body }` → `ApiResponse<null>` | Invalidates `Comments` |

Current read definition:

```ts
getTicketComments: builder.query<TicketComment[], number>({
  query: (ticketId) => `/ticket/${ticketId}/comments`,
  transformResponse: (response: ApiResponse<TicketComment[]>) =>
    response.data,
  providesTags: ["Comments"],
}),
```

**What this is:** A query whose identity includes the ticket ID, returning the conversation for that ticket.

**Why it fits here:** Comments have their own loading, error, and refresh lifecycle. A comment submission can refresh the conversation without inherently refreshing all ticket fields. The detail component has separate retry buttons and states for its ticket and comments queries.

### 8.2 The same URL can describe different operations

The POST mutation uses the ticket ID in the URL and `{ body }` as the JSON body. The outer argument's `body` property is the comment text; the request description's `body` property is the object that will be serialized as JSON.

Illustrative request for a caller argument `{ ticketId: 42, body: "Checking the device." }`:

```http
POST /ticket/42/comments
Content-Type: application/json

{ "body": "Checking the device." }
```

The result is typed as `ApiResponse<null>`. There is no returned comment object for the component to append. The mutation's invalidation prompts a query to obtain the server's resulting conversation, including generated IDs, author information, and timestamps.

### 8.3 Form submission and query dependency

Current submission excerpt:

```tsx
try {
  await createComment({ ticketId, body: body.trim() }).unwrap();
  reset();
} catch (error) {
  setCommentError(getErrorMessage(error, "Unable to post the comment."));
}
```

The form resets after the mutation succeeds; it does not wait for every invalidated query to finish refetching. The refreshed comment list can arrive after the input has cleared. While the mutation runs, `isPostingComment` disables the Post button and changes its label.

The ticket and comment queries are both enabled by a valid route ID. The comment query does not wait for the ticket query's success; the two can start concurrently. “Dependent” here means dependent on the route argument, not necessarily a waterfall of HTTP requests.

### 8.4 Comments and reading notifications

The detail screen's effect calls `markTicketNotificationsRead(ticketId)` once its validity/loading/error guards allow it. The effect also observes comment count and the URL hash. A `#comment-{id}` hash lets it scroll to and focus the referenced comment.

That effect connects two feature modules: comments determine when the conversation is available, while a notification mutation marks relevant alerts read. It catches and ignores the unwrapped marking error locally; the API wrapper still applies its selected global error rules.

The effect can run more than once as dependencies change. It is not a guaranteed “exactly once per ticket view” operation. Also, its current use of `isLoading` and `data` means a route change with retained prior data deserves care, as discussed in Section 15.

### 8.5 Broad comment invalidation

The cache entry for ticket 42's comments differs from ticket 43's comments, but both provide the same broad `Comments` tag. Posting to one ticket can invalidate other cached comment entries too. Ticket-specific tags would narrow that behavior.

Creating a comment does not directly invalidate `Tickets` or `Notifications`. The backend may create alerts as a side effect, but the current frontend discovers alert changes through its notification polling and separate mark-read operations.

**Key takeaways:** Comments have their own cache entry and lifecycle. The write returns no new comment entity, so refetching is a natural fit. Route IDs determine query identity; broad tags determine the reach of invalidation.

<a id="assets"></a>

## 9. Assets: filtered inventory and assignment

Source: [assetApi.ts](src/services/assets/assetApi.ts).

### 9.1 Complete endpoint inventory

| Endpoint / hook | Request | Argument → result | Tags |
| --- | --- | --- | --- |
| `getAssets` / `useGetAssetsQuery` | GET `assets/mine` | `void` → `ApiResponse<Asset[]>` | Provides `Assets` |
| `getAllAssets` / `useGetAllAssetsQuery` | GET `/assets/all` with filters | Status/type object → `Asset[]` | Provides `Assets` |
| `getAssetAssignees` / `useGetAssetAssigneesQuery` | GET `/assets/assignees` | `void` → `AssetAssignee[]` | Provides `Users` |
| `createAsset` / `useCreateAssetMutation` | POST `/assets` | `CreateAssetRequest` → `Asset` | Invalidates `Assets` |
| `assignAsset` / `useAssignAssetMutation` | PATCH `/assets/{assetId}/assign` | ID and nullable assigned-user ID → `Asset` | Invalidates `Assets` |

### 9.2 Personal assets for ticket creation

`getAssets` retains the API envelope:

```ts
getAssets: builder.query<ApiResponse<Asset[]>, void>({
  query: () => "assets/mine",
  providesTags: ["Assets"],
}),
```

In [TicketFormDetails.tsx](src/components/Tickets/TicketFormDetails.tsx):

```tsx
const {
  data: assetsResponse,
  isLoading: areAssetsLoading,
  isError: didAssetsFail,
  refetch: refetchAssets,
} = useGetAssetsQuery();

const assignedAssets = assetsResponse?.data ?? [];
```

**Why this fits:** The ticket form needs the current user's available assets so an issue can reference affected devices or licenses. Once fetched, text matching and removal of already-selected assets happen locally over this array. Typing a search term does not trigger a separate RTK Query request because that search term is not a query argument.

The parent ticket form keeps its step components mounted and changes their presentation and pointer interaction. Therefore, this hook can subscribe when the form mounts, even before the user actively works on the Details step. CSS disabling is not query skipping.

### 9.3 Inventory filtering

`getAllAssets` translates `"All"` into an absent filter and replaces spaces in status values with underscores before adding them to the URL. It unwraps the backend envelope into an `Asset[]`.

[Assets.tsx](src/components/Assets/Assets.tsx) holds `status` and `type` in React state and passes them to the hook. Changing those values selects the corresponding cache entry and fetches it when needed. There is no separate filtering effect that manually calls `fetch`.

The asset service also names this filter interface `GetUsersParams`; its actual meaning is asset filter parameters. Unlike the user and ticket list queries, this endpoint returns an array and has no page/size arguments in the current code.

### 9.4 Asset creation

[CreateAssetModal.tsx](src/components/Assets/CreateAssetModal.tsx) prepares the input by uppercasing and trimming the tag, trimming the model, and mapping an empty warranty date to `null`. It awaits the mutation and calls `onCreated(createdAsset)` with the transformed `Asset`.

The parent closes the modal, records a success label, and selects the new asset's ID. It does not append the returned asset to a local inventory copy. `invalidatesTags: ["Assets"]` refreshes the active inventory query, and the selected object is derived from that query's array.

If active filters exclude the created asset, the refreshed array may not contain it. Selecting its ID cannot make the backend's filtered result include it. This is a UI/filter consequence, not a failure of mutation unwrapping.

### 9.5 Assignment and parent-derived detail data

Current assignment definition:

```ts
assignAsset: builder.mutation<
  Asset,
  { assetId: number; assignedToId: number | null }
>({
  query: ({ assetId, assignedToId }) => ({
    url: `/assets/${assetId}/assign`,
    method: "PATCH",
    body: { assignedToId },
  }),
  transformResponse: (response: ApiResponse<Asset>) => response.data,
  invalidatesTags: ["Assets"],
}),
```

[AssetDetails.tsx](src/components/Assets/AssetDetails.tsx) gets its selected asset through props from the inventory array. It has no `getAsset(id)` endpoint. Its own query loads possible assignees, and its mutation changes the assignment.

After a successful mutation and inventory refresh, the parent supplies the refreshed asset object. The child's React `key` includes the asset ID and assigned-user ID, so an assignment change remounts it and initializes its local select state from the refreshed assignment.

`null` represents unassignment. Both inventory and personal-assets entries provide `Assets`, because assigning an asset can affect which user should see it in a personal list. Possible assignees provide `Users`, because that option set depends on users.

**Key takeaways:** The inventory query is the source of the detail panel's asset data. Mutations refresh that source through tags, while local state tracks selections and forms. The personal-assets response deliberately has a different shape in the current code.

<a id="users"></a>

## 10. Users and settings: administration and local identity

Source: [userApi.ts](src/services/users/userApi.ts).

### 10.1 Complete endpoint inventory

| Endpoint / hook | Request | Argument → result | Tags |
| --- | --- | --- | --- |
| `getUsers` / `useGetUsersQuery` | GET `/user/all` with parameters | Page/role/sort object → `UsersResponse` | Provides `Users` |
| `createUser` / `useCreateUserMutation` | POST `/auth/register` | `CreateUserRequest` → `CreatedUser` | Invalidates `Users` |
| `updateUser` / `useUpdateUserMutation` | PUT `/user/{id}` | `UpdateUserRequest` → `ApiResponse<User>` | Invalidates `Users` |
| `updateProfile` / `useUpdateProfileMutation` | PUT `/user/me/profile` | `{ name }` → `ApiResponse<User>` | Invalidates `Users` |
| `changePassword` / `useChangePasswordMutation` | PUT `/user/me/password` | Current/new/confirmed password → `ApiResponse<null>` | None |

### 10.2 User listing

`getUsers` follows the same pagination pattern as tickets: page defaults to 0, page size to 25, and `pageSize` is sent as `size`. The UI's `"All"` role omits the role parameter. Sort and direction are only included when truthy.

[Users.tsx](src/components/Users/Users.tsx) gets the role from `useWatch`, holds pagination and sort in React state, and reads `data?.content || []`. The role selector resets the page to zero, preventing a filter change from automatically keeping an unrelated high page number.

Reports uses the same endpoint with page 0, size 100, and role `agent` to build an agent-name lookup. That argument differs from the users table's argument, so the two use different cache entries. The lookup is limited to the returned page.

### 10.3 Creating a user

[CreateUserModal.tsx](src/components/Users/CreateUserModal.tsx) translates form values into the backend request: it trims the name and mobile number, lowercases and trims the email, and maps the form's `password` to the backend field `pwd`. Confirmation is for form validation and is not included in this creation payload.

The endpoint returns the transformed `CreatedUser`, defined as `Pick<User, "id" | "name" | "email">`. The parent uses its name for success feedback, closes the modal, and moves to page zero. The `Users` invalidation handles refreshing server data.

That invalidation also reaches the ticket and asset assignee queries. This is a concrete reason to share an API service and dependency vocabulary across otherwise separate feature files.

### 10.4 Updating a user

Current request builder:

```ts
query: ({ id, ...user }) => ({
  url: `/user/${id}`,
  method: "PUT",
  body: user,
}),
```

**What it does:** Destructuring separates the routing identifier from the editable body. The URL carries the ID; the remaining name, email, role, and status fields form the payload.

[EditUserModal.tsx](src/components/Users/EditUserModal.tsx) initializes form values from the selected user, awaits `.unwrap()`, and closes after success. It does not consume the returned envelope or manually mutate the users array. Tag invalidation refreshes it.

The edit form is a local editable snapshot. Changes to form fields are not edits to RTK Query's cached object.

### 10.5 Profile update requires two synchronization paths

In [Settings.tsx](src/components/Settings/Settings.tsx), a successful profile update preserves the full envelope. The component merges `response.data` into its current user, normalizes the role, calls `authStorage.updateUser`, resets the form, and displays success feedback.

```text
updateProfile succeeds
  |
  +-- Users tag invalidation
  |     refreshes matching server-data queries
  |
  +-- authStorage.updateUser(updatedUser)
        updates stored identity
        emits AUTH_USER_CHANGED_EVENT
        LoggedInUser refreshes its local display
```

The top-bar identity in [LoggedInUser.tsx](src/components/Util/LoggedInUser.tsx) reads browser storage and listens for events. It is not subscribed to `getUsers`. This is why invalidation alone would not update that display.

### 10.6 Password change

The password mutation sends all three password fields, awaits success, resets its form, and shows feedback. It declares no invalidation. No password-based query result is displayed in the reviewed UI, so there is no obvious cached collection to refresh for this operation.

The frontend does not clear or replace tokens after this mutation. Whether password changes affect server-side sessions cannot be determined from this endpoint declaration alone.

**Key takeaways:** User tags connect administration to assignee option lists. Updating the stored signed-in profile requires an explicit storage operation in addition to API invalidation. Password changes do not automatically require query invalidation.

<a id="notifications"></a>

## 11. Notifications: polling, optimistic updates, and rollback

Sources: [notificationApi.ts](src/services/notifications/notificationApi.ts), [NotificationBell.tsx](src/components/Notifications/NotificationBell.tsx), and [notification.ts](src/types/notification.ts).

### 11.1 Complete endpoint inventory

Every endpoint in this table suppresses the global loader.

| Endpoint / hook | Request | Result | Cache behavior |
| --- | --- | --- | --- |
| `getNotifications` / `useGetNotificationsQuery` | GET `/notifications?page=0&size=20` | `NotificationsResponse` | Provides `LIST` and `COUNT` notification tags |
| `getUnreadNotificationCount` / `useGetUnreadNotificationCountQuery` | GET `/notifications/unread-count` | `number` | Provides `COUNT` |
| `markNotificationRead` / `useMarkNotificationReadMutation` | PATCH `/notifications/{notificationId}/read` | `void` | Optimistic list/count edits; invalidates both tags |
| `markTicketNotificationsRead` / `useMarkTicketNotificationsReadMutation` | PATCH `/notifications/ticket/{ticketId}/read` | `void` | Invalidates both tags; no optimistic recipe |
| `markAllNotificationsRead` / `useMarkAllNotificationsReadMutation` | PATCH `/notifications/read-all` | `void` | Optimistic list/count edits; invalidates both tags |

### 11.2 Why the badge and list are separate queries

The badge needs one number throughout the authenticated layout. The dropdown needs a page of notifications only when opened. Separate queries let the count stay active while the list is skipped.

The count endpoint transforms `ApiResponse<{ count: number }>` into a number. The list transforms its envelope into a paginated response whose `content` is an array. Its request is fixed to page zero with size 20; no hook argument currently requests subsequent pages.

The total unread count can exceed the number of visible notifications. This explains why “mark all read” needs a server operation covering all notifications, even though the optimistic list recipe only visits the currently cached page.

### 11.3 The polling subscription

Current badge query:

```tsx
const { data: unreadCount = 0 } = useGetUnreadNotificationCountQuery(
  undefined,
  {
    pollingInterval: 15_000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  },
);
```

`undefined` is the no-argument endpoint input. The second object configures the subscription. The count starts when `NotificationBell` mounts, which happens through `TopNavBar` inside the protected layout.

Fifteen seconds is the configured polling interval, not a guaranteed deadline for new notifications to appear. Request time, browser scheduling, focus, and connectivity affect when responses arrive. Focus and reconnect refreshes help update a view returning from inactivity.

The count's fallback is zero before data arrives. The component does not provide a dedicated count-query error display. If the request fails, a missing badge can therefore be visually ambiguous without inspecting query state or network activity.

### 11.4 The conditionally active list

Current list options:

```tsx
useGetNotificationsQuery(undefined, {
  skip: !isOpen,
  pollingInterval: 15_000,
  skipPollingIfUnfocused: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: true,
});
```

Closing the menu removes this hook's active list subscription. The list can remain cached for the normal retention period, unless invalidation removes it first. Its polling stops when there are no relevant subscribers.

Reopening enables the subscription again. `refetchOnMountOrArgChange: true` requests fresh list data even if retained data exists. The component uses `isLoading` for the first-load message, `isError` for a failure panel, and `refetch` for Retry.

### 11.5 The tag declarations have a specific overlap

Current shared constant:

```ts
const notificationTags = [
  { type: "Notifications" as const, id: "LIST" },
  { type: "Notifications" as const, id: "COUNT" },
];
```

`as const` keeps the tag type as the literal `"Notifications"` for TypeScript instead of a general string. The list provides this entire array; the count provides just `COUNT`.

Therefore the current dependencies are:

| Invalidated notification ID | Queries that match |
| --- | --- |
| `LIST` | Notification list |
| `COUNT` | Notification list and unread count |
| Both | Notification list and unread count |

The names can suggest more independence than the declarations provide. The implementation currently invalidates both after all three mark-read operations anyway.

### 11.6 Single-notification optimistic update

Current lifecycle callback, with formatting condensed:

```ts
async onQueryStarted(notificationId, { dispatch, queryFulfilled }) {
  const countPatch = dispatch(
    notificationApi.util.updateQueryData(
      "getUnreadNotificationCount",
      undefined,
      (count) => Math.max(0, count - 1),
    ),
  );
  const listPatch = dispatch(
    notificationApi.util.updateQueryData(
      "getNotifications",
      undefined,
      (notifications) => {
        const notification = notifications.content.find(
          (item) => item.id === notificationId,
        );
        if (notification) notification.read = true;
      },
    ),
  );
  try {
    await queryFulfilled;
  } catch {
    countPatch.undo();
    listPatch.undo();
  }
},
```

**What this is:** A mutation lifecycle callback that coordinates two existing query-cache entries while one write is pending.

**Why it fits here:** Reading an alert should immediately affect its highlight and the badge. Waiting for a PATCH response and two subsequent GET responses would make that simple interaction feel slower.

**How to read it:**

1. The callback receives the notification ID supplied to the mutation trigger.
2. `dispatch(updateQueryData(...))` updates the matching cached count and returns a patch handle.
3. A second dispatch locates the notification in the cached list and marks its `read` property true.
4. The callback waits for the real mutation result through `queryFulfilled`.
5. Failure attempts to undo both patches; success leaves them in place until server synchronization.

These endpoint names identify query results, not mutation results. `undefined` must match the no-argument queries. If the list cache does not exist, its update recipe does not create or fetch a list. The operation can still update the count independently if that entry exists.

The recipe updates `read`, not `readAt`. It cannot know the server's authoritative timestamp. A later list response supplies the server state.

### 11.7 Why return a number but mutate the list draft

The count cache contains a primitive, so its recipe returns a replacement number. `Math.max` keeps the optimistic badge from becoming negative. The list cache contains an object with a `content` array, so its recipe uses Immer's mutable draft syntax.

The patch handles contain the information required for the inverse update. `.undo()` reverses the corresponding cache patch; it does not send another HTTP request to undo a backend operation.

This behavior is confirmed by the installed `updateQueryData` implementation in Redux Toolkit's `src/query/core/buildThunks.ts` and documented in [API cache utilities](https://redux-toolkit.js.org/rtk-query/api/created-api/api-slice-utils).

### 11.8 Why invalidate after patching

Both optimistic mutations also declare:

```ts
invalidatesTags: notificationTags,
```

Optimistic edits improve immediate feedback, while invalidation reconciles the cache with the server. Other notifications could arrive, another action could change the count, and the server may supply timestamps or other updated fields.

If the dropdown is closed before invalidation is processed, its inactive list entry can be removed instead of fetched. The count remains subscribed through the bell and can refetch. Opening the menu later obtains a list again.

The static tag declaration is not a success-only condition. With the installed middleware, fulfilled mutations and normal base-query failures rejected with a value can both cause these tags to be invalidated. An unexpected thrown failure follows a different path. If success-only invalidation were desired, the endpoint would need a callback that checks `error`.

### 11.9 Marking all notifications read

`markAllNotificationsRead` uses the same structure, but replaces the count with zero and sets every cached notification's `read` field to true. The server PATCH is responsible for notifications beyond the first cached page.

The component calls `await markAllRead().unwrap()` and disables the button through `isMarkingAllRead`. Its catch block adds no local failure message. The lifecycle callback performs rollback; the shared wrapper handles only the error categories described earlier.

### 11.10 Marking notifications for a ticket

`markTicketNotificationsRead(ticketId)` only sends the PATCH and invalidates tags. It has no optimistic callback. A ticket may have unread alerts outside the cached page, so a precise optimistic decrement could not be derived from that page alone. Refetching avoids guessing that count in this flow.

`TicketDetails` invokes this operation when its effect runs. This is separate from `markNotificationRead`, which the bell triggers for a single clicked alert.

### 11.11 Navigation without waiting for the PATCH

Current click handler:

```tsx
if (!notification.read) {
  void markNotificationRead(notification.id);
}
setIsOpen(false);
navigate(
  `/tickets/${notification.ticketId}#comment-${notification.commentId}`,
);
```

The user navigates immediately. `void` intentionally discards the returned trigger promise; it does not prevent the request or lifecycle callback from running. There is no `.unwrap()` here because navigation does not wait for the result. The destination may separately trigger the ticket-wide marking mutation.

### 11.12 Concurrency limits of optimistic state

The count decrement assumes this operation transitions an unread notification to read. The component checks `!notification.read`, but the endpoint callback itself does not verify a server transition or protect against all duplicate and concurrent calls.

Overlapping mutations, polling responses, and rollback can temporarily disagree. For example, undoing an older primitive count patch can restore a value that predates a later operation. Tag invalidation provides a reconciliation mechanism, but an unsuccessful refetch cannot guarantee immediate accuracy. The official [optimistic-update guidance](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates) discusses this overlap risk.

**Key takeaways:** Notifications combine three mechanisms for three needs: polling discovers external changes, optimistic patches give immediate feedback, and invalidation resynchronizes with the server. Each mechanism has its own lifecycle and limits.

<a id="react-usage"></a>

## 12. React hook usage, pagination, and derived UI data

### 12.1 All direct component consumers

This inventory connects every exported endpoint hook to its direct consumer. Supporting layout, storage, and modal files are covered in earlier chapters.

| Component | Endpoint hooks used | UI responsibility |
| --- | --- | --- |
| [Login](src/components/Login/Login.tsx) | `login` | Submit credentials, save identity, reset API state |
| [SessionExpiryWarning](src/components/Login/SessionExpiryWarning.tsx) | `refreshSession` | Extend the current session |
| [Tickets](src/components/Tickets/Tickets.tsx) | `getUserTickets` | Server pagination, filters, sorting |
| [Dashboard](src/components/Dashboard/Dashboard.tsx) | `getUserTickets` | Derive metrics and recent tickets from one page |
| [Reports](src/components/Reports/Reports.tsx) | `getTickets`, `getUsers` | Derive time-range metrics and agent names |
| [TicketDetails](src/components/Tickets/TicketDetails.tsx) | `getTicket`, `getTicketComments`, `getTicketAssignees`, `updateTicketStatus`, `updateTicketAssignee`, `createTicketComment`, `markTicketNotificationsRead` | Detail reads, management actions, discussion, alert-read effect |
| [TicketForm](src/components/Tickets/TicketForm.tsx) | `createTicket` | Prepare and submit ticket payload |
| [TicketFormDetails](src/components/Tickets/TicketFormDetails.tsx) | `getAssets` | Read personal assets for local matching |
| [Assets](src/components/Assets/Assets.tsx) | `getAllAssets` | Filter inventory and derive selected asset |
| [AssetDetails](src/components/Assets/AssetDetails.tsx) | `getAssetAssignees`, `assignAsset` | Edit assignment |
| [CreateAssetModal](src/components/Assets/CreateAssetModal.tsx) | `createAsset` | Submit creation form |
| [Users](src/components/Users/Users.tsx) | `getUsers` | Paginated user administration |
| [CreateUserModal](src/components/Users/CreateUserModal.tsx) | `createUser` | Create a user |
| [EditUserModal](src/components/Users/EditUserModal.tsx) | `updateUser` | Edit a user |
| [Settings](src/components/Settings/Settings.tsx) | `updateProfile`, `changePassword` | Submit account settings forms |
| [NotificationBell](src/components/Notifications/NotificationBell.tsx) | `getNotifications`, `getUnreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead` | Badge, dropdown, polling, and click actions |

### 12.2 Why changing table state can fetch data without an effect

The ticket table passes its state directly into the hook:

```tsx
const { data } = useGetUserTicketsQuery({
  page: page,
  pageSize: Number(pageSize),
  status: status,
  priority: priority,
  sort: sort.key,
  direction: sort.direction,
});
```

The DataGrid invokes state setters supplied by the parent. Updated values change the query argument, and the hook selects the corresponding entry. If that entry needs loading, RTK Query executes the request.

The page size is stored as a string because it comes from form controls, then converted to a number to match the service contract. The endpoint turns it into a string again when constructing the URL. Those conversions happen at different boundaries: UI input, typed API argument, and HTTP query string.

Ticket status/priority filters and the user-role filter reset the page. The reviewed DataGrid's page-size handler directly uses `onPageSizeChange`; it does not also reset the page. This is a pagination behavior to consider separately from caching.

### 12.3 Server filtering versus local derivation

| Interaction | Network argument changes? | Current behavior |
| --- | --- | --- |
| Change ticket status/priority filter | Yes | Select another ticket-page cache entry |
| Change user role/page/sort | Yes | Select another user-page entry |
| Change asset status/type | Yes | Select another inventory entry |
| Type in ticket form's asset picker | No | Search the already-fetched personal-assets array |
| Change report date range | No | Recompute report data locally with `useMemo` |
| Select an inventory row | No | Find the selected asset in the current array |

`useMemo` in Reports optimizes local calculation. It does not create an RTK Query cache entry, set freshness policy, or refetch the report's underlying tickets.

### 12.4 Awaiting mutations and form state

For ordinary failures, a trigger without `.unwrap()` resolves to an object containing `data` or `error`. The installed mutation trigger implementation converts request rejection into that result form. A `try/catch` around only `await trigger(arg)` is therefore not equivalent to catching an unwrapped endpoint failure.

Pulse's awaited forms mostly use:

```tsx
// Illustrative pattern matching the project's forms.
try {
  const result = await trigger(payload).unwrap();
  // Close, reset, navigate, or display success using the endpoint result.
} catch (error) {
  // Map the failure to a local message.
}
```

React Hook Form's `isSubmitting` covers the async submit handler while it awaits the trigger. RTK Query's mutation `isLoading` covers the operation itself. The project uses the former in several forms and the latter in ticket controls, assignment controls, and notification actions.

### 12.5 Defaults are presentation choices

`data?.content || []`, `data ?? []`, and `data: unreadCount = 0` avoid rendering errors before responses arrive. They do not prove a query succeeded.

The ticket, user, asset, dashboard, and report top-level views primarily consume `data`, while several detail/form views expose explicit query errors and retry actions. For failures that do not trigger the global modal, an empty collection or zero metric can look like a valid empty result. Query state should be considered alongside fallback values when improving those screens.

**Key takeaways:** Hook arguments express server-data needs; local state expresses UI choices. Form submission state, query loading state, and global loading state are separate signals with different scopes.

<a id="invalidation"></a>

## 13. The complete cache invalidation map

### 13.1 Every provided dependency

| Tag | Query entries providing it |
| --- | --- |
| `Users` | Every `getUsers(arg)`, `getTicketAssignees(undefined)`, `getAssetAssignees(undefined)` |
| `Tickets` | `getTickets(undefined)`, every `getUserTickets(arg)`, every `getTicket(id)` |
| `Assets` | `getAssets(undefined)`, every `getAllAssets(arg)` |
| `Comments` | Every `getTicketComments(ticketId)` |
| `Notifications / LIST` | `getNotifications(undefined)` |
| `Notifications / COUNT` | `getNotifications(undefined)` and `getUnreadNotificationCount(undefined)` |
| `Auth` | None |

### 13.2 Every mutation's declared invalidation

| Mutation(s) | Invalidated dependencies |
| --- | --- |
| `login`, `refreshSession` | None; successful login separately dispatches an API reset in its component |
| `updateTicketStatus`, `updateTicketAssignee` | `Tickets` |
| `createTicket` | None |
| `createTicketComment` | `Comments` |
| `createAsset`, `assignAsset` | `Assets` |
| `createUser`, `updateUser`, `updateProfile` | `Users` |
| `changePassword` | None |
| `markNotificationRead`, `markTicketNotificationsRead`, `markAllNotificationsRead` | Both notification IDs: `LIST` and `COUNT` |

### 13.3 Invalidation with and without subscribers

Suppose the following entries exist when a status mutation invalidates `Tickets`:

```text
getTicket(42)             active detail subscription
getUserTickets(page 0)    retained cache, no subscriber
getTickets(undefined)    retained report cache, no subscriber
```

When the invalidation is processed, the active detail entry is refetched. The two inactive entries are removed. Their screens will need data again when they next subscribe. RTK Query does not proactively fetch every route merely because it has once loaded that route's data.

The relevant installed middleware is `src/query/core/buildMiddleware/invalidationByTags.ts`. It looks up matching entries and examines their subscription counts. This is the runtime mechanism behind the project's broad tag strategy.

### 13.4 Delayed invalidation in the installed version

Pulse does not set `invalidationBehavior`, so it inherits `"delayed"`. The installed middleware queues invalidated tags while requests in that API remain pending and processes the accumulated tags once the pending work settles.

This means a mutation's `.unwrap()` resolving is not a guarantee that every affected query has already refetched. A concurrent request can delay processing, and the later GET requests also take time. A continuously pending request can delay invalidation substantially. See the [createApi invalidation setting](https://redux-toolkit.js.org/rtk-query/api/createApi#invalidationbehavior).

### 13.5 What shared tags do not imply

`Users` appears on both user lists and assignee lists, but their cached response arrays remain separate. A user query being fulfilled does not copy its rows into the assignee queries.

Likewise, the notification count query provides `COUNT`, but a polling response for that query does not invalidate `COUNT`. Providing a tag records a dependency; it does not broadcast a change. The list has its own polling and mutation-triggered refreshes.

Finally, `Users` invalidation does not match `Tickets` or `Comments`. If a ticket response embeds an assignee name or a comment embeds an author name, changing that user's name does not automatically refresh those embedded fields under the current tag map.

**Key takeaways:** Read both sides of every dependency: who provides the tag and who invalidates it. Then consider subscriptions and timing. Shared tags do not normalize data or make successful reads invalidate other reads.

<a id="walkthroughs"></a>

## 14. End-to-end request walkthroughs

### 14.1 Opening a valid ticket without a cached response

1. `/tickets/42` renders `TicketDetails`. The route ID becomes the number 42 and passes validation.
2. The component subscribes to `getTicket(42)` and `getTicketComments(42)`. If management is available, it also subscribes to `getTicketAssignees(undefined)`.
3. RTK Query checks the independent entries and initiates any required requests.
4. Each endpoint builds its own request description. The shared wrapper increments the loader counter for each executing request.
5. Header preparation reads the current access token. `fetchBaseQuery` sends the request and parses the response.
6. The wrapper handles selected global errors if needed, returns the result, and decrements the counter.
7. Successful endpoint transforms extract ticket, comment, or assignee data. RTK Query stores each result and its tags.
8. Hook subscribers render the updated data. The global overlay disappears when the participating request count reaches zero.
9. Once its guards allow it, the comment-related effect sends the ticket-wide notification-read mutation and may focus a comment from the URL hash.

The requests in step 2 are independent once their inputs are known. The loader counter is what lets concurrent requests share one overlay coherently.

### 14.2 Changing a ticket's status

```text
Select a status
  -> updateStatus({ ticketId: 42, status: "RESOLVED" })
  -> PATCH /ticket/42/status
  -> receive transformed mutation result
  -> invalidate Tickets when pending API work permits
  -> refetch subscribed matching ticket queries
  -> rerender detail/list/metrics from their query results
```

The status select's value comes from query data. There is no optimistic ticket patch in this flow, so the mutation's returned ticket is not itself the source used to redraw the select. The subsequent detail-query result supplies the refreshed status.

### 14.3 Creating an asset while the inventory is visible

1. The modal validates and converts its form values.
2. `createAsset(payload).unwrap()` sends POST `/assets`.
3. The endpoint transform exposes the created `Asset` to the form.
4. The creation callback closes the modal, shows the tag in a success message, and records the new asset ID as selected.
5. `Assets` invalidation refreshes the subscribed inventory query.
6. The parent derives `selectedAsset` from the refreshed array and passes it to `AssetDetails`, if the array includes it.

The callback and invalidation have different jobs: the callback changes presentation, while invalidation refreshes the authoritative inventory data.

### 14.4 Clicking an unread notification

1. The click handler sees `read === false` and triggers `markNotificationRead(id)`.
2. `onQueryStarted` immediately patches the cached badge and cached list where those entries exist.
3. The menu closes and navigation proceeds to the ticket/comment URL without awaiting the PATCH.
4. Success retains the optimistic edits; failure attempts to undo them.
5. Declared notification invalidation processes once pending API requests settle.
6. The active badge query refetches. The now-inactive list entry may be removed.
7. The ticket screen may also mark all notifications for that ticket read through its own effect.
8. A later menu opening subscribes to and refreshes the notification list.

This example shows why UI navigation, query subscription lifetime, and mutation lifetime must be understood separately.

### 14.5 A protected request fails with HTTP 401

For a response body that passes the project's guard:

```text
Protected request returns 401
  -> wrapper dispatches session-expired modal
  -> request remains a failed RTK Query result
  -> local caller may also render an error
  -> user closes the global modal
  -> Modal clears authStorage and navigates to login
```

There is no refresh-and-retry step in this path. A 401 from the login or refresh URL is excluded from that particular global modal branch so its component can handle it locally.

**Key takeaways:** Follow the endpoint argument, request description, base query, transform, cache, and hook result in order. For writes, add the separate invalidation or optimistic-update path.

<a id="limitations"></a>

## 15. Current limitations and suggested improvements

These are observations from source inspection and consequences of the configured RTK Query behavior. They are not claims of reproduced production incidents. No application source changes were made for this guide.

### 15.1 Ticket creation can leave retained lists stale

**Evidence:** `createTicket` has no invalidation; `TicketForm` navigates through a success modal; ordinary ticket queries do not force a refetch on mount.

**Consequence:** A quick return to a retained ticket-list argument can reuse its pre-creation result.

**Suggested improvement:** Add `Tickets` invalidation, following asset/user creation. If invalidation should happen only on a successful request, use an error-aware callback rather than assuming a static tag array is success-only.

### 15.2 Broad tags can cause extra work

**Evidence:** All ticket detail/list entries provide `Tickets`; all comment entries provide `Comments`.

**Consequence:** A small write can invalidate unrelated entries of the same broad type. Refetches of active regular queries also participate in the global overlay.

**Suggested improvement:** Introduce entity or collection-specific IDs when there is a concrete need to narrow invalidation. For comments, the ticket ID is a natural grouping key:

```ts
// Suggested replacement in getTicketComments.
providesTags: (_result, _error, ticketId) => [
  { type: "Comments", id: ticketId },
],

// Suggested replacement in createTicketComment.
invalidatesTags: (_result, error, { ticketId }) =>
  error ? [] : [{ type: "Comments", id: ticketId }],
```

Both sides must change together. Invalidating a specific ID does not match a query that only provides the general string tag. This illustrative callback also deliberately chooses success-only invalidation.

For paginated tickets, detail IDs alone are insufficient: creation and status changes can alter filtered-list membership, totals, and page boundaries. A list-level tag or another explicit collection dependency is still needed.

### 15.3 Equivalent URLs can have different cache entries

**Evidence:** `getUserTickets` and similar builders normalize `"All"` and default parameters inside `query`, after query arguments determine cache identity.

Illustrative calls using the current endpoint:

```tsx
useGetUserTicketsQuery({ page: 0, pageSize: 10, status: "All" });
useGetUserTicketsQuery({ page: 0, pageSize: 10, status: "" });
```

Both request the same unfiltered URL, but their original arguments differ. Similarly, `{}` and `{ page: 0, pageSize: 25 }` can generate the same URL without sharing an argument key.

**Suggested improvement:** Canonicalize filter arguments consistently before calling the hook, or define carefully tested serialization if multiple argument forms must share an entry. Stable object identity is not the core issue; consistent values are.

### 15.4 Logout clears identity but not API state immediately

**Evidence:** Successful login dispatches `resetApiState`. The logout, expiry, and 401-modal paths only clear storage and navigate.

**Consequence:** Cached server responses can remain in the store after identity is cleared, until normal cleanup or a later login reset.

**Suggested improvement:** Centralize session termination and explicitly clear API state there. Ensure authenticated query subscriptions are removed or disabled as part of the transition; resetting the store while authenticated consumers remain active can cause them to request data again. Clearing state also should not be treated as a universal substitute for explicitly managing in-flight operations where needed.

### 15.5 Route changes can retain data for an earlier argument

**Evidence:** `TicketDetails` renders the hooks' `data`, and its notification-read effect checks `isLoadingComments` rather than verifying current-argument comment success. The component can be reused when changing ticket IDs.

**Consequence:** During a transition, a hook may expose previous data while requesting the next ticket. Loading guards based only on `isLoading` may not mean “comments for this new ticket have successfully loaded.” The effect can therefore run before the new conversation is confirmed.

**Suggested improvement:** Where identity matters, use `currentData` and explicit current-argument success/loading guards. Reassess the effect's conditions so notification-read side effects correspond to the intended ticket's loaded state. Ordinary list views may intentionally retain old rows during a refresh; detail identity deserves separate treatment.

### 15.6 Response shapes and guards need deliberate conventions

**Evidence:** Some endpoints transform envelopes; others preserve them. `isApiResponse` only checks field presence. The project also has duplicate asset/response type names and misnamed filter interfaces.

**Consequence:** A developer can accidentally add or omit `.data`, or assume runtime validation exists when it does not.

**Suggested improvement:** Choose and document when metadata should be retained, rename filter types to their actual domains, and consolidate types where appropriate. Add runtime validation if the application needs protection from malformed payloads. Any standardization must update consuming components along with endpoint types and transforms.

### 15.7 Error presentation has gaps

**Evidence:** The global wrapper handles only guarded 401/500 cases. Several list screens consume only `data`; the ticket-creation submit handler has no local catch; some notification catches intentionally ignore the error.

**Consequence:** A 400, 403, network failure, or malformed error body may lack useful local feedback on those paths.

**Suggested improvement:** Render local query error states and catch mutations where users need actionable feedback. Keep global session/server messages for their intended cases. Avoid treating “empty result” fallbacks as proof that the request succeeded.

### 15.8 Optimistic count updates are approximations

**Evidence:** Single-read always subtracts one from an existing count; mark-all replaces it with zero; rollback uses inverse patches; multiple operations and polling can overlap.

**Consequence:** Temporary count drift or older rollback values are possible. The cached list's first page cannot fully describe all unread notifications.

**Suggested improvement:** Keep server reconciliation, prevent redundant actions where practical, and consider refetch-on-error strategies when overlapping patches become difficult to reconcile. A backend response with authoritative count information could support another design, but that would require checking or changing the backend contract.

### 15.9 Hardcoded limits affect completeness

**Evidence:** Notifications always request 20 items on page zero. Dashboard requests one page of 100 tickets. Reports requests one page of 100 agents for its name lookup.

**Consequence:** The notification menu cannot browse older pages, dashboard calculations over `content` can be partial, and some report assignee IDs may lack names in the loaded agent page.

**Suggested improvement:** Use explicit pagination or dedicated server-side aggregate/lookup contracts when completeness is required. Increasing `pageSize` alone is not a general all-records guarantee.

### 15.10 Refresh failure leaves the session timers cleared

**Evidence:** `extendSession` calls `clearTimers()` before the mutation. Successful token updates emit an event that reschedules them. Its catch block only stores an error message.

**Consequence:** After a failed extension, the earlier expiry timer has been cleared and is not immediately restored by that catch path. A later token/storage event or another action may change the state, but the failure path itself does not reschedule termination.

**Suggested improvement:** Preserve or recalculate the remaining expiry schedule when refresh fails. This belongs to the component's session lifecycle, not to automatic RTK Query reauthorization.

### 15.11 Several defaults are easy to over-assume

The current service does not configure automatic retries, an explicit fetch timeout, automatic refresh-and-replay, polling outside notifications, runtime response schemas, or query-cache persistence. `setupListeners` and `tagTypes` do not implicitly enable those features.

The active base URL remains `http://localhost:80/`; unused constants and the commented `localhost:8080` example do not change it. Environment-based configuration would be a separate improvement.

**Key takeaways:** The main learning opportunities are cache refresh after creation, tag scope, identity cleanup, response-shape consistency, and lifecycle timing. Improvements should address these specific behaviors rather than assume every advanced RTK Query feature is needed.

<a id="extension"></a>

## 16. How to add another endpoint in this project

### 16.1 Start with the contract and the consuming screen

Before writing a hook, determine the request URL, method, argument, expected HTTP errors, and successful JSON shape. Decide whether the component needs the envelope metadata or only its nested payload. Then decide which existing cached results depend on this operation.

For example, a hypothetical ticket-activity screen might need a ticket ID and an array of activity items. The following is an **illustrative extension only**. The reviewed project has no `getTicketActivity` endpoint or verified `/activity` backend contract.

```ts
import { baseApi } from "../api/baseApi";
import type { ApiResponse } from "../api/baseQuery";

interface TicketActivity {
  id: number;
  description: string;
  createdAt: string;
}

export const ticketActivityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTicketActivity: builder.query<TicketActivity[], number>({
      query: (ticketId) => `/ticket/${ticketId}/activity`,
      transformResponse: (
        response: ApiResponse<TicketActivity[]>,
      ) => response.data,
      providesTags: ["Tickets"],
    }),
  }),
});

export const { useGetTicketActivityQuery } = ticketActivityApi;
```

### 16.2 Explain each decision

`baseApi.injectEndpoints` preserves the shared HTTP configuration, middleware, store, and tag vocabulary. A new `createApi` is unnecessary for an ordinary feature using this same backend infrastructure.

`TicketActivity[]` describes what the component receives. The transformation extracts that array from the hypothetical envelope. `number` connects the input to a route-derived ticket ID.

The broad `Tickets` tag means the existing status/assignment invalidation would also refresh subscribed activity results. That is only appropriate if the activity depends on those operations. If new comments should refresh it too, that additional dependency must be expressed deliberately; naming it “ticket activity” does not create one automatically.

No loader suppression is configured in this example. The normal global loader applies. A small background activity panel might instead choose suppression and render its own local fetch states, but that choice should follow the intended UI behavior.

### 16.3 Consume the hook with current-argument guards

Illustrative component excerpt for the hypothetical endpoint:

```tsx
const isValidId = Number.isInteger(ticketId) && ticketId > 0;
const {
  currentData: activity,
  isFetching,
  isError,
  refetch,
} = useGetTicketActivityQuery(ticketId, { skip: !isValidId });

if (!isValidId) return <p>Invalid ticket.</p>;
if (isFetching && !activity) return <p>Loading activity…</p>;
if (isError) {
  return <button onClick={() => refetch()}>Retry activity</button>;
}
return <p>{activity?.length ?? 0} activity items</p>;
```

The hook is called unconditionally. `skip` expresses whether its input is ready. `currentData` avoids presenting another ticket's activity as this ticket's result during argument changes.

### 16.4 A compact endpoint-design checklist

1. Use a query for a read and a mutation for an explicit write/session action.
2. Define the argument and exposed successful result types.
3. Match transformation to the actual backend envelope and the caller's needs.
4. Keep query argument values consistent for predictable cache identity.
5. Declare query dependencies and corresponding mutation invalidations together.
6. Choose global or local loading behavior according to the UI.
7. Use `.unwrap()` when a caller needs success/failure control flow.
8. Add optimistic patches only where immediate feedback justifies rollback complexity.
9. Check invalid input, error presentation, retained cache behavior, and affected lists.

**Key takeaways:** A new endpoint is primarily a contract and dependency decision. The existing base API already supplies the shared infrastructure.

<a id="revision"></a>

## 17. Revision questions and practical debugging

### 17.1 Questions with project-specific answers

**Why does this project not register `ticketApi.reducer` separately?**  
Because `ticketApi` injects endpoints into the existing `baseApi` object. `baseApi.reducer` and its middleware already serve those endpoints.

**Why does `getTicketAssignees` provide `Users`?**  
Because the choice of possible assignees depends on user data. User creation and updates can make that query stale.

**Does a `Tickets` tag mean all tickets live in one cache entry?**  
No. Each endpoint/argument combination has its own entry. The broad tag connects their refresh dependencies.

**Why can Dashboard and Tickets make different requests through the same hook?**  
They pass different page sizes, sorting, and filter arguments. Reusing an endpoint does not imply reusing one argument-specific result.

**Does `.unwrap()` always remove the backend envelope?**  
No. Login's unwrapped result still contains an envelope. The refresh result has already been transformed into tokens by its endpoint.

**Why is the global loader a counter?**  
Ticket details can require multiple concurrent requests. One finishing should not hide the overlay while another participating request is still pending.

**Why can the notification badge update without the global overlay?**  
The endpoint opts out of the shared loader counter. It still executes through the base query and updates RTK Query state.

**Does polling the unread count refresh the notification list because both provide `COUNT`?**  
No. A fulfilled read updates its own entry; providing a tag does not invalidate it. The list has its own polling and refetch policies.

**What does `updateQueryData` do if the notification list was never fetched?**  
It does not create the missing entry or run that missing entry's recipe. The count can still be patched independently if it exists.

**Why patch a notification and then invalidate it?**  
The patch changes the UI immediately; invalidation obtains the server's resulting state afterward.

**Does a successful mutation guarantee the visible list has already refreshed?**  
No. Invalidation processing and the resulting query requests are separate from the mutation promise's completion.

**Why might a newly created ticket be absent after returning to the list?**  
Its creation mutation currently has no tag invalidation, and the list can reuse retained cached data.

**Does clearing `authStorage` reset the cache?**  
No. Storage clearing and `resetApiState` are separate operations; the current successful-login handler calls the latter explicitly.

**Does a refresh endpoint mean the app automatically retries protected requests after 401?**  
No. Refresh is triggered by the session-extension UI. The base query has no refresh-and-replay logic.

**Does a frontend query type prove the server sent the correct JSON?**  
No. TypeScript types are compile-time contracts. The project's envelope guard performs only partial runtime checks.

### 17.2 Debug from identity outward

When a view looks stale, inspect the following in order:

1. **Endpoint:** Which generated hook supplies this screen's data?
2. **Argument:** Which exact ID/filter/page values identify its entry?
3. **Subscription:** Is the component active, skipped, or unmounted?
4. **Request:** Did the Network panel show a request, or was retained data reused?
5. **Response shape:** Does the component expect an envelope, entity, array, or page?
6. **Dependency:** Does the write invalidate a tag the query actually provides?
7. **Timing:** Is other API work pending, or has the refetch not finished yet?
8. **Presentation:** Is the screen reading current data, previous hook data, or an independent local snapshot?

For example, a stale profile name in `LoggedInUser` should lead to the storage event path, because that component does not query `getUsers`. A stale ticket after creation should lead to `createTicket` invalidation, because navigation alone does not force a refresh.

### 17.3 What to look for in Redux and Network tools

The Redux store's API key is `pulseApi`. Inspect query entries for endpoint names, original arguments, status, and cached data. Inspect mutation state for the operation being performed, and `loader.loadingCount` when investigating the global overlay.

Use the Network panel to compare the actual method, URL parameters, HTTP status, and JSON envelope with the endpoint declaration. A successful HTTP request can still contain unexpected JSON. An absent request can be a valid cache hit or a skipped query rather than a broken hook.

Do not use console logging of tokens, passwords, or complete authentication mutation payloads as a debugging shortcut. Endpoint names, argument identity for ordinary reads, status, and non-sensitive response structure are usually enough to locate these integration problems.

### 17.4 Small reasoning exercises

**Exercise A:** Open a ticket, leave it, and return quickly without any mutation. Predict whether a GET is necessary.  
**Answer:** The retained entry may be reused because the query has no forced mount refetch. The exact outcome depends on whether its cache still exists and whether another event invalidated it.

**Exercise B:** An active asset-assignee dropdown is visible when a user is made inactive. Which tag matters?  
**Answer:** `Users`. `updateUser` invalidates it, and `getAssetAssignees` provides it.

**Exercise C:** A notification list is closed, but the badge is visible when “read for ticket” succeeds. Which data is fetched immediately after invalidation is processed?  
**Answer:** The subscribed count can refetch. The inactive list entry is removed if present; opening the menu requests the list again.

**Exercise D:** An API returns HTTP 200 and `{ success: false, ... }`. Does the current wrapper necessarily reject it?  
**Answer:** No. There is no application-envelope failure check or custom `validateStatus` in the active configuration.

**Key takeaways:** Most apparent fetching problems become easier to explain when you distinguish argument identity, subscriptions, tags, timing, and presentation state.

<a id="references"></a>

## 18. PDF conversion and reference material

### 18.1 Document format

This is one self-contained Markdown study guide. It uses numbered chapters, explicit table-of-contents anchors, fenced code, standard tables, and text diagrams. It needs no external image files, JavaScript diagrams, or collapsed sections to communicate the content.

The embedded print stylesheet requests A4 pages, chapter page breaks, smaller wrapped code text, and repeated table headers for HTML-to-PDF workflows. Markdown renderers that strip embedded CSS may ignore those print preferences; the text and heading structure remain readable.

Source links are relative to the project root so the notes can stay with the repository. A PDF cannot embed the TypeScript source files simply by linking them; the explanations and code excerpts are included so the notes remain useful independently.

### 18.2 Convert through an HTML preview

Open this file in a Markdown viewer that supports tables and HTML, then use its PDF export or print command. For a Pandoc-to-browser workflow, run these commands from the project root when those tools are available:

```sh
pandoc RTK_QUERY_PROJECT_NOTES.md \
  --from=gfm \
  --to=html5 \
  --standalone \
  --metadata pagetitle="RTK Query in Pulse UI" \
  --output=RTK_QUERY_PROJECT_NOTES.html
```

Open the generated HTML in a browser and choose **Print → Save as PDF**. Use A4 and check the preview for your renderer's page-break, code-wrapping, and table behavior. The document already has its own contents list, so an additional automatic TOC is unnecessary.

This requested deliverable is the Markdown file. Converting through HTML preserves the embedded print CSS more predictably than a direct Markdown-to-LaTeX route, where HTML styling is not applied.

### 18.3 Primary project evidence

The definitive evidence for current application behavior is the linked source throughout these notes, especially the shared API, all six injected modules, their direct hook consumers, and the loader/error/authentication support code.

Version-sensitive details were also checked against the locally installed `@reduxjs/toolkit` 2.12.0 implementation:

| Installed source path under `node_modules/@reduxjs/toolkit/` | Detail checked |
| --- | --- |
| `src/query/createApi.ts` | Retention, refetch, and delayed-invalidation defaults |
| `src/query/defaultSerializeQueryArgs.ts` | Argument serialization and endpoint-based cache keys |
| `src/query/core/buildMiddleware/invalidationByTags.ts` | Failure/success invalidation and subscriber-dependent action |
| `src/query/core/buildMiddleware/polling.ts` | Subscription-driven polling and focus handling |
| `src/query/core/buildThunks.ts` | Existing-entry cache patches, Immer drafts, primitive replacement, and undo |
| `src/query/core/buildInitiate.ts` | Mutation trigger result objects and unwrapping |
| `src/query/react/buildHooks.ts` | Query data, currentData, loading, and fetching behavior |

These implementation paths are supporting evidence for this reviewed version, not application APIs that components should import.

### 18.4 Official RTK Query references

The following official pages were consulted for the corresponding concepts; project-specific conclusions come from the source review.

- [Queries](https://redux-toolkit.js.org/rtk-query/usage/queries): query definitions, generated hook results, and selecting data.
- [Mutations](https://redux-toolkit.js.org/rtk-query/usage/mutations): explicit triggers, mutation result state, and unwrapping.
- [Cache behavior](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior): query identity, subscriptions, retention, and separate query results.
- [Automated refetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching): dependency tags and matching invalidation.
- [Code splitting](https://redux-toolkit.js.org/rtk-query/usage/code-splitting): injecting feature endpoints into a shared API.
- [fetchBaseQuery](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery): HTTP configuration, headers, errors, and status handling.
- [Customizing queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries): custom base queries and response transformation.
- [Manual cache updates](https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates): optimistic updates, rollback, and overlapping-request concerns.
- [Polling](https://redux-toolkit.js.org/rtk-query/usage/polling): repeated fetching and focus-aware polling.
- [setupListeners](https://redux-toolkit.js.org/rtk-query/api/setupListeners): browser focus and network event integration.
- [createApi](https://redux-toolkit.js.org/rtk-query/api/createApi): API configuration and defaults.
- [API utilities](https://redux-toolkit.js.org/rtk-query/api/created-api/api-slice-utils): cache patches, invalidation helpers, and API-state reset.

**Final study checkpoint:** You should now be able to start from any Pulse UI RTK Query hook, find its endpoint, predict its HTTP request and result shape, identify its cache entry and dependencies, and explain how that result reaches or refreshes the screen.
