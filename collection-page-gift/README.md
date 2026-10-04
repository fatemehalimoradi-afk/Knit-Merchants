# Collection page + free gift

One bundle covers every product page in a host collection. Shoppers get **25% off the product they are viewing** and choose **any 1 product from a gift collection** for free.

## Offer logic

The discount engine applies rewards from **exactly one** matching condition/reward set. Both rewards therefore live in the same set so they apply together.

| Piece | Selector | Kind | Why |
| --- | --- | --- | --- |
| Host products (backpacks) | Shopify collection | `collectionSingle` | On a product page, this becomes the page product when it belongs to the collection. One bundle covers the whole group. |
| Free gift (pouches) | Shopify collection | `collectionMulti` | Renders every product in that collection so the shopper can pick one. |

**Conditions (both required):**

1. At least **1** of the page product
2. Exactly **1** item from the gift collection

**Rewards (same set):**

1. **25% off** the host selector
2. **100% off** the gift selector (free)

If the shopper picks no gift, or picks two gifts, the set does not match and neither discount applies. The widget keeps Add to cart disabled until the offer is complete.

`collectionSingle` is the right host kind because the shopper is on one product page (for example Specialist Half-Day Backpack 25L). A `collectionMulti` host would turn the backpacks into a picker, which is not this offer.

## Widget

- Host card: current product, 25% badge, compare-at vs sale price, variant + qty
- Gift grid: quantity cards (`value="1"`) from the pouches collection, each labelled Free
- Footer: live totals from `snapshot.totals`, hint copy when the gift is missing or over-selected

Paste `renderer-function.js` and `styling.css` into the bundle UI assets. Point the two selectors at the real Shopify collections in `bundle-draft.json`.
