---
version: "alpha"
name: Eco Terrarium
description: A canvas-first ecology simulator with a quiet field-observatory interface.
colors:
  background: "#081411"
  surface: "rgb(15 35 29 / .96)"
  surface-raised: "rgb(20 48 37 / .98)"
  primary: "#b5e6be"
  primary-strong: "#6bd18e"
  text: "#f0fdf4"
typography:
  title:
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
  readout:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  compact: "8px"
  control: "10px"
  group: "12px"
  dialog: "14px"
  panel: "16px"
  stage: "18px"
  pill: "999px"
spacing:
  compact: "8px"
  default: "16px"
  spacious: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#092016"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  dialog:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.dialog}"
    padding: "24px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "{spacing.default}"
  slider-track:
    backgroundColor: "rgb(203 213 225 / .16)"
    rounded: "{rounded.pill}"
  slider-thumb:
    backgroundColor: "{colors.primary-strong}"
    rounded: "{rounded.pill}"
---

# Design System: Eco Terrarium

## Overview

**Creative North Star: "The Quiet Field Observatory"**

The interface is an instrument panel for looking after a living micro-ecosystem. The terrarium remains the visual focus. Controls sit close by as calm, legible equipment rather than decorative floating cards. The design uses a single interaction accent so that a mutation action reads as a deliberate tool, not as a separate neon product.

The system is dark by design for the use scene: a player watches glowing organisms over time. It uses a single muted botanical accent and restrained tonal depth. It rejects rainbow utility colors, animated ornament, generic glass panels, and emoji used as interface icons.

## Colors

Deep forest surfaces make the simulation readable while the pale green accent identifies an actionable or selected state. The soft coral danger token is reserved for destructive or irreversible warnings. Trophic colors may appear only inside charts, creature portraits, and species data.

- **Night Canopy** (`#081411`): app background.
- **Observation Surface** (`rgb(15 35 29 / .96)`): panels and control groups.
- **Raised Observation Surface** (`rgb(20 48 37 / .98)`): dialogs and priority overlays.
- **Tank Interior** (`#06100e`): the terrarium frame and graph recesses.
- **Moss Light** (`#b5e6be`): primary action and focus-adjacent emphasis.
- **Readout Green** (`#6bd18e`): slider handles and selected live controls.
- **Fog Line** (`rgb(187 222 204 / .14)`): quiet structural borders.
- **Raised line treatment** (`rgb(187 222 204 / .28)`): raised-panel and modal borders. It is a border-only value, so it is documented here rather than forced into a background-only component schema.
- **Caution Coral** (`#e8a09a`): destructive warning copy only.

**The One Accent Rule.** Green is reserved for primary action, selected state, and healthy ecology. Other trophic colors describe data categories only. Buttons, tabs, modal headings, and filter selections never introduce a category color.

## Typography

**Body Font:** Pretendard with native Korean and system sans fallbacks.

Type stays compact and functional. Titles carry weight, control labels are semibold, and monospace is limited to measured values such as counts, temperature, and simulation time.

## Layout

Desktop uses a canvas-first split workspace with a fixed-width control rail. At tablet and mobile widths, the canvas stacks before the control rail and the page scrolls naturally. The top bar retains icon access on narrow screens while full text appears when space permits.

## Elevation & Depth

Depth is structural, not decorative. Panels use a quiet one-pixel line with a broad, low-opacity shadow. The terrarium is the deepest surface. Backdrop blur is restricted to readability layers: the in-canvas instruction, modal backdrop, and photo readout.

## Shapes

Small HUD tool and speed controls use 8px corners. Modal primary and close controls use 10px; grouped controls use 12px, dialogs use 14px, panels use 16px, and the terrarium is the only large rounded silhouette at 18px. Pill geometry is reserved for compact numeric counts and native range tracks and thumbs, never as a general container system.

## Components

### Buttons

- **Primary:** pale moss fill with dark text. Used for one clear action in a dialog, including catalyst injection and export.
- **Secondary options:** low-contrast recessed surface, quiet border, and a one-pixel press offset; their local radius follows the host component rather than a global button token.
- **Tool controls:** 44px minimum height, visible selected treatment, `aria-pressed`, icon plus text. Every selected tool uses the same moss treatment.
- **Dialogs:** opaque forest surface over a dimmed backdrop. Dialog section labels use weight and spacing, not a new accent color.

### Panels

- **Control rail:** tonal forest surface with a single border and generous internal gaps.
- **Environmental controls:** two-column desktop grid and one-column mobile flow.
- **Trophic cells:** compact, labeled data categories; their icons reinforce but never replace names.

### Inputs

- **Range:** `rgb(203 213 225 / .16)` thin neutral track with a `#6bd18e` high-contrast green thumb; native keyboard operation is preserved.
- **Caution:** modal errors use translucent coral fill and coral text/border, rather than a solid danger button.
- **Focus:** global controls use a pale-green 2px outline with 3px offset. Dialog text inputs use a moss border plus a translucent 2px outline with 2px offset.

## Do's and Don'ts

### Do:

- **Do** let the terrarium take the largest share of the viewport.
- **Do** use Lucide icons with visible labels when space allows. Icon-only utility actions on narrow screens retain an accessible name and native tooltip.
- **Do** support 44px touch targets and a visible keyboard focus state.
- **Do** use motion only as feedback, and disable nonessential motion for reduced-motion users.
- **Do** keep color-rich rendering inside the terrarium and its scientific data visualizations.

### Don't:

- **Don't** add generic glowing glass cards or rainbow gradients.
- **Don't** use emoji as UI icons.
- **Don't** add a new accent color without a data or state meaning.
- **Don't** use gradients, rainbow fills, or category-colored buttons for ordinary actions.
- **Don't** trap mobile controls inside a viewport-locked panel.
