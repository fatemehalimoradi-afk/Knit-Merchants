# Kowloon

## Shop Information

| Field | Value |
| --- | --- |
| Shop | Kowloon |
| App | Fast Bundle |
| Bundle type | Mix & Match |
| Unmet feature | a different gift product on each quantity tier |

## Question

Eligible products come from one group or collection.

- Buy any 1 eligible item → Gift A
- Buy any 2 eligible items, including a mix of different products → Gift B
- Buy any 3 or more eligible items → Gift C

Product A + Product B must count as 2 eligible items. The customer must not have to buy 2 units of the same product.

## Answer

Mixed products do count toward one quantity. Use **Mix & Match**, with one section for the eligible collection (or a manual product list). The quantity is the total number of items chosen from that section, so Product A + Product B is 2.

A different gift product on each tier (Gift A, then Gift B, then Gift C) is not a Fast Bundle discount type.

| Goal | Setting |
| --- | --- |
| Mix different products, and the reward changes with the quantity | **Mix & Match → Tiered discount** |
| One specific product free when they reach one quantity | **Mix & Match → Single discount → Free gift** on the gift section |
| Gift A at 1, Gift B at 2, Gift C at 3+ | Not available in one bundle |

Volume Discount is the wrong type. It counts units of one product, so 2 eligible items means 2 of that product.

## Setup — mixed quantity, tiered reward

Use this when each tier can be a price offer (percentage, fixed amount, cheapest item free, free shipping, set price, or no discount). Fast Bundle allows **up to 3** tiers. The last tier can stay open with **Allow users to buy extra items with this discount option**, which covers 3+.

1. **Create new bundle** → **Mix & Match**.
2. **Add section** → the eligible group.
   - **Collections**: one Shopify collection per section.
   - **Products**: a manual list that exists only in this bundle.
3. Bundle structure: **Tiered discount**.
4. Add three discount options. The number is the total items from the section, in any combination:

| Option | Items | Open-ended | Reward |
| --- | --- | --- | --- |
| 1 | 1 | no | the tier-1 offer |
| 2 | 2 | no | the tier-2 offer |
| 3 | 3 | **Allow users to buy extra items with this discount option** | the tier-3 offer |

5. Leave section rules off, or set the eligible section to **no requirement**. Do not set **exact quantity 2** on a single product.
6. Save, then turn the bundle on.

Optional range: option 1 = 1, option 2 = 2, option 3 = 3 and up via the extra-items toggle. A range and a set price cannot be used together with that toggle.

Help: [Tiered Discount Mix & Match](https://intercom.help/fast-bundle-faq/en/articles/13168741-your-guide-to-mix-match-bundles-from-setup-to-success).

## Setup — one free gift product

Use this when the gift is one specific product, at one threshold (for example, any 2 eligible items → that gift).

1. **Create new bundle** → **Mix & Match**.
2. **Add section** → eligible collection or product list. Section rule: **Minimum quantity** equal to the threshold (2), or a range.
3. **Add section** → the gift product. Section rule: **Exact quantity** 1.
4. **Discount application** → **Apply discount to specific sections only** → select the gift section.
5. Discount type: **Free gift**.
6. Save.

Product A + Product B still counts as 2, because both sit in the eligible section. This attaches one gift. It does not swap Gift A / Gift B / Gift C as the quantity goes up.

Help: [Free gift in a Single discount Mix and Match bundle](https://intercom.help/fast-bundle-faq/en/articles/14712389-how-to-offer-a-free-gift-in-a-single-discount-mix-and-match-bundle).

## Tier discount types

On **Tiered discount**, each option can be:

- Percentage
- Fixed amount
- Cheapest item free
- Free shipping
- Set price
- No discount

**Cheapest item free** makes the lowest-priced eligible item free. It does not add a separate Gift A, Gift B, or Gift C product.

**Free gift** (a chosen product at 100% off) is only on **Single discount**, and only on the sections selected under **Apply discount to specific sections only**.
