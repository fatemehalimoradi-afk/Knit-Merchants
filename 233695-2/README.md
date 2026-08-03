# 233695-2

## Shop Information

| Field | Value |
| --- | --- |
| Shop | 233695-2.myshopify.com |
| Brand | Bergmanns |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Total Bundles | 1 (ours) |
| Bundle Status | Active (has been live for a while) |
| HubSpot | [Bergmanns - Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/62853180791) |
| Unmet feature | — |

## Customer Background

Bergmanns Naturkosmetik migrated to Knit Bundles. German storefront (EUR). We built **one** volume-discount bundle (**81**); it has been **activated / live for a while**.

## Existing Bundle Setup

- **81** (ours) — Natürliche Mattpaste (`the-natural-hair-wax`): exact qty tiers 1 / 2 / 3, fixed discounts, custom `qp-widget` assets (archived below). **Active.**
- **171** (likely merchant-created) — Natürliches Haarkräftigungsserum (`haarwachstum-serum`): same title pattern, no custom assets. Not part of our deliverable; ignore for documentation unless needed.

## Renderer Function

### [`81-qp-volume/renderer-function.js`](./81-qp-volume/renderer-function.js)

Volume-discount widget (`qp-widget`). German copy (“Kaufe mehr und spare!”, “IN DEN WARENKORB”, “Am beliebtesten”). Tier cards with per-tier custom images (FastBundle CDN fallbacks + `meta.tierImages`), “Spare X€” subtitles, EUR pricing (`€x,xx`), hardcoded compare display fallbacks, popular ribbon (default mid tier). Exact qty only (`minimum === maximum`). Auto-selects popular tier when none selected. Knit ATC (skippable via `meta.atcOverride`).

**Cart / theme integration:** Patches `fetch` for `/cart/add` then refreshes/opens theme `mini-cart` via section rendering. Moves Knit block before `product-form .product-form__buttons` / cart-add form and hides theme ATC (and Shopify payment button when wrapper is missing) unless `meta.atcOverride`.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/233695-2
- [`81-qp-volume/`](./81-qp-volume/) — `renderer-function.js`, `styling.css`
- Headless API: https://app.knit-bundle.co/headless/bundles?shop=233695-2.myshopify.com
