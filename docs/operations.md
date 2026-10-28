---
type: Runbook
title: 'Operating the Hidalgo Junior admin panel'
description: 'Build configuration, deployment, rollback, observability, and the common failures of the Hidalgo Junior React staff panel, with how to diagnose and fix them.'
tags:
  - release
  - client-app
  - hidalgo-junior
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: stable
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-28T16:50:00Z'
verified:
  - by: 'human:mfontcuberta'
    at: '2026-10-28T16:57:23Z'
severity: medium
operates:
  - /engineering/apps/hidalgo-admin
---

# Operating the Hidalgo Junior admin panel

The panel is a static build. It has no server process of its own, so operating it means building it
with the right API origin, publishing the files, and telling panel problems apart from backend
problems. Local commands are in `AGENTS.md`.

Since 2026-10-13 the host `https://admin.hidalgojunior.com` serves this React panel. Staff signed in
once at cutover, because the storage keys changed. The Flutter source was removed from the app
repository. Rollback is redeploying the previous Cloudflare Pages deployment, if it was kept; that
deployment cannot be rebuilt from git.

## Environments and configuration

`VITE_API_BASE_URL` is read at **build time** and checked at startup (`src/shared/config/env.ts`).
An invalid value (missing, or not an `http` or `https` URL) throws and the app does not render.
There is no runtime config file and no skip-login flag.

| Value                                                   | Where                                         | Backend             |
| ------------------------------------------------------- | --------------------------------------------- | ------------------- |
| `http://localhost:8080`                                 | `.env.development` (`npm run dev`, port 5173) | local API           |
| `http://localhost:8080`                                 | `.env.e2e` (`npm run build:e2e`, Playwright)  | mocked by the tests |
| `https://api.hidalgojunior.com`                         | production image and the Pages publish        | production API      |
| `https://hidalgo-junior-backend-staging.up.railway.app` | staging Workers publish                       | staging API         |

The Docker build takes `VITE_API_BASE_URL` as a build argument and refuses to build when it is
empty. The same value is the nginx `API_ORIGIN` used in the Content-Security-Policy `connect-src`.

## Release

1. `npm run check`: types, lint, format, contract drift, message parity, icons, unit tests, the
   production build, the bundle budget, and Playwright. The budget is 180 kB gzip of first-load
   JavaScript and 60 kB gzip for any lazy chunk (`scripts/bundle-budget.mjs`).
2. Build the image:

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.hidalgojunior.com -t jordi-hidalgo-admin:cutover .
```

3. Publish to the same host as the Flutter panel, `https://admin.hidalgojunior.com`. That host is
   Cloudflare (the live response is Cloudflare Pages: `cache-control: public, max-age=0,
must-revalidate`). Upload `dist/` from a production build with the production API origin. Do not
   delete the previous Pages deployment: that deployment is the Flutter rollback.
4. Alternative host: the nginx image (`Dockerfile`, `deploy/default.conf.template`). It falls back
   to `index.html`, does not cache `index.html`, and caches `/assets/` for a year.

The backend allows any origin (CORS `*`), so the panel origin does not need a backend change.
Cloudflare Pages sends no `Content-Security-Policy`. `fetch` to the API origin, including the live
activity stream, is not blocked there. The nginx image is the host that sets `connect-src`, and it
already allows the API origin.

Staging is a separate build, published at `https://shy-rain-a1f2.jhidalgojunior.workers.dev`, with
`VITE_API_BASE_URL` set to `https://hidalgo-junior-backend-staging.up.railway.app`. The same routes
apply, including `/appointments`. That build is not promoted onto `admin.hidalgojunior.com`.
Production keeps the production API origin.

### What staff notice at cutover

Tokens live under `hj_admin.access_token` and `hj_admin.refresh_token`. The Flutter panel used
different keys, so an existing browser session does not carry over. Staff sign in once. Language,
theme, and the collapsed sidebar are new keys too (`hj_admin.locale`, `hj_admin.theme`,
`hj_admin.sidebar_collapsed`) and start from the browser language and the system theme. The live
stream resumes from `hj_admin.activity_cursor`. Sign-out and expiry clear that key with the tokens.

### Manual UI check

Before publishing, and after a change to the theme or the shell, check in Chrome and in Safari, at
desktop width and below 768 px, in light and dark mode:

- Sign-in, a reload on a deep link, language (`es`, `ca`, `en`) and theme (`system`, `light`,
  `dark`) with the sidebar staying dark.
- One pass of each sidebar section, including a create that returns to its detail, the day agenda,
  a free slot that opens the appointment form, and the business gallery upload.
- A hard reload after publish, so the browser drops the previous `index.html`.

## Rollback

There is no server state to roll back. In Cloudflare Pages, redeploy the previous deployment if it
was kept. That deployment is the Flutter build, and the Flutter source is no longer in the app
repository, so it cannot be rebuilt from git. On the nginx host, run the previous image if it was
kept. Browsers keep the new JavaScript until they reload; staff may need a hard reload. After a
rollback they sign in again, because the Flutter panel reads its own storage keys.

## Observability

The panel sends no telemetry.

| Signal                   | Status                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Analytics events         | None                                                                                                             |
| Crash or error reporting | None. A failed load is an inline message with retry; a failed action is a toast. Route errors log to the console |
| Logs                     | The browser console. The production build does not log HTTP bodies                                               |
| Health check             | None for the panel. Backend health is the backend's concern                                                      |
| Dashboards and alerts    | None                                                                                                             |

To diagnose a production problem, use the browser's network tab on the staff member's machine, and
the backend's logs and traces for the same requests.

## Symptoms and Alerts

No alerts exist. Problems are reported by staff.

| Symptom                                                                                | Likely cause                                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| The app does not render, and the console says the environment configuration is invalid | The build has no `VITE_API_BASE_URL`, or it is not an `http` or `https` URL                      |
| Every screen shows a network error; sign-in fails with a network message               | Backend down or unreachable, or the build points at the wrong API origin                         |
| A browser error says the request was blocked by a content security policy              | The nginx `connect-src` does not include the API origin (`API_ORIGIN`)                           |
| Reloading a page or opening a shared link returns 404 from the host                    | The host does not fall back to `index.html`                                                      |
| Staff are sent to `/login` with "your session has expired"                             | Refresh token rejected, or the account was blocked                                               |
| Sign-in works but shows "no admin access"                                              | The account's role is not `admin` or `super_admin`                                               |
| After cutover the panel asks for sign-in even though Flutter was open                  | Expected. The storage keys changed                                                               |
| Old UI after a deploy                                                                  | The browser cached `index.html`; hard reload                                                     |
| Free slots today stays 0                                                               | The salon has no remaining free grid starts today. The panel shows the count the backend returns |

## Step-by-Step Diagnosis

1. **Is it the panel or the backend?** Open the network tab. If API calls fail or return 5xx, it is
   a backend or network problem; continue in the backend's runbook. If API calls succeed and the
   screen is still wrong, it is the panel.
2. **Check the target.** Confirm the request URLs point at `https://api.hidalgojunior.com` in
   production. A wrong host means a wrong build.
3. **Content security policy.** A blocked `connect-src` with no response status points at the nginx
   snippet, not at CORS. The backend allows any origin.
4. **Session.** A 401 followed by `POST /auth/refresh` answered 401 or 403 means the refresh token
   is no longer valid; staff must sign in again. A 403 that says the user is blocked means the
   account is blocked in the backend, and a 403 `forbidden` means the user is no longer an admin.
   The backend reads the user on every admin request, so a block, a demotion, or a deactivation
   (401, then a rejected refresh) ends the session at the next call.
5. **Routing.** A 404 from the host (not from the API) on a panel path means the `index.html`
   fallback is missing.
6. **Stale build.** Compare the loaded `assets/index-*.js` with the deployed one. A hard reload
   fixes a cached `index.html`.

## Mitigation Procedure

| Cause                             | Action                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Wrong `VITE_API_BASE_URL`         | Rebuild with the production origin and republish                                                                                    |
| Missing SPA fallback              | Fix the host (`try_files` in the nginx template, or the Pages fallback)                                                             |
| Bad release                       | [Roll back](#rollback) to the previous deployment, which is the Flutter build until that deployment is removed                      |
| Backend down or a blocked account | Fix in the backend; the panel needs no change                                                                                       |
| Session keeps expiring            | Sign out, delete the site's local storage for the panel origin, sign in again; if it persists, check token lifetimes in the backend |

## Escalation

There is a single owner (`owner:self`) for the panel and the backend. Escalate backend-side causes
to the [backend operations](/engineering/services/hidalgo-backend/operations).
