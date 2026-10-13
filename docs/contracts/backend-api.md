---
type: Reference
title: 'Backend API operations consumed by the admin panel'
description: 'Every backend REST operation the Hidalgo Junior React admin panel calls, which screen calls it, and how the panel reacts when it fails.'
tags:
  - contracts
  - client-app
  - hidalgo-junior
  - appointments
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: draft
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-13T07:48:14Z'
describes:
  - /engineering/apps/hidalgo-admin
---

# Backend API operations consumed by the admin panel

The schema is the [backend REST API](/engineering/apis/hidalgo-backend-rest). This page lists the
operations the panel calls. It does not restate request bodies. The pinned copy is
`contract/openapi.json`, taken from `jordi_hidalgo_backend` at the commit in `contract/SOURCE.json`.
Types stop at `src/features/*/api`; screens see view models.

The client is `openapi-fetch` in `src/shared/api/client.ts`. Middleware sends the access token, the
`Accept-Language` of the chosen locale (or the browser's, before a choice), and on a 401 one shared
`POST /auth/refresh` followed by one retry (`src/shared/api/middleware/session.ts`).

## Error classes

`src/shared/api/errors.ts` maps the HTTP status to a class. A failed query shows that class in the
screen, with retry. A failed mutation shows a toast that names the action and the class. A
validation or conflict toast includes the backend's text when the body has one.

| Class          | When                                                         |
| -------------- | ------------------------------------------------------------ |
| `network`      | No response                                                  |
| `unauthorized` | 401. The middleware refreshes once before the screen sees it |
| `forbidden`    | 403. A blocked user expires the session                      |
| `notFound`     | 404                                                          |
| `validation`   | 400 or 422                                                   |
| `conflict`     | 409                                                          |
| `rateLimited`  | 429                                                          |
| `server`       | 5xx, or any other status                                     |

## Session

| Operation            | Caller                                                        |
| -------------------- | ------------------------------------------------------------- |
| `POST /auth/login`   | Sign-in                                                       |
| `GET /auth/me`       | Restore and the signed-in staff member                        |
| `POST /auth/refresh` | The HTTP middleware, once per 401, shared by concurrent calls |

Sign-out does not call the backend. It clears the tokens and the query cache.

## Dashboard, availability, appointments, slot watches

| Operation                                                        | Caller                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `GET /admin/dashboard/summary`                                   | Dashboard. Refetched on a language change. The next appointment's service name follows the request locale. Free slots today are the remaining booking-grid starts |
| `GET /services`                                                  | Availability overview (public catalog)                                                                       |
| `GET /availability/dates`, `GET /availability/slots`             | Availability overview, and the appointment form and reschedule                                               |
| `GET /admin/appointments`                                        | Appointments list, day agenda, a user's appointments, the conflicts check                                    |
| `GET /admin/appointments/{appointmentID}`                        | Detail, reschedule                                                                                           |
| `GET /admin/appointments/{appointmentID}/reschedule-chain`       | Detail                                                                                                       |
| `GET /admin/appointments/{appointmentID}/customer-push-messages` | Detail and day agenda                                                                                        |
| `POST /admin/appointments`                                       | Create                                                                                                       |
| `PATCH /admin/appointments/{appointmentID}/reschedule`           | Reschedule                                                                                                   |
| `PATCH /admin/appointments/{appointmentID}/status`               | Complete and no-show, including bulk                                                                         |
| `PATCH /admin/appointments/{appointmentID}/cancel`               | Cancel, including bulk and the conflicts check                                                               |
| `POST /admin/appointments/{appointmentID}/customer-push`         | Customer push                                                                                                |
| `GET /admin/slot-watches`                                        | Slot-watch list. The salon day is the only server filter                                                     |
| `POST /admin/slot-watches/{watchID}/cancel`                      | Cancel a watch                                                                                               |

Status and cancel bodies send the appointment's stored internal notes. The backend replaces the
notes with what it receives.

## Schedule and services

| Operation                                                                                                                      | Caller                                                           |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `GET /admin/business-hours`                                                                                                    | Working hours, and the day agenda                                |
| `PATCH /admin/business-hours/weekdays/{weekday}`                                                                               | Open or close a weekday                                          |
| `POST /admin/business-hours/slots`                                                                                             | Create a shift                                                   |
| `PATCH /admin/business-hours/slots/{slotID}`                                                                                   | Edit a shift                                                     |
| `DELETE /admin/business-hours/slots/{slotID}`                                                                                  | Delete a shift                                                   |
| `GET /admin/blocked-slots`, `GET /admin/blocked-slots/{id}`                                                                    | Punctual list, detail, day agenda                                |
| `POST /admin/blocked-slots`, `PUT /admin/blocked-slots/{id}`, `DELETE /admin/blocked-slots/{id}`                               | Create, edit, delete a one-off block                             |
| `GET /admin/recurring-blocked-slots`, `GET /admin/recurring-blocked-slots/{id}`                                                | Recurring list, detail, day agenda                               |
| `GET /admin/recurring-blocked-slots/{id}/exceptions`                                                                           | Rule detail                                                      |
| `POST /admin/recurring-blocked-slots`, `PUT /admin/recurring-blocked-slots/{id}`, `DELETE /admin/recurring-blocked-slots/{id}` | Create, edit, delete a rule                                      |
| `POST /admin/recurring-blocked-slots/{id}/exceptions`                                                                          | Add an exception                                                 |
| `GET /admin/services`, `GET /admin/services/{serviceID}`, `GET /admin/services/categories`                                     | Services screens, and the service lookup on the appointment form |
| `POST /admin/services`                                                                                                         | Create, and a new version                                        |
| `PATCH /admin/services/{serviceID}/activate`, `…/deactivate`, `…/display-order`, `…/show-on-public-site`                       | Detail actions                                                   |
| `DELETE /admin/services/{serviceID}`                                                                                           | Delete                                                           |

## Accounts and business content

| Operation                                                                                    | Caller                                                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /admin/users`, `GET /admin/users/{userID}`                                              | Staff and client lists and details, and the client lookup on the appointment form                      |
| `POST /admin/users`                                                                          | Create a staff account or a client                                                                     |
| `PATCH /admin/users/{userID}`                                                                | Edit, activate, deactivate, block, unblock. The body includes the stored fields the form does not edit |
| `DELETE /admin/users/{userID}`                                                               | Delete a client                                                                                        |
| `POST /admin/users/{userID}/verify-account`                                                  | Verify a client                                                                                        |
| `POST /admin/users/{userID}/activation-email`                                                | Activation email                                                                                       |
| `POST /admin/users/{userID}/password-setup-email`                                            | Password email                                                                                         |
| `GET /admin/users/phone-matches`                                                             | Count of other clients with the same phone, before save                                                |
| `GET /admin/business/info`, `PUT /admin/business/info`                                       | Info tab                                                                                               |
| `GET /admin/business/booking-settings`, `PUT /admin/business/booking-settings`               | Booking tab                                                                                            |
| `GET /admin/business/notifications`, `PATCH /admin/business/notifications/{settingID}`       | Notifications tab. The patch is optimistic                                                             |
| `GET /admin/business/legal`                                                                  | Legal tab                                                                                              |
| `PATCH /admin/business/legal/{code}/status`, `PATCH …/public-surfaces`, `PUT …/translations` | Edit a legal document                                                                                  |
| `GET /admin/business/web/pages`                                                              | Web tab                                                                                                |
| `PATCH /admin/business/web/pages/{code}/status`, `PUT …/translations`                        | Edit a web page                                                                                        |
| `GET /admin/home-gallery/slides`                                                             | Gallery tab                                                                                            |
| `POST /admin/home-gallery/slides`                                                            | Create a slide                                                                                         |
| `PATCH /admin/home-gallery/slides/{id}/status`                                               | Activate or hide                                                                                       |
| `PUT /admin/home-gallery/slides/{id}/surfaces`, `PUT …/translations`                         | Surfaces and alt texts                                                                                 |
| `PUT /admin/home-gallery/slides/order`                                                       | Reorder                                                                                                |
| `DELETE /admin/home-gallery/slides/{id}`                                                     | Delete                                                                                                 |
| `POST /admin/home-gallery/slides/{id}/upload-url`                                            | Presign                                                                                                |
| `PUT /admin/home-gallery/slides/{id}/confirm`                                                | Confirm the object key                                                                                 |

The image bytes go with `PUT` to the presigned URL. That request is not an API call and does not
send the panel JWT (`src/features/business/api/gallery-upload.ts`).

Queries whose content the backend localizes (service names and categories, the business CMS
texts, and the dashboard summary) are marked `meta.localized` and run again when the language changes.
