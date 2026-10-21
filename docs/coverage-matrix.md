---
type: Reference
title: 'Coverage matrix of the Hidalgo Junior admin panel documentation'
description: 'Maps every enumerated item of the Hidalgo Junior React admin panel to the section that documents it.'
tags:
  - client-app
  - hidalgo-junior
  - documentation
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: draft
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-21T06:44:15Z'
describes:
  - /engineering/apps/hidalgo-admin
---

# Coverage matrix of the Hidalgo Junior admin panel documentation

Inventory of `jordi_hidalgo_admin` on 2026-10-12, from the route files (`src/routes/`), the feature
API modules (`src/features/*/api`), the session store, `src/shared/config/env.ts`, and the deploy
files. ✅ = documented. — = the surface does not exist (stated in the linked section).

## Routes

| Kind  | Item                                                                                     | Documented in                            | Status |
| ----- | ---------------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| Route | `/login`, `/auth-gate`, `/_kit`                                                          | navigation.md#public-routes              | ✅     |
| Route | 11 sidebar sections, including `tab` and `doc` on `/business` and `tab` on blocked slots | navigation.md#sidebar-sections           | ✅     |
| Route | Detail and form routes, including the appointment-form and client-form search parameters | navigation.md#detail-and-form-routes     | ✅     |
| Route | Legacy aliases and the unknown-path screen                                               | navigation.md#legacy-and-fallback-routes | ✅     |
| Route | `sidebar` search parameter                                                               | navigation.md#sidebar-sections           | ✅     |
| Route | Navigation operations                                                                    | navigation.md#navigation-model           | ✅     |
| Route | Screen graph                                                                             | navigation.md#screen-graph               | ✅     |
| Route | Layouts under 768 px, 768–1023 px, and from 1024 px                                      | navigation.md#responsive-layout          | ✅     |
| Route | Live-notices bell in the sidebar and the mobile header                                   | navigation.md#live-notices               | ✅     |

## Guards and client state

| Kind         | Item                                                   | Documented in                                                        | Status |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------------------- | ------ |
| Guard        | Restore, redirect back after sign-in, expiry, sign-out | navigation.md#guards, flows/admin-sign-in-and-session.md             | ✅     |
| Guard        | Signed-in user on `/login` or `/auth-gate` opens `/`   | navigation.md#guards                                                 | ✅     |
| Guard        | `canAccessAdmin`                                       | overview.md#actors-and-access, overview.md#business-invariants       | ✅     |
| Client state | restoring / authenticated / unauthenticated / expired  | overview.md#client-side-state                                        | ✅     |
| Client state | Token refresh: success, transient failure, rejection   | flows/admin-sign-in-and-session.md, contracts/backend-api.md#session | ✅     |
| Client state | Sidebar collapsed                                      | navigation.md#responsive-layout                                      | ✅     |

## Presentation mappings

| Kind                 | Item                                                   | Documented in                   | Status |
| -------------------- | ------------------------------------------------------ | ------------------------------- | ------ |
| Presentation mapping | Appointment status to tone, label, and actions         | overview.md#status-presentation | ✅     |
| Presentation mapping | Slot-watch `active` / `held`                           | overview.md#status-presentation | ✅     |
| Presentation mapping | Customer list filters                                  | overview.md#status-presentation | ✅     |
| Presentation mapping | Staff account pill                                     | overview.md#status-presentation | ✅     |
| Presentation mapping | Service active / inactive, new version instead of edit | overview.md#status-presentation | ✅     |

## Use cases

| Kind               | Item                                                                                                                                  | Documented in                                   | Status |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| Feature module     | `auth`, `shell`, `dashboard`, `availability`, `appointments`, `slot-watches`, `schedule`, `services`, `users`, `business`, `activity` | overview.md#feature-modules                     | ✅     |
| Use case           | Session, dashboard, availability, appointments, slot watches, schedule, services, accounts, business content, gallery, live activity  | overview.md#use-cases, contracts/backend-api.md | ✅     |
| Use case (dormant) | None in `src/features/*/api`                                                                                                          | overview.md#use-cases                           | ✅     |
| Flow               | Sign-in and session                                                                                                                   | flows/admin-sign-in-and-session.md              | ✅     |
| Flow               | Create an appointment                                                                                                                 | flows/create-appointment.md                     | ✅     |
| Flow               | Status change, reschedule, cancel, bulk                                                                                               | flows/change-appointment-status.md              | ✅     |
| Flow               | Customer push                                                                                                                         | flows/send-customer-push.md                     | ✅     |
| Flow               | One-off block with overlap resolution                                                                                                 | flows/create-blocked-slot.md                    | ✅     |
| Flow               | Gallery image upload                                                                                                                  | flows/upload-gallery-image.md                   | ✅     |
| Client invariant   | The rules the panel enforces                                                                                                          | overview.md#business-invariants                 | ✅     |

## Consumed API

| Kind         | Item                                                             | Documented in                                                             | Status |
| ------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| Consumed API | Session: login, me, refresh                                      | contracts/backend-api.md#session                                          | ✅     |
| Consumed API | Live activity: stream, recent list, mark read                    | contracts/backend-api.md#live-activity                                    | ✅     |
| Consumed API | Dashboard, public availability, appointments, slot watches       | contracts/backend-api.md#dashboard-availability-appointments-slot-watches | ✅     |
| Consumed API | Business hours, blocks, recurring rules, services                | contracts/backend-api.md#schedule-and-services                            | ✅     |
| Consumed API | Users, business content, gallery, including the presigned upload | contracts/backend-api.md#accounts-and-business-content                    | ✅     |
| Consumed API | Error classes                                                    | contracts/backend-api.md#error-classes                                    | ✅     |

## Local store, push, deep links, permissions

| Kind        | Item                                                                                  | Documented in                                                                  | Status |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| Local store | `hj_admin.access_token`, `hj_admin.refresh_token` (cleared on sign-out and on expiry) | flows/admin-sign-in-and-session.md, operations.md#what-staff-notice-at-cutover | ✅     |
| Local store | `hj_admin.activity_cursor` (stream resume id; cleared on sign-out and on expiry)      | overview.md#client-side-state, flows/admin-sign-in-and-session.md              | ✅     |
| Local store | `hj_admin.theme`, `hj_admin.locale`, `hj_admin.sidebar_collapsed` (survive sign-out)  | operations.md#what-staff-notice-at-cutover, navigation.md#responsive-layout    | ✅     |
| Local store | Expiry notice, memory only                                                            | overview.md#client-side-state                                                  | ✅     |
| Push        | The panel does not register for push. It asks the backend to send                     | overview.md#surfaces, overview.md#out-of-scope                                 | —      |
| Deep link   | Panel paths and the legacy aliases. No platform manifest                              | navigation.md#legacy-and-fallback-routes                                       | ✅     |
| Permission  | No camera, location, or notification permission. Gallery uses the file picker         | overview.md#surfaces                                                           | —      |

## Config, analytics, release

| Kind            | Item                                                                         | Documented in                                                                 | Status |
| --------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| Config          | `VITE_API_BASE_URL`                                                          | operations.md#environments-and-configuration, overview.md#business-invariants | ✅     |
| Analytics event | None                                                                         | operations.md#observability                                                   | —      |
| Release target  | Web, `https://admin.hidalgojunior.com`, Docker image as the alternative host | operations.md#release, operations.md#rollback                                 | ✅     |
| Release target  | Staging, `https://shy-rain-a1f2.jhidalgojunior.workers.dev`                  | operations.md#release                                                         | ✅     |

## Design

| Kind                 | Item                              | Documented in    | Status |
| -------------------- | --------------------------------- | ---------------- | ------ |
| Presentation mapping | Tokens, type, layout, and anatomy | design-system.md | ✅     |

## Hub capabilities and journeys

The card `implements` and `realizes` the same hub concepts as the Flutter panel, because it fronts
the same staff work. Each journey's mechanics are the flow named on the card's use-case table.
