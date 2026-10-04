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

### [`vd-addon/renderer-function.js`](./vd-addon/renderer-function.js)
**New bundle.** Volume discount on top, optional add-on below, **one** Add to cart.  
Style matches the FastBundle screenshots: radio tiers with `+ Shipping` / `FREE SHIPPING` pills, then “Grab a grip” checkbox card, then a pink pill ATC.

Configure as **one Knit bundle**:
1. Selector 1 — PDP product. Quantity conditions = VD tiers.
2. Selector 2+ — optional add-on (overgrip). Quantity 0–1. Put the add-on % reward on these selectors.

| Meta | Default |
| --- | --- |
| `title` | Buy More... Save More... |
| `addonTitle` | Grab a grip |
| `addonSubtitle` | Soft & Tacky with Antibacterial Protection |
| `atcLabel` | Add to cart |
| `tierTitles` | `{ "5": "5 tubes (20 balls)", "18": "1 box (18 tubes)", "54": "3 boxes (54 tubes)" }` |
| `tierBadges` | `{ "5": "+ Shipping", "18": "+ Shipping", "54": "FREE SHIPPING" }` |

**Cart / theme integration:** After a successful add, reloads the page. Moves the Knit block before `form .product-add-to-cart-container` and hides that theme ATC.

### [`3 balls/renderer-function.js`](./3%20balls/renderer-function.js)
**New bundle.** FastBundle-style “Buy more, Save more” volume widget for **3 balls per tube**.  
Tier titles default to `N balls (N tube/tubes)`; the last tier uses `N ball box (N tubes)` with the badge under the title.  
First tier is selected by default. ATC is a single **Add to cart** button (no Buy it now unless `showBuyNow` is true).  
**Last tier is open-ended:** when selected, a quantity +/− stepper appears so the customer can buy **more than the tier minimum**. Earlier tiers are exact quantities only.

| Meta | Default |
| --- | --- |
| `heading` | Buy more, Save more |
| `atcLabel` | Add to cart |
| `unitsPerKit` | 3 |
| `unitLabel` | balls |
| `kitLabel` | tube |
| `kitLabelPlural` | tubes |
| `lastTierBoxLabel` | ball box |
| `midTierBadge` | SAVE 10% |
| `lastTierBadge` | SAVE 25% + FREE SHIPPING |
| `popularLabel` | Most Popular |
| `showBuyNow` | false |

**Cart / theme integration:** On ATC success: dispatches `cart:refresh`, then clicks `a[href*="/cart"]` after 100ms. Moves Knit block before `form .product-add-to-cart-container` and hides that theme ATC container. Optional Buy it now (`showBuyNow`) triggers ATC then redirects to `/checkout`.

### [`4 balls/renderer-function.js`](./4%20balls/renderer-function.js)
**New bundle.** FastBundle-style “Special offer!” volume widget for **4 balls per tube**.  
Exact qty tiers: `Buy 1 tube (4 balls)`, `Buy 3 tubes (12 balls)`, `Buy 6 tubes (24 balls)`, `Buy an 18 tube box (72 balls)`.  
Badges: money-off + FREE SHIPPING on mid tiers, `Save 30% + FREE SHIPPING` on the box. Ribbons: **Best Seller** on 6 tubes, **Best Value** on the 18-tube box.  
First tier is selected by default. ATC is **Add to cart** until the last (open) tier is selected, then it becomes **Buy N | save X%** and a quantity +/− stepper appears. Earlier tiers are exact quantities only.  
**Set price:** Knit `setPrice` wins for display. Fallback map: `{ 1: 7.75, 3: 19.99, 6: 34.99, 18: 97.65 }`. Compare-at is unit price × qty (`£7.75`).

| Meta | Default |
| --- | --- |
| `title` / `heading` | Special offer! |
| `atcLabel` | Add to cart |
| `unitsPerKit` | 4 |
| `unitLabel` | balls |
| `kitLabel` | tube |
| `kitLabelPlural` | tubes |
| `midRibbon` | Best Seller |
| `lastRibbon` | Best Value |
| `shippingBadge` | FREE SHIPPING |
| `showBuyNow` | false |
| `setPrices` | `{ "1": 7.75, "3": 19.99, "6": 34.99, "18": 97.65 }` |

Configure as **one Knit bundle** with exact quantity conditions `1`, `3`, `6`, `18` and set-price rewards `£7.75` / `£19.99` / `£34.99` / `£97.65`. Keep % / fixed rewards so checkout matches the widget.

**Cart / theme integration:** On ATC success: dispatches `cart:refresh`, then clicks `a[href*="/cart"]` after 100ms. Moves Knit block before `form .product-add-to-cart-container` and hides that theme ATC container.

### [`boxes/renderer-function.js`](./boxes/renderer-function.js)
**New bundle.** FastBundle-style “Buy More... Save More...” volume widget for **4-ball tubes / 18-tube boxes**.  
Tiers: `5 tubes (20 balls)` + Shipping, `1 box (18 tubes)` + Shipping, `3 boxes (54 tubes)` FREE SHIPPING.  
Badges sit inline next to the title (no ribbons). First tier is selected by default.  
**Last tier is open-ended:** quantity +/− stepper; ATC becomes **Buy N | save X%** (Knit %). Earlier tiers are exact quantities. Above 54, a multiple of 18 becomes `N boxes (qty tubes)`.

| Meta | Default |
| --- | --- |
| `title` / `heading` | Buy More... Save More... |
| `atcLabel` | Add to cart |
| `unitsPerKit` | 4 |
| `tubesPerBox` | 18 |
| `tierTitles` | `{ "5": "5 tubes (20 balls)", "18": "1 box (18 tubes)", "54": "3 boxes (54 tubes)" }` |
| `tierBadges` | `{ "5": "+ Shipping", "18": "+ Shipping", "54": "FREE SHIPPING" }` |
| `showBuyNow` | false |

Configure as **one Knit bundle** with quantity conditions `5` (30%), `18` (32%), `54+` (32%). Prices are unit × qty minus that %.

**Cart / theme integration:** On ATC success: dispatches `cart:refresh`, then clicks `a[href*="/cart"]` after 100ms. Moves Knit block before `form .product-add-to-cart-container` and hides that theme ATC container.

### [`more balls/renderer-function.js`](./more%20balls/renderer-function.js)
**New bundle.** FastBundle-style “More balls > More discount” volume widget for **4-ball tubes**.  
Tiers: `4 balls (1 tube)`, `12 balls (3 tubes)` SAVE 14%, `24 balls (6 tubes)` SAVE 25%, `18 tube box + (72 balls)` SAVE 30% + FREE SHIPPING.  
Last-tier ribbon: **Most Popular**. First tier is selected by default.  
**Last tier is open-ended:** quantity +/− stepper; ATC becomes **Buy N | save 30%**. Above 18, the ball count is `4 × qty`.  
**Set price:** `{ 1: 7.75, 3: 19.99, 6: 34.99, 18: 97.65 }`. Displayed save % prefers the Knit percentage.

| Meta | Default |
| --- | --- |
| `title` / `heading` | More balls > More discount |
| `atcLabel` | Add to cart |
| `unitsPerKit` | 4 |
| `lastRibbon` / `popularLabel` | Most Popular |
| `shippingBadge` | FREE SHIPPING |
| `showBuyNow` | false |
| `setPrices` | `{ "1": 7.75, "3": 19.99, "6": 34.99, "18": 97.65 }` |

Configure as **one Knit bundle** with quantity conditions `1`, `3`, `6`, `18+` and matching set-price or % rewards (14% / 25% / 30%).

**Cart / theme integration:** On ATC success: dispatches `cart:refresh`, then clicks `a[href*="/cart"]` after 100ms. Moves Knit block before `form .product-add-to-cart-container` and hides that theme ATC container.

### [`tubes/renderer-function.js`](./tubes/renderer-function.js)
**New bundle.** FastBundle-style “Buy More... Save More...” volume widget for **1 / 3 / 18 tubes**.  
Tiers: `1 tube (4 balls)`, `3 tubes (12 balls)` Save 5%, `18 tubes (1 box)` Save 10%.  
Badges are inline Save X% from the Knit percentage. No ribbons. First tier is selected by default.  
**Last tier is open-ended:** quantity +/− stepper; ATC becomes **Buy N | save X%**. Above 18, a multiple of 18 becomes `N tubes (M boxes)`; otherwise `N tubes (4×N balls)`.

| Meta | Default |
| --- | --- |
| `title` / `heading` | Buy More... Save More... |
| `atcLabel` | Add to cart |
| `unitsPerKit` | 4 |
| `tubesPerBox` | 18 |
| `tierTitles` | `{ "1": "1 tube (4 balls)", "3": "3 tubes (12 balls)", "18": "18 tubes (1 box)" }` |
| `showBuyNow` | false |

Configure as **one Knit bundle** with quantity conditions `1` (0%), `3` (5%), `18+` (10%). Prices are unit × qty minus that % (£7.25 → £7.25 / £20.66 / £117.45).

**Cart / theme integration:** On ATC success: dispatches `cart:refresh`, then clicks `a[href*="/cart"]` after 100ms. Moves Knit block before `form .product-add-to-cart-container` and hides that theme ATC container.

### [`72 balls/renderer-function.js`](./72%20balls/renderer-function.js)
**New bundle.** FastBundle-style “More balls... More discount...” volume widget for **72 balls per unit**.  
Tier 1 title is `Buy 1 (72 balls)`. Discounted tiers use `Buy N = Save X%`; the last tier is open-ended (`Buy N or more = Save X%`) with a quantity +/− stepper.  
Middle tier ribbon: **Most popular**. Last tier ribbon: **Best Value**. Mid + last badges default to `+ FREE SHIPPING`.  
First tier is selected by default. ATC is **Add to cart** until the last (open) tier is selected, then it becomes **Buy N | save X%**. No Buy it now unless `showBuyNow` is true.  
**PDP packaging sync:** If the product page has a `variant-selects` Packaging control (Bucket / Poly Bag radios), the widget uses that variant for price, ATC, and default packaging slots. Changing the theme radios updates the bundle; changing a packaging slot writes back to the theme selector when options match.  
**Set price:** A Knit `setPrice` / `set_price` reward is the pack price for that qty (not an amount off). `TOTAL` (default) is the pack total; `PER_UNIT` is per unit. Set price wins over % and fixed for **display**. Fallback: `snapshot.meta.setPrices` (e.g. `{ "1": 75.99, "2": 144.38, "3": 205.17 }`). Keep % / fixed rewards configured so checkout matches the widget.

| Meta | Default |
| --- | --- |
| `title` / `heading` | More balls... More discount... |
| `atcLabel` | Add to cart |
| `unitsPerKit` | 72 |
| `unitLabel` | balls |
| `midTierBadge` | + FREE SHIPPING |
| `lastTierBadge` | + FREE SHIPPING |
| `midRibbon` / `popularLabel` | Most popular |
| `lastRibbon` | Best Value |
| `packagingLabel` | Choose Packaging |
| `hideLabel` | Hide |
| `showLabel` | Show |
| `showBuyNow` | false |
| `setPrices` | optional `{ "1": 75.99, "2": 144.38, "3": 205.17 }` if rewards are not `setPrice` |

Configure as **one Knit bundle** with quantity conditions `1` (0%), `2` (5%), `3+` (10%). Prefer a **collection** of packaging products so each slot can pick Bucket / Box / etc. Override titles/badges with `tierTitles` / `tierBadges` if needed.

**Cart / theme integration:** On ATC success: dispatches `cart:refresh`, then clicks `a[href*="/cart"]` after 100ms. Moves Knit block before `form .product-add-to-cart-container` and hides that theme ATC container. Optional Buy it now (`showBuyNow`) triggers ATC then redirects to `/checkout`.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/mantis-sport-intl
- Bundle folder [`main bundle/`](./main%20bundle/) contains:
  - `renderer-function.js`
  - `styling.css`
- Bundle folder [`vd-addon/`](./vd-addon/) contains:
  - `renderer-function.js`
  - `styling.css`
- Bundle folder [`3 balls/`](./3%20balls/) contains:
  - `renderer-function.js`
  - `styling.css`
- Bundle folder [`4 balls/`](./4%20balls/) contains:
  - `renderer-function.js`
  - `styling.css`
- Bundle folder [`boxes/`](./boxes/) contains:
  - `renderer-function.js`
  - `styling.css`
- Bundle folder [`tubes/`](./tubes/) contains:
  - `renderer-function.js`
  - `styling.css`
- Bundle folder [`more balls/`](./more%20balls/) contains:
  - `renderer-function.js`
  - `styling.css`
- Bundle folder [`72 balls/`](./72%20balls/) contains:
  - `renderer-function.js`
  - `styling.css`
