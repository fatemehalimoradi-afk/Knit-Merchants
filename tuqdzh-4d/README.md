# tuqdzh-4d

## Shop Information

| Field | Value |
| --- | --- |
| Shop | tuqdzh-4d.myshopify.com |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Source | FastBundle incident recovery + CR: create bundles with Knit |
| Total Bundles | 1 |
| Bundle Status | Draft |
| HubSpot | No Knit Bundles deal / company found |
| Unmet feature | — |

## Customer Background

The merchant was previously using FastBundle. Following the incident, their bundle was rebuilt and migrated to Knit Bundles as part of the recovery process.

**Merchant never answers.** Collab/code was requested; they have not provided it.

## What we did / notes

- **Jul 23** — CR opened: create bundles with Knit (`tuqdzh-4d`). Asked merchant for collab code; Sepideh waiting on code. Fatemeh staged assets ready to approve once collab is granted.
- Bundles **were created** on our side even though merchant has not completed collab / replied.

## Existing Bundle Setup

One draft volume-discount bundle (customization assets below). See screenshots for config.

## Renderer Function

### [`main bundle/renderer-function.js`](./main%20bundle/renderer-function.js)
Has a single-selector volume-discount (`nbv`) widget: “Buy N” / “Buy N or more” tiers, Save X% pills, /each pricing with compare-at, and a “Most popular” ribbon on the second tier.  
**Ranged / last open tiers:** when selected, a quantity +/− stepper appears so the customer can buy **more than the tier minimum** (“Buy N or more”). Exact tiers stay fixed qty.  
Selected tier also shows a Size/Options variant `<select>` when real variants exist. Uses `meta.title` / `meta.subtitle`; ATC copy is dynamic (“Add N | save X%”); skippable via `meta.atcOverride`.  
Does **not** include gift strips, addon grids, optional checkbox products, fixed-amount discounts, multi-selector roles, or theme ATC hide/reposition logic.

**Cart / theme integration:** No cart drawer handling. Renders Knit ATC (`data-nameless-atc`) only; does not query, hide, or move theme product-form / payment buttons.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/tuqdzh-4d
- Bundle folder [`main bundle/`](./main%20bundle/) contains:
  - `renderer-function.js`
  - `styling.css`
