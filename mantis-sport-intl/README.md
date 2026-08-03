# mantis-sport-intl

## Shop Information

| Field | Value |
| --- | --- |
| Shop | mantis-sport-intl.myshopify.com |
| Brand | mantis-sport-intl |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Total Bundles | 10 |
| Bundle Status | Draft |
| HubSpot | [MANTIS - Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/62853178547) |
| Unmet feature | won't support — pre-order |

## Customer Background

Merchant was asked to install Knit Bundles and approve collab. Bundles were rebuilt in Knit.

## What we did / notes

- **Jul 21** — Ask merchant to install Knit + approve collab; status to key account.
- **Jul 23** — Message for customer: all bundles were created in Knit Bundles, but **pre-order is not supported** in Knit Bundle right now. Bundles that are **in stock** can be activated.

## Existing Bundle Setup

**10 draft** bundles. In-stock ones can be activated by the merchant; pre-order / pre-order stock workflow is not available in Knit yet.

## Renderer Function

### [`main bundle/renderer-function.js`](./main%20bundle/renderer-function.js)
Has a “Buy more, save more” volume-discount widget (`rw-widget`): tube/balls tier titles, Save X% + FREE SHIPPING badges, Best Seller / Best Value ribbons.  
**Last tier is open-ended:** when selected, a quantity +/− stepper appears so the customer can buy **more than the tier minimum** (not locked to a fixed qty). Earlier tiers are exact quantities only.  
Supports collection selectors, % + fixed discounts, Knit ATC (dynamic “Buy N | save X%”), optional Buy it now → `/checkout`, and a hidden variant bridge.  
Does **not** support pre-order inventory workflows, gift/addon checkbox lists, or per-unit multi-slot variant pickers like Oiwhite/solmarstore.

**Cart / theme integration:** On ATC success: dispatches `cart:refresh`, then clicks `a[href*="/cart"]` after 100ms (opens cart / drawer depending on theme). Moves Knit block before `form .product-add-to-cart-container` and hides that theme ATC container. Buy it now triggers ATC then redirects to `/checkout`.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/mantis-sport-intl
- Bundle folder [`main bundle/`](./main%20bundle/) contains:
  - `renderer-function.js`
  - `styling.css`
