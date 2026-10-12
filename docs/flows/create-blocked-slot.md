---
type: Flow
title: 'Create a blocked slot in the admin panel'
description: 'How staff save a one-off block in the React admin panel after seeing the appointments the range covers.'
tags:
  - flows
  - client-app
  - hidalgo-junior
  - scheduling
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
  - /business/processes/hidalgo-junior/block-time
---

# Create a blocked slot in the admin panel

## Description

Staff open `/schedule/blocked-slots/form`. Before the block is saved, `AppointmentConflictsCheck`
lists the `pending` and `confirmed` appointments that overlap the range. The check is the
appointments feature; the form is the schedule feature. A full day is 00:00–23:59 in salon time.

## Trigger and Input

A new block always runs the check. An edit runs it only when the range changed. Staff choose to
keep the overlapping appointments or to cancel them. Cancelling sends one
`PATCH /admin/appointments/{appointmentID}/cancel` per appointment: the block's reason is the
cancellation reason, and the appointment's stored internal notes are included. The block is then
`POST /admin/blocked-slots` (or `PUT` on edit). A saved create opens the detail.

Recurring rules do not use this check. An exception is a separate create on the rule.

## Error Handling and Compensation

If a cancellation fails, the toast names how many appointments could not be cancelled and the block
is not saved. Appointments that were cancelled stay cancelled. A failed block save after the
cancellations shows a toast; the panel does not restore those appointments. A failed load of the
conflict list shows the error with retry and does not save the block.
