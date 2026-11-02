---
type: Flow
title: 'Send a customer push from the admin panel'
description: 'How staff write a short message to the customer of an appointment from the React admin panel, and how a delivery failure is shown.'
tags:
  - flows
  - client-app
  - hidalgo-junior
  - push
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: stable
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-11-02T20:04:10Z'
verified:
  - by: 'human:mfontcuberta'
    at: '2026-11-02T20:16:33Z'
part_of: /engineering/apps/hidalgo-admin
realizes:
  - /business/processes/hidalgo-junior/send-salon-message
---

# Send a customer push from the admin panel

## Description

From the appointment detail or the day agenda, staff write a message for the customer of that
appointment. The panel sends `POST /admin/appointments/{appointmentID}/customer-push` and then
reloads `GET …/customer-push-messages`. Delivery is the backend's. The composer is in
`src/features/appointments`.

## Trigger and Input

The appointment has a customer account. The body is at most 280 characters. The day agenda opens
the same composer; it does not drag the appointment to a new time.

## Error Handling and Compensation

A failed send shows a toast. The panel reloads the message history after a refusal too, because the
backend keeps a message it could not push: with no device (422) the row shows `no_tokens`, and with
push delivery not configured (503, `Error-Code: admin_customer_push_delivery_unavailable`) it shows
`unavailable` and the toast says the message stays in the customer's app inbox. Any other 503 stored
nothing, so it gets the generic failure toast. The message is not retried by the panel. Previously
sent messages stay listed with the read time the backend returns.

Known gap: the day agenda shows every refused send as the generic failure; only the appointment
detail tells these cases apart.
