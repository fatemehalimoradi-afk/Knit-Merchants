# CradleSloth

<!-- tags: cradlesloth, knit, knit-merchants, migration, fastbundle, upsell, vd, volume-discount, addon, gift, multi-tier, multi-selector, eyemask, pillow, pillowcase, storefront, active -->

## Shop Information

| Field | Value |
| --- | --- |
| Shop | CradleSloth |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Source | Upsell communication |
| Total Bundles | 3 (each has more than 1 discount logic) |
| Bundle Status | Active |

## Tags

Searchable labels for this merchant (also mirrored in each bundle folder):

`cradlesloth` · `knit` · `knit-merchants` · `migration` · `fastbundle` · `upsell` · `vd` · `volume-discount` · `addon` · `gift` · `multi-tier` · `multi-selector` · `eyemask` · `pillow` · `pillowcase` · `storefront` · `active`

## Customer Background

The merchant was previously using FastBundle and agreed to migrate to Knit Bundles through an upsell process. They provided documentation and screenshots explaining the expected storefront behavior.

## Existing Bundle Setup

The merchant currently has three primary bundles:

1. **Volume Discount for Eye Masks** → [`eyemask/`](./eyemask/)  
   tags: `vd` `volume-discount` `eyemask` `multi-tier`
2. **Volume Discount for Pillowcases** → [`pillowcase/`](./pillowcase/)  
   tags: `vd` `volume-discount` `pillowcase` `multi-tier`
3. **Volume Discount for Pillows** (including Eye Masks and Pillowcases) → [`pillow/`](./pillow/)  
   tags: `vd` `volume-discount` `addon` `gift` `multi-selector` `pillow` `eyemask` `pillowcase`

See the attached screenshots and documentation for the exact bundle configurations.

## Renderer Functions

### [`pillow/renderer-function.js`](./pillow/renderer-function.js)
Has a full multi-selector widget: primary pillow VD tiers (1x–4x), free gift pillowcase strip, Extra Pillowcases addon grid, and an optional EyeMask “complete the look” checkbox with qty stepper.  
Supports variant dropdowns, % + fixed discounts, sold-out / inventory checks, and hides the theme Add to Cart in favor of the Knit ATC.  
Hardcodes CradleSloth copy (Single / Partner / Family titles, Memory Foam + Pillowcase lines, BackOrder Sale badges).  
Does **not** work as a simple single-product VD — it expects primary + gift/volume/optional selector roles and will omit whole sections if those selectors are missing.

### [`pillowcase/renderer-function.js`](./pillowcase/renderer-function.js)
Has a single-selector volume-discount tier list (“Bundle & Save”) with /ea pricing, compare-at strike, and Most Popular / Most Savings badges.  
Picks the product from the page `data-product-id` (or first resolved selector) and forces tier titles toward “Original Pillowcase”.  
Includes Knit ATC and repositions/hides the theme product-form buttons.  
Does **not** include gift strips, addon grids, optional checkbox products, variant `<select>` UI, or multi-selector role detection.

### [`eyemask/renderer-function.js`](./eyemask/renderer-function.js)
Has a single-selector volume-discount tier list with named packs (1x Single → 4x Family Plus) and two description lines per tier (Eyemask + Travel Pouch).  
Same core VD math as pillowcase: exact qty conditions, % / fixed discounts, badges, ATC, theme button hide.  
Shows pack titles + line items instead of only “Nx Product name”.  
Does **not** include gift/addon/optional sections, variant dropdowns, or the multi-selector pillow layout.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/CradleSloth
- Each bundle folder contains:
  - `renderer-function.js`
  - `styling.css`
  - `tags` (searchable keyword list)
