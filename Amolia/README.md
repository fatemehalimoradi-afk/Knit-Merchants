# Amolia

## Shop Information

| Field | Value |
| --- | --- |
| Shop | amolia-9448.myshopify.com |
| Shop Status | Active |
| Migration | FastBundle (17 July Incident ) → Knit Bundles |
| Source | Post-incident migration from FastBundle |
| Total Bundles | 5 |
| Bundle Status | Active (currently hidden) |
| HubSpot | [Amolia - Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/63053412161) |
| Unmet feature | in progress — bundles active but hidden / unresolved storefront issue |

## Customer Background

The merchant was previously using FastBundle. Following the incident, their bundles were migrated to Knit Bundles as part of the recovery process.

## Existing Bundle Setup

The merchant currently has five bundles. All bundles are active, but they are currently hidden from the storefront due to an unresolved issue.

See the attached screenshots and documentation for the bundle configurations.

## Renderer Function

### [`main bundle/renderer-function.js`](./main%20bundle/renderer-function.js)
Has a product **add-ons** widget: checkbox cards for selectors after the first (productSingle / collectionSingle / collectionMulti), with image, title, outbound product link, +price / compare-at, and optional variant `<select>` when selected.  
Syncs the first selector’s quantity from the theme PDP `quantity-input` via `nameless.dispatch("quantityChange")`, and shows a green “X% OFF” badge from percentage rewards.  
Uses `meta.title` (default “Product Add-ons”), a hardcoded Kystnær toiletry-bag subtitle, and an “Add bundle to cart” button (skipped when `meta.atcOverride` is set).  
Does **not** include volume-discount tier lists, gift strips, qty steppers on addons (qty is 0/1 checkbox), fixed discounts, or theme ATC hide/reposition logic.

**Cart / theme integration:** No cart drawer handling. Syncs qty with the theme PDP `quantity-input input.quantity__input[name="quantity"][form]`. Renders Knit ATC (`data-nameless-atc`); does not hide or move the theme Add to Cart / payment buttons.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/Amolia
- Bundle folder [`main bundle/`](./main%20bundle/) contains:
  - `renderer-function.js`
  - `styling.css`
