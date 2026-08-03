# solmarstore

## Shop Information

| Field | Value |
| --- | --- |
| Shop | solmarstore.myshopify.com |
| Brand | solmarstore |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Total Bundles | 1 (+ merchant duplicated onto a draft product) |
| Bundle Status | Active |
| HubSpot | [SOLMAR - Knit Bundles (July Crisis)](https://app.hubspot.com/contacts/48402902/record/0-3/62852811950) |
| Unmet feature | won't support — color swatches |

## Customer Background

One Knit bundle was built and activated. The merchant later duplicated it onto a draft product and changed some settings themselves.

## What we did / notes

- **Jul 22** — Size display issue fixed (all in-stock sizes, e.g. S / M / L, should show). Color swatches were requested (like Fast Bundle); **not supported in Nameless** — colors stay as text options.
- **Jul 23** — Follow-up (“goftam”).
- **Later** — Merchant activated the bundle.

## Existing Bundle Setup

Primary bundle created by us and activated. Merchant duplicated it onto a draft product and edited some things on their side.

## Renderer Function

### [`main bundle/renderer-function.js`](./main%20bundle/renderer-function.js)
Has a multi-tier “Buy N” volume/bundle widget (`nb-bundle`): tiers from condition sets, Save X% / Standard Price badges, totals-aware pricing when selected, and Knit ATC.  
Selected tier expands per-unit variant rows (`#1…`) with Size/Color (or option) `<select>`s that sync a hidden variant bridge.  
Supports % + fixed discounts across selectors in each condition set.  
Does **not** include color swatches (text dropdowns only), gift/addon checkbox BXGY lists, or a cart-drawer refresh/open bridge.

**Cart / theme integration:** No cart drawer handling. Mounts the block into `.main-product__details-wrapper` (before `.main-product__actions`, or after `product-selector`). CSS hides theme ATC via `body:has(.nameless-block) .main-product__form-buttons--addtocart { display: none !important }`.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/solmarstore
- Bundle folder [`main bundle/`](./main%20bundle/) contains:
  - `renderer-function.js`
  - `styling.css`
