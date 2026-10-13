---
type: Reference
title: 'Design system of the Hidalgo Junior admin panel'
description: 'Visual system of the Hidalgo Junior React admin panel: tokens, type, layout, and component anatomy.'
tags:
  - architecture
  - client-app
  - hidalgo-junior
owner: 'owner:self'
domain: /projects/hidalgo-junior
visibility: personal
status: stable
generated:
  by: 'ai-dev/okf-doc-writer'
  at: '2026-10-13T15:10:00Z'
verified:
  - by: 'human:mfontcuberta'
    at: '2026-10-13T15:10:00Z'
describes:
  - /engineering/apps/hidalgo-admin
---

# Design system of the Hidalgo Junior admin panel

The panel paints this system. Color, type, and radius come from the tables below. A screen does not invent a color or a size outside them.

## Locked decisions

- The visual layer is separate from the data layer.
- The system has three layers. A screen cannot read a reference token. A primitive cannot invent a color.
  - **Reference** (`--ref-*` in `src/shared/ui/styles/tokens.css`): raw palette, not exposed as Tailwind utilities.
  - **Semantic** (the names in [Semantic tokens](#semantic-tokens)): what primitives use, with a light and a dark value.
  - **Patterns** (`src/shared/ui/kit` and the shell): list, table, filters, detail, form, navigation. Screens compose patterns.
- Primitives stay in the repo, on Radix, styled with Tailwind v4. Do not add Material Web, MUI, or another component library.
- shadcn recipes may be copied into `src/shared/ui/primitives` when a primitive is replaced. The public exports in `src/shared/ui/index.ts` stay.
- Gold `#c5a059` is the brand mark on the dark sidebar only. It is never text, a link, or a button on a light surface.
- Primary actions are ink, weight 600, radius 6px. No Material state layer (`::before` at 8% or 10%). No elevation shadow.
- Material Symbols stay. Icon names in `icons.json` stay. Use one weight, outlined, at 20px. Do not add a second icon set.
- The font is Source Sans 3, self-hosted with `@fontsource/source-sans-3` (the CSP allows only `'self'`). Weights 400, 500, 600, and 700.
- Shell widths are 768 and 1024. Content widths 560, 900, and 960 stay.
- Month names, salon days (`Europe/Madrid`), and the locale time formats stay. See [Frozen behavior](#frozen-behavior).

## Frozen behavior

The visual system does not change these:

- Routes, legacy aliases, search params, guards, and the `sidebar` search param (`docs/navigation.md`).
- The eleven sidebar sections and their order (`src/features/shell/model/sections.ts`).
- Hooks, `src/features/*/api`, `src/features/*/model` Zod schemas, and mutation invalidation.
- i18n message ids in `src/shared/i18n/messages/{es,ca,en}.json`.
- Create saves with `replace` to the new detail. Edit saves call `history.back`. Unsaved-changes guard, toast API, and failure classes stay.
- `hj_admin.sidebar_collapsed` remains a boolean. Sign-out still goes to `/login` with no notice.
- Calendar month titles and weekday initials stay as they are (Spanish and Catalan weeks start on Monday). Tests in `src/shared/ui/primitives/primitives.test.tsx` that assert those strings stay.
- A time value is still a `ClockTime` from `src/shared/lib/business-time.ts`. Spanish `H:mm`, Catalan `HH:mm`, English `h:mm a`. Any valid minute is accepted. The quarter-hour list is a shortcut, not a restriction.
- Filter apply and clear keep their callbacks and URL results. From 768px the container is a popover. Under 768px it is a sheet.
- `role="tablist"` / `aria-selected` on segmented tabs stay.

## Visual language

Light surfaces are warm. Dark surfaces follow the public site's ink, without its script face or gradients.

| Role           | Light     | Dark      | Use                                      |
| -------------- | --------- | --------- | ---------------------------------------- |
| Canvas         | `#f6f5f2` | `#121210` | Page background                          |
| Paper          | `#fffcf8` | `#1c1c1a` | Cards, dialogs, inputs                   |
| Ink            | `#141413` | `#f3f1ea` | Text and primary buttons                 |
| Muted text     | `#6f6c64` | `#a8a59c` | Secondary text                           |
| Line           | `#e4e1d8` | `#2e2e2a` | Borders                                  |
| Gold           | `#c5a059` | `#c5a059` | Sidebar mark and active section bar only |
| Danger         | `#b42318` | `#f0a8a0` | Destructive text and filled danger       |
| Danger wash    | `#f8e8e6` | `#3d2422` | Danger tonal background                  |
| Success        | `#1f7a45` | `#8fd4a8` | Success text                             |
| Success wash   | `#e7f4ec` | `#1a3328` | Success tonal background                 |
| Warning        | `#8a5a00` | `#f0c14d` | Warning text                             |
| Warning wash   | `#f8efd9` | `#3d3014` | Warning tonal background                 |
| Selection text | `#6b5224` | `#e4c77a` | Selected filter chip text                |
| Selection wash | `#f3ecdc` | `#2a2418` | Selected filter chip fill                |

Reference custom properties, all on `:root` (they do not change with mode):

| Token                  | Value     |
| ---------------------- | --------- |
| `--ref-ink`            | `#141413` |
| `--ref-canvas`         | `#f6f5f2` |
| `--ref-paper`          | `#fffcf8` |
| `--ref-muted`          | `#6f6c64` |
| `--ref-line`           | `#e4e1d8` |
| `--ref-gold`           | `#c5a059` |
| `--ref-danger`         | `#b42318` |
| `--ref-danger-wash`    | `#f8e8e6` |
| `--ref-success`        | `#1f7a45` |
| `--ref-success-wash`   | `#e7f4ec` |
| `--ref-warning`        | `#8a5a00` |
| `--ref-warning-wash`   | `#f8efd9` |
| `--ref-selection`      | `#6b5224` |
| `--ref-selection-wash` | `#f3ecdc` |
| `--ref-night`          | `#121210` |
| `--ref-night-paper`    | `#1c1c1a` |
| `--ref-night-ink`      | `#f3f1ea` |
| `--ref-night-muted`    | `#a8a59c` |
| `--ref-night-line`     | `#2e2e2a` |
| `--ref-white`          | `#ffffff` |

## Semantic tokens

Mode-dependent. Light values on `:root, .light`. Dark values on `.dark`. Primitives use these names. They are exposed as Tailwind colors in the `@theme inline` block of `src/shared/ui/styles/index.css`.

| Token                      | Light                                                    | Dark                | Role                        |
| -------------------------- | -------------------------------------------------------- | ------------------- | --------------------------- |
| `--background`             | `--ref-canvas`                                           | `--ref-night`       | Page canvas                 |
| `--foreground`             | `--ref-ink`                                              | `--ref-night-ink`   | Primary text                |
| `--card`                   | `--ref-paper`                                            | `--ref-night-paper` | Elevated surface            |
| `--card-foreground`        | `--ref-ink`                                              | `--ref-night-ink`   | Text on a card              |
| `--muted`                  | `#efece6`                                                | `#222220`           | Subtle fill, row hover      |
| `--muted-foreground`       | `--ref-muted`                                            | `--ref-night-muted` | Secondary text              |
| `--primary`                | `--ref-ink`                                              | `--ref-night-ink`   | Primary button fill         |
| `--primary-foreground`     | `--ref-white`                                            | `--ref-ink`         | Primary button label        |
| `--primary-hover`          | `#2a2926`                                                | `#e4e2da`           | Primary button hover        |
| `--border`                 | `--ref-line`                                             | `--ref-night-line`  | Borders                     |
| `--ring`                   | `--ref-ink`                                              | `--ref-night-ink`   | Focus ring                  |
| `--brand`                  | `--ref-gold`                                             | `--ref-gold`        | Sidebar mark and active bar |
| `--destructive`            | `--ref-danger`                                           | `#f0a8a0`           | Danger fill and text        |
| `--destructive-foreground` | `--ref-white`                                            | `--ref-ink`         | Label on a danger fill      |
| `--destructive-wash`       | `--ref-danger-wash`                                      | `#3d2422`           | Danger tonal                |
| `--success`                | `--ref-success`                                          | `#8fd4a8`           | Success text                |
| `--success-wash`           | `--ref-success-wash`                                     | `#1a3328`           | Success tonal               |
| `--warning`                | `--ref-warning`                                          | `#f0c14d`           | Warning text                |
| `--warning-wash`           | `--ref-warning-wash`                                     | `#3d3014`           | Warning tonal               |
| `--selection`              | `--ref-selection`                                        | `#e4c77a`           | Selection text              |
| `--selection-wash`         | `--ref-selection-wash`                                   | `#2a2418`           | Selection fill              |
| `--disabled`               | `color-mix(in srgb, var(--foreground) 12%, transparent)` | same                | Disabled fill               |
| `--disabled-foreground`    | `color-mix(in srgb, var(--foreground) 38%, transparent)` | same                | Disabled label              |

### Sidebar

Sidebar tokens are the same in both modes. The sidebar stays dark.

| Token                  | Value                     |
| ---------------------- | ------------------------- |
| `--sidebar`            | `#0e0e0d`                 |
| `--sidebar-foreground` | `#f3f1ea`                 |
| `--sidebar-muted`      | `#b8b6b0`                 |
| `--sidebar-border`     | `rgb(255 255 255 / 0.08)` |
| `--sidebar-active`     | `--ref-gold`              |
| `--sidebar-hover`      | `rgb(255 255 255 / 0.04)` |

## Type, radius, space, and motion

Six type steps, in `@theme`. Letter-spacing is 0. `body` is the default on `body`.

| Token                | Size | Line height | Weight |
| -------------------- | ---- | ----------- | ------ |
| `--text-title`       | 22px | 1.3         | 600    |
| `--text-heading`     | 18px | 1.35        | 600    |
| `--text-body`        | 14px | 1.5         | 400    |
| `--text-body-strong` | 14px | 1.5         | 600    |
| `--text-label`       | 13px | 1.4         | 500    |
| `--text-caption`     | 12px | 1.4         | 400    |

| Token                                       | Value | Use                               |
| ------------------------------------------- | ----- | --------------------------------- |
| `--radius-xs`, `--radius-sm`, `--radius-md` | 6px   | Controls                          |
| `--radius-lg`, `--radius-xl`                | 8px   | Panels, dialogs, sheets           |
| `--radius-pill`, `--radius-full`            | 999px | Status pills and the switch track |

Space stays on Tailwind's 4px scale. `--control-height` is 40px. At `max-width: 767px` it is 44px. Input padding is 8px vertical inside the 1px border and 12px horizontal. Focus is the global 2px `--ring` outline.

Motion is 150ms ease-out. Floating panels (select, popover, tooltip, toast, drawer) use a border and no elevation shadow.

`--breakpoint-desktop` is `1024px`.

## Layout

`shellLayoutFor` in `src/features/shell/model/layout.ts`:

| Width       | Mode      | What the staff member sees                                                                                                                                                                            |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| under 768px | `mobile`  | Header (`banner`) and a drawer. No persistent sidebar.                                                                                                                                                |
| 768–1023px  | `tablet`  | Persistent 60px icon rail. A control opens the labeled sidebar as an overlay and closes it on navigation. The rail does not push the page. The desktop collapse preference does not change this rail. |
| from 1024px | `desktop` | 240px sidebar. Collapse still writes `hj_admin.sidebar_collapsed`. Collapsed is the 60px rail with an expand control.                                                                                 |

The content area, not the window, decides list and detail density (`listLayoutFor`, `detailLayoutFor`):

| Content width | List                                                  | Detail                  |
| ------------- | ----------------------------------------------------- | ----------------------- |
| under 560px   | Compact. Summary in one column. Rows as cards.        | One column.             |
| 560–899px     | Compact. Summary in up to two columns. Rows as cards. | One column.             |
| from 900px    | Table. Summary in one row.                            | One column until 960px. |
| from 960px    | Table.                                                | Two columns.            |

From 900px upward, list layout is one branch: padding 24, section gaps 24 and 28, summary not compact. Title and summary numbers are the type tokens.

`dashboardLayoutFor` is content width. It is not retuned to the shell breakpoints.

## Component anatomy

| Piece                           | Rule                                                                                                                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                          | Variants `primary`, `secondary`, `danger`, `successTonal`, `dangerTonal`, `text`, `icon`. Height `--control-height`, radius 6px, label weight 600. Hover uses `--primary-hover` or `--muted`. `text` is not a pill. `icon` is a 6px square, not a circle. |
| Field                           | `--card` fill, 1px `--border`, radius 6px, padding 12px horizontal and 8px vertical. Focus is the 2px ring. Invalid uses `--destructive`.                                                                                                                 |
| Checkbox                        | 16px box, radius 4px, inside the control target. Checked fill is `--primary`.                                                                                                                                                                             |
| Switch                          | 36×20 track, radius full, thumb does not grow on press. Checked track is `--primary`. The `tone="adaptive"` prop draws the same switch.                                                                                                                   |
| Dialog                          | Centered, radius 8px, max width 480px, padding 20px. Overlay is `rgb(0 0 0 / 0.4)`. Title uses `text-heading`. Footer actions are inline, not forced to half width.                                                                                       |
| Sheet                           | Radius 8px on the top corners. No drag handle. Under 768px, full width. From 768px, max width 480px. Desktop filters use a popover, not a sheet.                                                                                                          |
| Drawer                          | The mobile nav drawer. Border instead of shadow. 150ms.                                                                                                                                                                                                   |
| Select, popover, tooltip, toast | Border, radius 8px, no shadow. Toast uses `--foreground` on `--background` inverted (ink toast on light, paper toast on dark).                                                                                                                            |
| Calendar                        | Same titles and week start. Day cells are 6px squares, not pills.                                                                                                                                                                                         |
| Sidebar row                     | Active section: 2px `--sidebar-active` bar on the leading edge. Inactive label is `--sidebar-muted`.                                                                                                                                                      |
| Segmented tabs                  | `tablist` kept. Selected tab is an underline in `--foreground`, weight 600.                                                                                                                                                                               |
| Filter chips                    | Compact, radius 6px, `--selection-wash` / `--selection`. The remove control stays.                                                                                                                                                                        |
| Time picker                     | Text field plus a list of `:00`, `:15`, `:30`, `:45`. Confirm returns `ClockTime`. Locale formats stay. Any minute the field can parse is valid.                                                                                                          |
| List and detail headers         | One `text-title` heading. Summary figures use `text-heading`.                                                                                                                                                                                             |
