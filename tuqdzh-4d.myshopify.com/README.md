# tuqdzh-4d.myshopify.com

<!-- tags: tuqdzh-4d, myshopify, knit, knit-merchants, migration, fastbundle, incident, recovery, vd, volume-discount, nbv, draft, storefront, active, percentage-discount, qty-stepper, variant -->

## Shop Information

| Field | Value |
| --- | --- |
| Shop | tuqdzh-4d.myshopify.com |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Source | FastBundle incident recovery |
| Total Bundles | 1 |
| Bundle Status | Draft |

## Tags

`tuqdzh-4d` · `myshopify` · `knit` · `knit-merchants` · `migration` · `fastbundle` · `incident` · `recovery` · `vd` · `volume-discount` · `nbv` · `draft` · `storefront` · `active` · `percentage-discount` · `qty-stepper` · `variant`

## Customer Background

The merchant was previously using FastBundle. Following the incident, their bundle was rebuilt and migrated to Knit Bundles as part of the recovery process.

## Existing Bundle Setup

The merchant currently has one bundle, which is currently in Draft status.

See the attached screenshots for the bundle configuration.

## Renderer Function

### [`renderer-function.js`](./renderer-function.js)
Has a single-selector volume-discount (`nbv`) widget: “Buy N” / “Buy N or more” tiers, Save X% pills, /each pricing with compare-at, and a “Most popular” ribbon on the second tier.  
Selected tier expands a panel with quantity +/− stepper (for ranged tiers) and a Size/Options variant `<select>` when real variants exist.  
Uses `meta.title` / `meta.subtitle` for the heading, builds dynamic ATC copy (“Add N | save X%”), and can skip ATC when `meta.atcOverride` is set; shows a sold-out note when needed.  
Does **not** include gift strips, addon grids, optional checkbox products, fixed-amount discounts, multi-selector roles, or theme ATC hide/reposition logic.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/tuqdzh-4d.myshopify.com
- Files:
  - `renderer-function.js`
  - `styling.css`
  - `tags`
