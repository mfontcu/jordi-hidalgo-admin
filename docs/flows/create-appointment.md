---
type: Flow
title: 'Create an appointment in the admin panel'
description: 'How staff create an appointment in the React admin panel, including the hand-off that creates a client and returns to the form.'
tags:
  - flows
  - client-app
  - hidalgo-junior
  - appointments
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: stable
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-12T14:06:00Z'
verified:
  - by: 'human:mfontcuberta'
    at: '2026-10-12T14:13:05Z'
part_of: /engineering/apps/hidalgo-admin
realizes:
  - /business/processes/hidalgo-junior/book-appointment
---

# Create an appointment in the admin panel

## Description

Staff open `/appointments/form` from the appointments list, from a free slot on
`/schedule/availability`, or from a client. The form reads its prefill from the URL
(`appointmentFormSearchSchema`). Saving calls `POST /admin/appointments` and replaces the form with
the new detail. The screen is `src/features/appointments/ui/appointment-form-screen.tsx`.

## Trigger and Input

- **From the list or a client.** Optional `clientId`, `clientLabel`, `lockInitialUser`, and
  `backLabel`.
- **From availability.** `prefillServiceId`, `prefillDate`, and `prefillTime` of the free slot.
- **From "create client".** The form's current prefill is copied onto `/clients/form` with
  `returnTo=appointmentForm`. After that client is saved, the client form is replaced by
  `/appointments/form` with the new `clientId` and `clientLabel`.

The form loads services, clients, bookable dates, and slots as the staff pick them. The native
submit is cancelled in script, so the browser does not navigate to a query string of the notes
field. Leaving with unsaved changes asks first.

## Error Handling and Compensation

A failed lookup shows the error in the form with retry. A failed create shows a toast and stays on
the form; nothing is stored. Validation (a missing client, service, or slot) shows under the field
and does not call the backend. If the client create fails, the appointment form is unchanged and
the client form stays put.
