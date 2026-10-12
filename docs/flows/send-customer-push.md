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
  at: '2026-10-12T14:06:00Z'
verified:
  - by: 'human:mfontcuberta'
    at: '2026-10-12T14:13:05Z'
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

A failed send shows a toast and does not add a row. The backend's text is shown when the class is
validation or conflict, including a refusal because the customer has no device. The message is not
retried by the panel. Previously sent messages stay listed with the read time the backend returns.
