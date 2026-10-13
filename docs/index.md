---
type: Catalog
title: 'Hidalgo Junior admin panel'
description: 'Reading order of the Hidalgo Junior React admin panel documentation.'
tags:
  - catalog
  - client-app
  - hidalgo-junior
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: stable
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-13T09:35:00Z'
verified:
  - by: "human:mfontcuberta"
    at: "2026-10-13T09:41:23Z"
---

# Hidalgo Junior admin panel

Documentation of the staff web panel in `jordi_hidalgo_admin`, component `hidalgo-admin`. It replaced
the Flutter panel on 2026-10-13; that Flutter source was later removed from the app repository. For the
project and the decision, start at the knowledge hub (`/projects/hidalgo-junior`,
[ADR-003](/engineering/adrs/admin-panel-react-spa)).

Reading order:

1. [Card](./overview.md): what the panel does, its modules, client state, status presentation, and the rules it enforces.
2. [Navigation map](./navigation.md): every route, guard, search parameter, and screen transition.
3. [Flows](./flows/index.md): sign-in, appointments, customer push, blocked slots, gallery upload.
4. [Backend API consumption](./contracts/backend-api.md): every backend operation the panel calls and how errors are handled.
5. [Operations](./operations.md): configuration, release, rollback, observability, troubleshooting.
6. [Coverage matrix](./coverage-matrix.md): where each enumerated item is documented.
