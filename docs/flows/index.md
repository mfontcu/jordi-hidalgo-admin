---
type: Catalog
title: 'Flows of the Hidalgo Junior admin panel'
description: 'Index of the component-internal flows of the Hidalgo Junior React admin panel.'
tags:
  - catalog
  - flows
  - client-app
  - hidalgo-junior
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
---

# Flows of the Hidalgo Junior admin panel

Branching journeys staff take in the panel. Each file names the route that starts it. Hub journeys
stay in business language and link here for the mechanics.

| Flow                                                        | Starts at                        |
| ----------------------------------------------------------- | -------------------------------- |
| [Staff sign-in and session](./admin-sign-in-and-session.md) | `/login` and the route guard     |
| [Create an appointment](./create-appointment.md)            | `/appointments/form`             |
| [Change an appointment](./change-appointment-status.md)     | `/appointments/{id}`             |
| [Send a customer push](./send-customer-push.md)             | appointment detail or day agenda |
| [Create a blocked slot](./create-blocked-slot.md)           | `/schedule/blocked-slots/form`   |
| [Upload a gallery image](./upload-gallery-image.md)         | `/business?tab=gallery`          |
