---
type: Flow
title: 'Upload a gallery image in the admin panel'
description: 'How staff upload a home-gallery image from the React admin panel through a presigned URL and then confirm it.'
tags:
  - flows
  - client-app
  - hidalgo-junior
  - cms
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
  - /business/processes/hidalgo-junior/publish-gallery-image
---

# Upload a gallery image in the admin panel

## Description

On `/business?tab=gallery`, staff create a slide and upload a JPEG, PNG, or WebP.
`uploadGallerySlideImage` (`src/features/business/api/gallery-upload.ts`) asks the backend for a
presigned URL, `PUT`s the bytes to that URL without the panel JWT, then confirms the object key.

## Trigger and Input

The file picker. The content type is one of the three image types the gallery accepts. Alt texts in
`es`, `ca`, and `en` are required before the slide can be activated. Order is adjacent moves or an
HTML drag of the row. Surfaces are chosen on the slide.

## Error Handling and Compensation

If the presign, the storage `PUT`, or the confirm fails, the toast says the upload failed and the
slide stays without the new image. A slide that was created before the upload still exists; staff
can retry the file or delete the slide. Deleting asks first. The panel does not delete the storage
object itself.
