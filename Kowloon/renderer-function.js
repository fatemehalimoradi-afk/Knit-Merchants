window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx && ctx.snapshot;
  var container = ctx && ctx.container;
  if (!container) return;
  if (!snapshot || !snapshot.selectors || !snapshot.selectors.length) {
    container.innerHTML = "";
    return;
  }

  var meta = snapshot.meta || {};

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function num(value) {
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function rewardsOf(set) {
    return set && set.rewardSet && Array.isArray(set.rewardSet.rewards) ? set.rewardSet.rewards : [];
  }

  function rewardPercent(reward) {
    if (!reward) return 0;
    if (reward.type === "percentageDiscount") return num(reward.percentage) || 0;
    var raw = reward.raw || {};
    return num(reward.percentage) || num(raw.percentage) || num(raw.value) || 0;
  }

  function appliesTo(reward, selectorId) {
    var targets = reward && Array.isArray(reward.appliesTo) ? reward.appliesTo : [];
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].selectorId === selectorId) return true;
    }
    return false;
  }

  function isGiftReward(reward, selectorId) {
    if (!appliesTo(reward, selectorId)) return false;
    if (rewardPercent(reward) >= 99.5) return true;
    var rawType = String((reward && (reward.rawType || reward.type)) || "").toLowerCase();
    return rawType.indexOf("gift") !== -1 || rawType.indexOf("free") !== -1;
  }

  function productOf(selector) {
    if (!selector) return null;
    if (selector.kind === "productSingle") return selector.product || null;
    if (selector.kind === "collectionSingle") return selector.resolvedProduct || null;
    return null;
  }

  function collectionProducts(selector) {
    if (!selector || selector.kind !== "collectionMulti") return [];
    var products = selector.collection && selector.collection.products;
    return Array.isArray(products) ? products : [];
  }

  function selectionOf(selectorId) {
    var entry = snapshot.selections && snapshot.selections[selectorId];
    if (!entry || Array.isArray(entry)) return null;
    return entry;
  }

  function multiEntry(selectorId, productId) {
    var entries = snapshot.selections && snapshot.selections[selectorId];
    if (!Array.isArray(entries)) return null;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i] && entries[i].productId === productId) return entries[i];
    }
    return null;
  }

  function variantOf(product, selection) {
    var variants = (product && product.variants) || [];
    if (!variants.length) return null;
    if (selection && selection.variantId) {
      for (var i = 0; i < variants.length; i++) {
        if (variants[i] && variants[i].id === selection.variantId) return variants[i];
      }
    }
    for (var j = 0; j < variants.length; j++) {
      if (variants[j] && variants[j].available) return variants[j];
    }
    return variants[0];
  }

  function imageOf(product, selection) {
    var variant = variantOf(product, selection);
    if (variant && variant.image && variant.image.url) return variant.image;
    if (product && product.featuredImage && product.featuredImage.url) return product.featuredImage;
    if (product && product.image && product.image.url) return product.image;
    return null;
  }

  function hasVariants(product) {
    var variants = (product && product.variants) || [];
    if (variants.length <= 1) return false;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i] && variants[i].title && variants[i].title !== "Default Title") return true;
    }
    return false;
  }

  function currencyCode() {
    if (snapshot.totals && snapshot.totals.currencyCode) return snapshot.totals.currencyCode;
    var selectors = snapshot.selectors || [];
    for (var i = 0; i < selectors.length; i++) {
      var variant = variantOf(productOf(selectors[i]), null);
      if (variant && variant.currencyCode) return variant.currencyCode;
      var products = collectionProducts(selectors[i]);
      for (var j = 0; j < products.length; j++) {
        var multiVariant = variantOf(products[j], null);
        if (multiVariant && multiVariant.currencyCode) return multiVariant.currencyCode;
      }
    }
    return null;
  }

  function money(amount, code) {
    if (typeof amount !== "number" || !isFinite(amount)) return "";
    var currency = code || currencyCode();
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (err) {
      return (currency ? currency + " " : "") + amount.toFixed(2);
    }
  }

  function classify() {
    var selectors = snapshot.selectors || [];
    var sets = snapshot.conditionSets || [];
    var gifts = [];
    var singles = [];
    var collection = null;
    var i;

    for (i = 0; i < selectors.length; i++) {
      if (selectors[i] && selectors[i].kind === "collectionMulti") {
        collection = selectors[i];
        break;
      }
    }

    for (i = 0; i < selectors.length; i++) {
      var selector = selectors[i];
      if (!selector || selector.kind === "collectionMulti") continue;
      if (selector.kind === "collectionSingle" && !collection) {
        collection = selector;
        continue;
      }
      if (selector.kind !== "productSingle" || !selector.product) continue;
      var gifted = !!collection;
      for (var s = 0; s < sets.length && !gifted; s++) {
        var rewards = rewardsOf(sets[s]);
        for (var r = 0; r < rewards.length; r++) {
          if (isGiftReward(rewards[r], selector.id)) gifted = true;
        }
      }
      if (gifted) gifts.push(selector);
      else singles.push(selector);
    }

    return { collection: collection, singles: singles, gifts: gifts };
  }

  function buildTiers(groups) {
    var tiers = [];
    var count = groups.gifts.length;
    for (var i = 0; i < count; i++) {
      var last = i === count - 1;
      tiers.push({
        selector: groups.gifts[i],
        product: groups.gifts[i].product,
        min: i + 1,
        max: last ? null : i + 1,
        open: last && count > 1,
      });
    }
    return tiers;
  }

  function activeTier(tiers, qty) {
    var match = null;
    for (var i = 0; i < tiers.length; i++) {
      if (qty < tiers[i].min) continue;
      if (!tiers[i].open && tiers[i].max != null && qty > tiers[i].max) continue;
      if (!match || tiers[i].min >= match.min) match = tiers[i];
    }
    return match;
  }

  function rowsFrom(groups) {
    var rows = [];
    if (groups.collection && groups.collection.kind === "collectionMulti") {
      var products = collectionProducts(groups.collection);
      for (var i = 0; i < products.length; i++) {
        var product = products[i];
        if (!product) continue;
        var entry = multiEntry(groups.collection.id, product.id);
        rows.push({
          selectorId: groups.collection.id,
          productId: product.id,
          product: product,
          selection: entry,
          quantity: entry && typeof entry.quantity === "number" ? entry.quantity : 0,
          multi: true,
        });
      }
      return rows;
    }

    var sources = groups.singles.slice();
    if (groups.collection && groups.collection.kind === "collectionSingle" && productOf(groups.collection)) {
      sources.unshift(groups.collection);
    }
    for (var s = 0; s < sources.length; s++) {
      var productSingle = productOf(sources[s]);
      if (!productSingle) continue;
      var selection = selectionOf(sources[s].id);
      rows.push({
        selectorId: sources[s].id,
        productId: null,
        product: productSingle,
        selection: selection,
        quantity: selection && typeof selection.quantity === "number" ? selection.quantity : 0,
        multi: false,
      });
    }
    return rows;
  }

  function eligibleQty(rows) {
    var total = 0;
    for (var i = 0; i < rows.length; i++) total += rows[i].quantity;
    return total;
  }

  function soldOut(row) {
    if (row.selection && row.selection.soldOut && row.quantity > 0) return true;
    var variant = variantOf(row.product, row.selection);
    return !variant || variant.available === false;
  }

  function atCap(row) {
    var variant = variantOf(row.product, row.selection);
    return !!(variant && variant.inventoryQuantity != null && row.quantity >= variant.inventoryQuantity);
  }

  function hiddenQty(selectorId, quantity, productId) {
    return (
      '<input type="hidden" data-nameless-qty-selector="' +
      esc(selectorId) +
      '"' +
      (productId ? ' data-nameless-product-id="' + esc(productId) + '"' : "") +
      ' value="' +
      quantity +
      '">'
    );
  }

  function planInputs(row, nextQty, nextTotal, tiers) {
    var html = hiddenQty(row.selectorId, nextQty, row.multi ? row.productId : null);
    var tier = activeTier(tiers, nextTotal);
    for (var i = 0; i < tiers.length; i++) {
      html += hiddenQty(tiers[i].selector.id, tier && tier.selector.id === tiers[i].selector.id ? 1 : 0);
    }
    return html;
  }

  function renderVariants(row) {
    if (!hasVariants(row.product)) return "";
    var options = "";
    var variants = row.product.variants || [];
    for (var i = 0; i < variants.length; i++) {
      var variant = variants[i];
      if (!variant) continue;
      options +=
        '<option value="' +
        esc(variant.id) +
        '"' +
        (row.selection && variant.id === row.selection.variantId ? " selected" : "") +
        (variant.available === false ? " disabled" : "") +
        ">" +
        esc(variant.title) +
        "</option>";
    }
    return (
      '<label class="kw-variant"><span class="kw-sr">Variant</span><select data-nameless-variant-selector="' +
      esc(row.selectorId) +
      '"' +
      (row.multi ? ' data-nameless-product-id="' + esc(row.productId) + '"' : "") +
      ">" +
      options +
      "</select></label>"
    );
  }

  function renderStepper(row, total, tiers) {
    var others = total - row.quantity;
    if (!tiers.length) {
      return (
        '<div class="kw-stepper"><input class="kw-qty-input" type="number" min="0" step="1" value="' +
        row.quantity +
        '" aria-label="' +
        esc(row.product.title) +
        ' quantity" data-nameless-qty-selector="' +
        esc(row.selectorId) +
        '"' +
        (row.multi ? ' data-nameless-product-id="' + esc(row.productId) + '"' : "") +
        (soldOut(row) ? " disabled" : "") +
        "></div>"
      );
    }
    function step(nextQty, label, sign, disabled) {
      return (
        '<button class="kw-step" type="button" aria-label="' +
        esc(label) +
        '"' +
        (disabled ? " disabled" : "") +
        ">" +
        planInputs(row, nextQty, others + nextQty, tiers) +
        sign +
        "</button>"
      );
    }
    return (
      '<div class="kw-stepper">' +
      step(Math.max(0, row.quantity - 1), "Remove one " + row.product.title, "−", row.quantity <= 0) +
      '<span class="kw-qty">' +
      row.quantity +
      "</span>" +
      step(row.quantity + 1, "Add one " + row.product.title, "+", soldOut(row) || atCap(row)) +
      "</div>"
    );
  }

  function renderProduct(row, total, tiers, code) {
    var image = imageOf(row.product, row.selection);
    var variant = variantOf(row.product, row.selection);
    var price = variant && typeof variant.priceAmount === "number" ? variant.priceAmount : 0;
    var out = soldOut(row);
    return (
      '<article class="kw-product' +
      (out ? " is-sold-out" : "") +
      (row.quantity > 0 ? " is-selected" : "") +
      '"><div class="kw-product__media">' +
      (image ? '<img src="' + esc(image.url) + '" alt="' + esc(image.altText || row.product.title) + '">' : "") +
      (out ? '<span class="kw-badge">Sold out</span>' : "") +
      '</div><div class="kw-product__body"><h3>' +
      esc(row.product.title) +
      '</h3><p class="kw-price">' +
      esc(money(price, code)) +
      "</p>" +
      renderVariants(row) +
      renderStepper(row, total, tiers) +
      "</div></article>"
    );
  }

  function tierLabel(tier) {
    return tier.open && tier.min > 1 ? tier.min + "+" : String(tier.min);
  }

  function renderTier(tier, qty, current, code) {
    var state = "is-locked";
    var note = "Buy " + tierLabel(tier);
    if (current && current.selector.id === tier.selector.id) {
      state = "is-active";
      note = "Included";
    } else if (qty >= tier.min) {
      state = "is-passed";
      note = "Buy " + tierLabel(tier);
    }
    var selection = selectionOf(tier.selector.id);
    var image = imageOf(tier.product, selection);
    var variant = variantOf(tier.product, selection);
    var compare = variant && typeof variant.priceAmount === "number" ? variant.priceAmount : 0;
    return (
      '<li class="kw-tier ' +
      state +
      '"><span class="kw-tier__qty">' +
      esc(tierLabel(tier)) +
      "</span>" +
      (image ? '<img class="kw-tier__img" src="' + esc(image.url) + '" alt="">' : '<span class="kw-tier__ph"></span>') +
      '<span class="kw-tier__copy"><strong>' +
      esc(tier.product.title) +
      "</strong><em>" +
      esc(note) +
      "</em></span>" +
      (state === "is-active"
        ? '<span class="kw-tier__price"><s>' + esc(money(compare, code)) + "</s> Free</span>"
        : "") +
      "</li>"
    );
  }

  var groups = classify();
  var tiers = buildTiers(groups);
  var rows = rowsFrom(groups);
  var qty = eligibleQty(rows);
  var code = currencyCode();
  var current = activeTier(tiers, qty);
  var ladder = "";
  var products = "";
  var i;

  for (i = 0; i < tiers.length; i++) ladder += renderTier(tiers[i], qty, current, code);
  for (i = 0; i < rows.length; i++) products += renderProduct(rows[i], qty, tiers, code);

  var totals = snapshot.totals || {};
  var subtotal = typeof totals.subtotal === "number" ? totals.subtotal : 0;
  var compare = typeof totals.baseSubtotal === "number" ? totals.baseSubtotal : subtotal;
  var save = Math.max(0, compare - subtotal);
  if (current) {
    var giftSelection = selectionOf(current.selector.id);
    var giftVariant = variantOf(current.product, giftSelection);
    var giftList = giftVariant && typeof giftVariant.priceAmount === "number" ? giftVariant.priceAmount : 0;
    var giftQty = giftSelection && giftSelection.quantity > 0 ? giftSelection.quantity : 1;
    var giftSave = giftList * giftQty;
    if (
      giftSelection &&
      typeof giftSelection.basePrice === "number" &&
      typeof giftSelection.finalPrice === "number" &&
      giftSelection.basePrice > giftSelection.finalPrice
    ) {
      giftSave = (giftSelection.basePrice - giftSelection.finalPrice) * giftQty;
    }
    if (giftSave > save) save = giftSave;
  }
  var blocked = snapshot.status === "invalid" || qty < 1;
  for (i = 0; i < rows.length; i++) {
    if (rows[i].quantity > 0 && rows[i].selection && rows[i].selection.soldOut) blocked = true;
  }

  var atc = "";
  if (!meta.atcOverride) {
    atc =
      '<button class="kw-atc" type="button" data-nameless-atc="' +
      esc(snapshot.bundleId) +
      '"' +
      (blocked ? " disabled" : "") +
      ">" +
      esc(meta.atcLabel || "Add to cart") +
      "</button>";
  }

  container.innerHTML =
    '<section class="kw-widget"><header class="kw-head"><h2>' +
    esc(meta.title || "Mix & match gifts") +
    "</h2></header>" +
    (ladder ? '<ol class="kw-ladder">' + ladder + "</ol>" : "") +
    '<details class="kw-mix" open><summary>Mix & match</summary>' +
    (products ? '<div class="kw-products">' + products + "</div>" : '<p class="kw-empty">Add an eligible collection to this bundle.</p>') +
    "</details>" +
    '<footer class="kw-foot"><div class="kw-totals"><span class="kw-totals__label">Total</span><span class="kw-totals__prices">' +
    (save > 0.001 ? '<span class="kw-save">You save ' + esc(money(save, code)) + "</span>" : "") +
    (compare > subtotal + 0.001 ? "<s>" + esc(money(compare, code)) + "</s>" : "") +
    "<span>" +
    esc(money(subtotal, code)) +
    "</span></span></div>" +
    atc +
    "</footer></section>";
});
