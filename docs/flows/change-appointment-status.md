---
type: Flow
title: 'Change an appointment in the admin panel'
description: 'How staff complete, mark a no-show, cancel, or reschedule an appointment from the React admin panel, including bulk actions.'
tags:
  - flows
  - client-app
  - hidalgo-junior
  - appointments
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: draft
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-16T12:26:00Z'
part_of: /engineering/apps/hidalgo-admin
realizes:
  - /business/processes/hidalgo-junior/change-appointment
  - /business/processes/hidalgo-junior/close-appointment
---

# Change an appointment in the admin panel

## Description

Staff change an appointment from its detail (`/appointments/{id}`), from the appointments list,
from a client's or a staff member's appointments, or from the day agenda. Reschedule is
`/appointments/{id}/reschedule`. Status rules are on the [card](../overview.md#status-presentation).
Mutations live in `src/features/appointments/api/appointments.mutations.ts`. The status card shows
the channel (`app`, `mcp`, or `admin`), or "No channel" when it is empty. A reschedule keeps that
channel on the new revision. The list, the day agenda, and a user's appointments do not show it.

## Trigger and Input

- **Complete or no-show.** The appointment is not final and its start has passed. The body is the
  new status plus the stored internal notes.
- **Cancel from the detail.** A reason is required. The stored internal notes are sent as well.
- **Cancel from a list.** No reason field. The stored notes are sent and the reason is empty.
- **Bulk complete, no-show, or cancel.** Only `pending` and `confirmed` rows. Bulk cancel asks for
  one reason and applies it to each selected appointment, still sending that appointment's notes.
  One request per appointment.
- **Reschedule.** A new slot from the availability calls. `PATCH …/reschedule`.

## Error Handling and Compensation

A failed single action shows a toast and leaves the appointment as it was. A bulk action that fails
partway reports how many succeeded and which ones failed; the successful ones stay changed. There
is no second request that undoes them. A failed reschedule stays on the reschedule screen.
