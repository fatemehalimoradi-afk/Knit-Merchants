# monomods

## Shop Information

| Field | Value |
| --- | --- |
| Shop | vviw2g-6q.myshopify.com |
| Brand | monomods |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Total Bundles | 7 |
| Bundle Status | Active |
| CSS | Merchant has edited CSS themselves |
| HubSpot | [MONOMODS - Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/62853356384) |
| Unmet feature | — |

## Customer Background

Bundles were recreated in Knit Bundles (initially drafted, then activated). Follow-up fixes focused on cart/drawer behavior after add-to-cart.

## What we did

- **Jul 26** — All bundles recreated in Knit Bundles in drafted status.
- **Jul 29** — Cart refresh / open behavior confirmed with:

```js
document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
  bubbles: true
}));
document.querySelector('a[href="/cart"]').click()
```

- **Jul 29** — Items 1 and 3 fixed; item 2 matched what we see / the sample screenshot. Status moved to done (Sepideh Jalali / key account).

## Existing Bundle Setup

The merchant currently has **7 active bundles**. Renderer/CSS below is the shared BXGY “matching bracelet” addon pattern used for the storefront widget.

See attached screenshots/docs for exact per-bundle configs. Note: merchant has changed CSS on their side.

## Renderer Function

### [`main bundle/renderer-function.js`](./main%20bundle/renderer-function.js)
Has a BXGY addon list (“Choose a matching bracelet”): checkbox rows with image, title, Free / priced final + compare-at, and optional variant `<select>`.  
Picks which selectors to show via condition/reward heuristics (qty 0–1 gift, ~100% discount, discounted non-PDP products, etc.) and skips the current PDP product.  
Installs a global `__namelessCartDrawerBridge` that patches `fetch` for `/cart/add`, refreshes/opens cart, mocks `product-form.cart`, and can block a native cart-add submit right after an add.  
Does **not** render Knit ATC or volume-discount tiers — addons are checkbox-only (qty 0/1); relies on the theme product form for checkout.

**Cart / theme integration:** **Yes — cart drawer bridge.** On successful `/cart/add` fetch: dispatches `cart:refresh` on `document.documentElement`, then clicks `a[href="/cart"]` (and `/cart?` / `/cart` variants). Also moves the Knit block before `[id*="product-form-main-"]` / cart-add form. Does not hide theme ATC; warns on `beforeunload` if the theme hard-navigates to `/cart` after add.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/monomods
- Bundle folder [`main bundle/`](./main%20bundle/) contains:
  - `renderer-function.js`
  - `styling.css`
