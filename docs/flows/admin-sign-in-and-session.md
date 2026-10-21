---
type: Flow
title: 'Staff sign-in and session lifecycle in the admin panel'
description: 'How the React admin panel restores, opens, refreshes, expires, and closes a staff session, and where it sends the browser in each case.'
tags:
  - flows
  - client-app
  - hidalgo-junior
  - authentication
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: stable
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-20T19:55:00Z'
verified:
  - by: 'human:mfontcuberta'
    at: '2026-10-21T05:56:00Z'
part_of: /engineering/apps/hidalgo-admin
realizes:
  - /business/processes/hidalgo-junior/staff-sign-in
---

# Staff sign-in and session lifecycle in the admin panel

## Description

The panel keeps a staff session as two tokens in `localStorage`. The route guard
(`src/routes/_authed.tsx`) restores it before a signed-in screen renders. Sign-in is
`signIn` in `src/features/auth/api/session.ts`. Refresh is the HTTP middleware. The states are on
the [card](../overview.md#client-side-state).

## Trigger and Input

- **Start-up.** Any panel URL. Input: `hj_admin.access_token`, `hj_admin.refresh_token`, and the URL.
- **Sign-in.** Email and password on `/login`.
- **Any API call** answered 401, or 403 because the user is blocked.
- **Sign-out** from the sidebar or the drawer.

A stored token calls `GET /auth/me`. Success with a staff role renders the shell on the requested
path. No token, a rejected token, or a non-staff role goes to `/login`. A network or server failure
on restore also goes to `/login` but keeps the tokens. Sign-in clears any previous session first,
then `POST /auth/login`. A staff user is stored and the `redirect` path opens when it is a relative
panel path. Sign-out clears the tokens, the activity cursor (`hj_admin.activity_cursor`), and the
query cache, and replaces the location with `/login`. Language, theme, and the collapsed sidebar
stay. Expiry clears the tokens and the cursor the same way.

## Error Handling and Compensation

| Failure                                             | What the panel does                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Wrong password (401)                                | Stays on `/login` with "invalid credentials". Tokens stay empty                                          |
| Blocked or inactive account (403)                   | Stays on `/login` with the generic failure message                                                       |
| Customer role                                       | Signed out at once, with "no admin access" on sign-in and with no notice on restore                      |
| Backend unreachable on sign-in                      | Stays on `/login` with the network message                                                               |
| Backend unreachable on restore                      | `/login`, tokens kept                                                                                    |
| 401 on a later call, refresh succeeds               | The original call is retried once. Concurrent 401s share one refresh                                     |
| Refresh answered 401 or 403, or the user is blocked | Tokens and the activity cursor cleared, in-memory expiry flag set, `/login` shows the expiry notice once |
| Refresh fails for network or server reasons         | Tokens kept. The call fails as a network or server error                                                 |

There is no server-side sign-out call. A rollback to a kept Flutter deployment does not read these
keys, so staff sign in there again as well. The Flutter source is no longer in the app repository.
