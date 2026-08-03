# Oiwhite

## Shop Information

| Field | Value |
| --- | --- |
| Shop | fe8fae-af.myshopify.com |
| Brand | Oiwhite |
| Shop Status | Active |
| Migration | FastBundle → Knit Bundles |
| Total Bundles | 5 |
| Bundle Status | Draft (keep drafted) |
| HubSpot | [oiwhite - Knit Bundles](https://app.hubspot.com/contacts/48402902/record/0-3/62853658265) |
| Unmet feature | — |

## Customer Background

Customization request to create bundles with Knit. Knit was installed (Jul 22–23). Bundles should remain in **draft**.

## What we did / notes

- **Jul 22–23** — Collab / Knit install; status pending for customer.
- **Jul 28** — Customer activated volume-discount bundles but widget didn’t render; confused about “Bundle metaobject handle” (Content → Metaobjects empty).
- **Jul 28 (Fatemeh)** —
  1. Other 4 bundles are OK and display; please don’t change them.
  2. Metaobject handle → shop metaobject can be used later for non-archived products if needed; not required now.
  3. Setup is complete; no further work needed from merchant.
  - One product has **0 inventory** and is **archived** — that’s why that bundle doesn’t show; other bundles can be activated when ready.
  - Prefer merchant touches less; ask us to edit if needed.
  - Screenshots of metaobjects / handles shared for another bundle.

## Existing Bundle Setup

**5 bundles — keep drafted.**

See attached screenshots/docs for configs. Storefront copy is PT-BR (kits / fitas / launch pricing).

## Renderer Function

### [`main bundle/renderer-function.js`](./main%20bundle/renderer-function.js)
Has a PT-BR volume-discount tier widget (“Preço de Lançamento”): kit titles (1/2/3 Kits), hardcoded BRL price strings, ribbons (“Mais Vendido”, “Melhor Oferta”), and discount badges (10%/15% OFF + frete).  
Selected tier can expand per-unit variant slots (`#1…#N`) with Show/Hide, syncing a hidden `data-nameless-variant-selector` bridge.  
Supports % + fixed discount math from condition sets, Knit ATC (`ADICIONAR AO CARRINHO`, skippable via `meta.atcOverride`), and optional meta overrides (`title`, `unitsPerKit`, `unitLabel`, etc.).  
Does **not** include gift/addon checkbox lists, cart-drawer refresh/open bridge, or multi-selector BXGY rows.

**Cart / theme integration:** No cart drawer handling. Moves the Knit block before `product-buy-buttons-element`, then hides that theme buy-buttons element (`display: none`, `aria-hidden`, `data-nameless-hidden-theme-atc`) unless `meta.atcOverride` is set.

## Technical Assets

- Repo folder: https://github.com/fatemehalimoradi-afk/Knit-Merchants/tree/main/Oiwhite
- Bundle folder [`main bundle/`](./main%20bundle/) contains:
  - `renderer-function.js`
  - `styling.css`
