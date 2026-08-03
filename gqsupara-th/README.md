# gqsupara-th

## Shop Information

| Field | Value |
| --- | --- |
| Shop | gqsupara-th.myshopify.com |
| Brand | Supara / GQ |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Total Bundles | 26 |
| Bundle Status | Draft |
| HubSpot | [Supara Co., Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/62898896511) |
| Unmet feature | won't support — volume discount cart auto-detect |

## Customer Background

High-value FastBundle merchant migrated to Knit after the July incident. Knit installed; bundles drafted. Cart goal was activated on theme `Fast Bundle - Cart Goal`, then merchant asked to disable it (promo changed).

HubSpot thread: [Supara Co., Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/62898896511)

## Known gaps / unsupported

### Volume discount cart auto-detection — not available in Knit

Merchant (Tantus, Jul 26) asked for FastBundle-style **volume discount auto-detection in the cart**: e.g. underwear “buy 3 for 990” should still apply when the customer adds different variants one-by-one (not only when using the PDP widget).

**We do not support this in Knit Bundles.** Maha confirmed in HubSpot that Knit cannot auto-detect quantity bundles in the cart; feedback was passed to product. Original FastBundle behavior is saved on our side if they reinstall FB later.

This is a product gap for this merchant — not a missing renderer asset.

Other follow-ups:

- BOGO / free-gift widget image ratio (original, not square) — addressed in archived BXGY CSS via `object-fit: contain` + max height
- Bundle discounts combinable with product / order / shipping discounts — still open / with tech

## Existing Bundle Setup

26 draft bundles share **12 distinct widget JS implementations**. Archived samples cover the main families:

1. **Volume `rw-widget`** — sample **121**
2. **Volume `gq-widget`** — sample **105**
3. **BXGY plan / BOGO** — sample **125** (Perfect Polo BoGo)
4. **BXGY checkbox addon** — samples **127** / **128** (identical JS/CSS; also **129**)

## Renderer Functions

### [`121-rw-volume/renderer-function.js`](./121-rw-volume/renderer-function.js)

Volume-discount widget (`rw-widget`). Collection-aware product resolve from PDP `data-product-id`. Tier cards with per-pair pricing, compare-at, red ribbons on mid/last tiers. **Last tier is treated as open-ended** in qty matching. Hidden variant bridge + Knit ATC + Buy it now → `/checkout`.

**Cart / theme integration:** No cart drawer bridge. Moves Knit block before `form .product-add-to-cart-container` / `.product-form__buttons`, then hides that theme ATC container.

Same widget family also on: 121, 133, 153, 154, 155 (near-duplicate: 123).

### [`105-gq-volume/renderer-function.js`](./105-gq-volume/renderer-function.js)

Volume-discount widget (`gq-widget`). Exact-qty tiers (“Buy more, Save more”), THB formatting (`th-TH`), save amount line, flag ribbons, optional `meta.tierTitles` / `meta.unitSuffix` / `meta.atcOverride`. Auto-selects first tier when none selected. Knit ATC + Buy it now → `/checkout`.

**Cart / theme integration:** No cart drawer bridge. Moves Knit block before `product-form .product-form__buttons` / cart-add form; hides theme buttons (and Shopify payment button when wrapper is missing) unless `meta.atcOverride`.

Same widget family also on: 105, 134, 135 (near-duplicates: 106, 107).

### [`125-bxgy-bogo/renderer-function.js`](./125-bxgy-bogo/renderer-function.js)

BXGY / free-gift **plan picker** (`bxgy-widget`). Splits selectors into included PDP vs addon gift options; radio-style row buttons (`data-bxgy-plan`) so only one gift is selected; shows “Free” + compare-at; optional header + “Free gift” badge from `meta.title` / `meta.heading`. Variant `<select>` per row. Images use original aspect (`object-fit: contain`). Repositions widget before Genlook try-on button when present. Enforces single selection when multiple addons are checked.

**Cart / theme integration:** No Knit ATC / no theme ATC hide. Relies on theme product form; included selectors forced to qty 1 via hidden inputs. No cart drawer bridge.

Sample: **125** Perfect Polo BoGo. Related BOGO family variants also on 136–139 (different JS hashes).

### [`127-bxgy-checkbox/renderer-function.js`](./127-bxgy-checkbox/renderer-function.js)

BXGY **checkbox addon** list (`bxgy-widget`). Heuristic picks which selectors to show (qty 0–1 gift conditions, ~100% rewards, discounted non-PDP products). Checkbox toggle per row with Free / priced final + compare-at and optional variant select. Images `object-fit: contain`.

**Cart / theme integration:** No Knit ATC / no theme ATC hide / no cart drawer. Theme form handles checkout; qty is 0/1 via checkbox + hidden number input.

Identical assets on **127**, **128**, and **129**. Samples kept:

- **127** — Minimal Hoodie + Minimal Sweatpants set
- **128** — Light Shaver + free Foldable Mirror gift

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/gqsupara-th
- [`121-rw-volume/`](./121-rw-volume/) — `renderer-function.js`, `styling.css`
- [`105-gq-volume/`](./105-gq-volume/) — `renderer-function.js`, `styling.css`
- [`125-bxgy-bogo/`](./125-bxgy-bogo/) — `renderer-function.js`, `styling.css`
- [`127-bxgy-checkbox/`](./127-bxgy-checkbox/) — `renderer-function.js`, `styling.css`
- [`128-bxgy-checkbox/`](./128-bxgy-checkbox/) — same widget as 127 (set vs gift config)
- Headless API: https://app.knit-bundle.co/headless/bundles?shop=gqsupara-th.myshopify.com
