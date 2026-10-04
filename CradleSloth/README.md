# CradleSloth

## Shop Information

| Field | Value |
| --- | --- |
| Shop | CradleSloth |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Source | Upsell communication |
| Total Bundles | 3 (each has more than 1 discount logic) |
| Bundle Status | Active |
| HubSpot | [CradleSloth - Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/61024739185) |
| Unmet feature | — |

## Customer Background

The merchant was previously using FastBundle and agreed to migrate to Knit Bundles through an upsell process. They provided documentation and screenshots explaining the expected storefront behavior.

## Existing Bundle Setup

The merchant currently has three primary bundles:

1. **Volume Discount for Eye Masks** → [`eyemask/`](./eyemask/)
2. **Volume Discount for Pillowcases** → [`pillowcase/`](./pillowcase/)
3. **Volume Discount for Pillows** (including Eye Masks and Pillowcases) → [`pillow/`](./pillow/)

See the attached screenshots and documentation for the exact bundle configurations.

## Renderer Functions

### [`pillow/renderer-function.js`](./pillow/renderer-function.js)
Has a full multi-selector widget: primary pillow VD tiers (1x–4x), free gift pillowcase strip, Extra Pillowcases addon grid, and an optional EyeMask “complete the look” checkbox with qty stepper.  
Supports variant dropdowns, % + fixed + set-price discounts, sold-out / inventory checks, and hides the theme Add to Cart in favor of the Knit ATC.  
Hardcodes CradleSloth copy (Single / Partner / Family titles, Memory Foam + Pillowcase lines, BackOrder Sale badges).  
Does **not** work as a simple single-product VD — it expects primary + gift/volume/optional selector roles and will omit whole sections if those selectors are missing.

**Cart / theme integration:** No cart drawer handling. Moves the Knit block before the theme ATC (`.product-form__buttons` / `form[action*="/cart/add"]` / `button[name="add"]`), then hides those theme buttons (`display: none`, `aria-hidden`, `data-nameless-hidden-theme-atc`). Also hides `.shopify-payment-button` / `[data-shopify="payment-button"]` when the buttons wrapper is missing.

### [`pillowcase/renderer-function.js`](./pillowcase/renderer-function.js)
Has a single-selector volume-discount tier list (“Bundle & Save”) with /ea pricing, compare-at strike, and Most Popular / Most Savings badges.  
Picks the product from the page `data-product-id` (or first resolved selector) and forces tier titles toward “Original Pillowcase”.  
Includes Knit ATC and repositions/hides the theme product-form buttons. Supports % + fixed + set-price display math.  
Does **not** include gift strips, addon grids, optional checkbox products, variant `<select>` UI, or multi-selector role detection.

**Cart / theme integration:** No cart drawer handling. Inserts the widget before `.product-form__buttons` / cart-add form / submit button, then hides `.product-form__buttons` (or the add button if the wrapper is missing). Does not target Shopify payment buttons or a cart drawer.

### [`eyemask/renderer-function.js`](./eyemask/renderer-function.js)
Has a single-selector volume-discount tier list with named packs (1x Single → 4x Family Plus) and two description lines per tier (Eyemask + Travel Pouch).  
Same core VD math as pillowcase: exact qty conditions, % / fixed / set-price discounts, badges, ATC, theme button hide.  
Shows pack titles + line items instead of only “Nx Product name”.  
Does **not** include gift/addon/optional sections, variant dropdowns, or the multi-selector pillow layout.

**Cart / theme integration:** Same as pillowcase — no cart drawer; repositions before theme ATC and hides `.product-form__buttons` or the add button. No payment-button or cart-drawer logic.

## Set price

All three renderers now treat a set-price reward as the pack price for that qty (not an amount off). Displayed `/ea` is `amount / qty` when `mode` is `TOTAL` (default), or `amount` when `mode` is `PER_UNIT`. Set price wins over % and fixed for **display**.

Priority:

1. Condition-set reward with `type: "setPrice"` / `"set_price"` (or an `unknown` reward whose raw type matches `set_price`)
2. `snapshot.meta.setPrices` — e.g. `{ "1": 59, "2": 98, "3": 135, "4": 160 }`
3. The `SET_PRICES` map at the top of each renderer (same shape)
4. Existing % + fixed math

Knit checkout still applies only % / fixed rewards. Keep those configured so the cart total matches the widget, or fill `SET_PRICES` for display-only while % / fixed handle the discount.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/CradleSloth
- Each bundle folder contains:
  - `renderer-function.js`
  - `styling.css`
