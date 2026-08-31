window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx.snapshot,
    container = ctx.container,
    selectors = snapshot.selectors || [],
    conditionSets = snapshot.conditionSets || [],
    meta = snapshot.meta || {};

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toNum(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function roundMoney(v) {
    return Math.round(100 * (Number(v) || 0)) / 100;
  }

  function currencyCode() {
    return (snapshot.totals && snapshot.totals.currencyCode) || "EUR";
  }

  function fmt(amount, currency) {
    var n = roundMoney(amount),
      code = currency || currencyCode();
    if (code === "EUR") {
      var parts = n.toFixed(2).split("."),
        int = parts[0],
        neg = "";
      if (int.charAt(0) === "-") {
        neg = "-";
        int = int.slice(1);
      }
      int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return neg + "€" + int + "," + parts[1];
    }
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
    } catch (e) {
      return n.toFixed(2) + " " + code;
    }
  }

  function productOf(sel) {
    if (!sel) return null;
    if (sel.kind === "productSingle") return sel.product;
    if (sel.kind === "collectionSingle") return sel.resolvedProduct;
    return sel.resolvedProduct || sel.product || null;
  }

  function selectionOf(sel) {
    if (!sel || !snapshot.selections) return null;
    var entry = snapshot.selections[sel.id];
    return entry && !Array.isArray(entry) ? entry : null;
  }

  function variantOf(product, selection) {
    var variants = (product && product.variants) || [];
    if (!variants.length) return null;
    if (selection) {
      for (var i = 0; i < variants.length; i++) {
        if (variants[i].id === selection.variantId) return variants[i];
      }
    }
    for (var j = 0; j < variants.length; j++) {
      if (variants[j].available) return variants[j];
    }
    return variants[0];
  }

  function rewardsOf(cs) {
    return cs && cs.rewardSet && Array.isArray(cs.rewardSet.rewards)
      ? cs.rewardSet.rewards
      : [];
  }

  function appliesTo(reward, selectorId) {
    return (Array.isArray(reward.appliesTo) ? reward.appliesTo : []).some(
      function (ref) {
        return ref && ref.selectorId === selectorId;
      },
    );
  }

  function qtyConditionFor(cs, selectorId) {
    var conditions =
      (cs && Array.isArray(cs.conditions) ? cs.conditions : []) || [];
    for (var i = 0; i < conditions.length; i++) {
      var c = conditions[i];
      if (!c || c.type !== "quantity") continue;
      var ids = (Array.isArray(c.satisfiesFor) ? c.satisfiesFor : [])
        .map(function (ref) {
          return ref && ref.selectorId;
        })
        .filter(Boolean);
      if (!ids.length || ids.indexOf(selectorId) !== -1) return c;
    }
    return null;
  }

  function percentageFor(cs, selectorId) {
    var rewards = rewardsOf(cs),
      total = 0;
    for (var i = 0; i < rewards.length; i++) {
      var r = rewards[i];
      if (r && r.type === "percentageDiscount" && appliesTo(r, selectorId)) {
        total += Number(r.percentage) || 0;
      }
    }
    return Math.min(total, 100);
  }

  function fixedFor(cs, selectorId) {
    var rewards = rewardsOf(cs),
      amount = 0,
      mode = "TOTAL";
    for (var i = 0; i < rewards.length; i++) {
      var r = rewards[i];
      if (r && r.type === "fixedDiscount" && appliesTo(r, selectorId)) {
        amount += Number(r.amount) || 0;
        if (r.mode) mode = String(r.mode);
      }
    }
    return { amount: amount, mode: mode };
  }

  function unitPrices(qty, unitPrice, percentage, fixed) {
    var q = Math.max(1, Number(qty) || 1),
      base = Number(unitPrice) || 0,
      pct = Number(percentage) || 0,
      fixAmt = fixed && Number(fixed.amount) > 0 ? Number(fixed.amount) : 0,
      mode = fixed && fixed.mode ? String(fixed.mode) : "TOTAL",
      afterPct = base * (1 - pct / 100),
      line = afterPct * q,
      reduction = 0;
    if (fixAmt > 0) {
      reduction =
        mode === "PER_UNIT"
          ? Math.min(fixAmt * q, line)
          : Math.min(fixAmt, line);
    }
    return {
      base: roundMoney(base),
      final: roundMoney(Math.max(0, line - reduction) / q),
      baseTotal: roundMoney(base * q),
      finalTotal: roundMoney(Math.max(0, line - reduction)),
    };
  }

  function inStock(product, selection, qty) {
    var variant = variantOf(product, selection);
    if (!variant || !variant.available) return false;
    if (
      variant.inventoryQuantity === null ||
      variant.inventoryQuantity === undefined
    )
      return true;
    return variant.inventoryQuantity >= qty;
  }

  function pickSelector() {
    var mount = container.closest("[data-nameless-block]") || container,
      pageId = mount.getAttribute("data-product-id") || "",
      pageGid = pageId
        ? pageId.indexOf("gid://") === 0
          ? pageId
          : "gid://shopify/Product/" + pageId
        : "",
      withProduct = [],
      i;
    for (i = 0; i < selectors.length; i++) {
      if (productOf(selectors[i])) withProduct.push(selectors[i]);
    }
    if (!withProduct.length) return selectors[0] || null;
    if (pageGid) {
      for (i = 0; i < withProduct.length; i++) {
        var p = productOf(withProduct[i]);
        if (p && (p.id === pageGid || String(p.id).endsWith("/" + pageId)))
          return withProduct[i];
      }
    }
    return withProduct[0];
  }

  function defaultTiers() {
    return [
      { min: 50, max: 99, quantity: 50, percentage: 0, fixed: { amount: 0, mode: "PER_UNIT" } },
      { min: 100, max: 249, quantity: 100, percentage: 0, fixed: { amount: 1, mode: "PER_UNIT" } },
      { min: 250, max: 500, quantity: 250, percentage: 0, fixed: { amount: 2.7, mode: "PER_UNIT" } },
      { min: 500, max: 999, quantity: 500, percentage: 0, fixed: { amount: 3.45, mode: "PER_UNIT" } },
      { min: 1000, max: 1999, quantity: 1000, percentage: 0, fixed: { amount: 4.45, mode: "PER_UNIT" } },
    ];
  }

  function buildTiers(sel) {
    if (!sel) return defaultTiers();
    var byKey = {},
      i;
    for (i = 0; i < conditionSets.length; i++) {
      var cs = conditionSets[i],
        cond = qtyConditionFor(cs, sel.id),
        min = toNum(cond && cond.minimum),
        max = toNum(cond && cond.maximum);
      if (min === null || min <= 0) continue;
      var key = min + ":" + (max === null ? "open" : max);
      if (!byKey[key]) {
        byKey[key] = {
          min: min,
          max: max,
          quantity: min,
          percentage: percentageFor(cs, sel.id),
          fixed: fixedFor(cs, sel.id),
        };
      }
    }
    var list = Object.keys(byKey)
      .map(function (k) {
        return byKey[k];
      })
      .sort(function (a, b) {
        return a.min - b.min;
      });
    return list.length ? list : defaultTiers();
  }

  function matchingTierIndex(tiers, qty) {
    if (!(qty > 0)) return -1;
    var match = -1,
      i;
    for (i = 0; i < tiers.length; i++) {
      if (qty >= tiers[i].min && (tiers[i].max === null || qty <= tiers[i].max))
        match = i;
    }
    if (match === -1) {
      for (i = 0; i < tiers.length; i++) {
        if (qty >= tiers[i].min) match = i;
      }
    }
    return match;
  }

  function showVariantSelector(product) {
    var variants = (product && product.variants) || [];
    if (!variants.length) return false;
    if (variants.length > 1) return true;
    return !!(variants[0].title && variants[0].title !== "Default Title");
  }

  function unitLabel() {
    return meta.unitLabel || meta.unitSuffix || "pairs";
  }

  function unitPriceSuffix() {
    return meta.unitPriceSuffix || "/ pair";
  }

  function saveLabel() {
    return meta.saveLabel || "You save";
  }

  function rangeTitle(tier) {
    var custom = (meta.tierTitles || {})[tier.min] || (meta.tierTitles || {})[String(tier.min)];
    if (custom) return custom;
    var unit = unitLabel();
    if (tier.max === null) return tier.min + "+ " + unit;
    return tier.min + " - " + tier.max + " " + unit;
  }

  var sel = pickSelector(),
    product = productOf(sel) || {
      id: "gid://shopify/Product/preview",
      title: "Preview",
      variants: ["S", "M", "L", "XL"].map(function (size) {
        return {
          id: "gid://shopify/ProductVariant/preview-" + size.toLowerCase(),
          title: size,
          available: true,
          priceAmount: Number(meta.previewPrice) || 10.45,
          currencyCode: currencyCode(),
        };
      }),
    },
    selection = selectionOf(sel),
    variant = variantOf(product, selection),
    unitPrice = (variant && Number(variant.priceAmount)) || Number(meta.previewPrice) || 10.45,
    cur = (variant && variant.currencyCode) || currencyCode(),
    tiers = buildTiers(sel),
    selectedQty =
      selection && typeof selection.quantity === "number" ? selection.quantity : 0,
    selectedIndex = matchingTierIndex(tiers, selectedQty),
    showVariants = showVariantSelector(product),
    atcOverride = !!meta.atcOverride,
    liveSelector = !!(sel && sel.id && productOf(sel));

  if (!container.__qbTierQty) container.__qbTierQty = {};
  if (selectedIndex >= 0 && selectedQty > 0) {
    container.__qbTierQty[selectedIndex] = selectedQty;
  }

  function displayQty(tier, index) {
    if (index === selectedIndex && selectedQty > 0) return selectedQty;
    var stored = container.__qbTierQty[index];
    if (
      typeof stored === "number" &&
      stored >= tier.min &&
      (tier.max === null || stored <= tier.max)
    ) {
      return stored;
    }
    return tier.min;
  }

  function anySoldOut() {
    var selections = snapshot.selections || {};
    for (var i = 0; i < selectors.length; i++) {
      var entry = selections[selectors[i].id];
      if (Array.isArray(entry)) {
        for (var j = 0; j < entry.length; j++) {
          if (entry[j] && entry[j].quantity > 0 && entry[j].soldOut) return true;
        }
      } else if (entry && entry.quantity > 0 && entry.soldOut) {
        return true;
      }
    }
    return false;
  }

  function variantSelectHtml() {
    if (!showVariants) return "";
    var variants = product.variants || [],
      current = (variant && variant.id) || (selection && selection.variantId) || "",
      html = "",
      i,
      bind = liveSelector
        ? ' data-nameless-variant-selector="' + esc(sel.id) + '"'
        : "";
    for (i = 0; i < variants.length; i++) {
      var v = variants[i];
      html +=
        '<option value="' +
        esc(v.id) +
        '"' +
        (v.id === current ? " selected" : "") +
        (v.available ? "" : " disabled") +
        ">" +
        esc(v.title) +
        (v.available ? "" : " — Sold out") +
        "</option>";
    }
    return (
      '<div class="qb-variant">' +
      '<label class="qb-field">' +
      '<span class="qb-field__label">' +
      esc(meta.variantLabel || "Size") +
      "</span>" +
      '<select class="qb-field__select"' +
      bind +
      ">" +
      html +
      "</select></label></div>"
    );
  }

  function qtyStepperHtml(tier, qty) {
    var atMin = qty <= tier.min,
      atMax = tier.max !== null && qty >= tier.max,
      canBind = liveSelector;
    return (
      '<div class="qb-qty">' +
      '<span class="qb-qty__label">Quantity</span>' +
      '<span class="qb-qty__controls">' +
      '<button class="qb-qty__step" type="button" aria-label="Decrease quantity"' +
      (atMin
        ? " disabled"
        : canBind
          ? ' data-nameless-qty-selector="' +
            esc(sel.id) +
            '" value="' +
            (qty - 1) +
            '"'
          : "") +
      ">&minus;</button>" +
      '<span class="qb-qty__value" aria-live="polite">' +
      esc(qty) +
      "</span>" +
      '<button class="qb-qty__step" type="button" aria-label="Increase quantity"' +
      (atMax
        ? " disabled"
        : canBind
          ? ' data-nameless-qty-selector="' +
            esc(sel.id) +
            '" value="' +
            (qty + 1) +
            '"'
          : "") +
      ">+</button>" +
      "</span></div>"
    );
  }

  function tierHtml(tier, index) {
    var selected = index === selectedIndex,
      qty = displayQty(tier, index),
      prices = unitPrices(qty, unitPrice, tier.percentage, tier.fixed),
      saveAmt = roundMoney(Math.max(0, prices.baseTotal - prices.finalTotal)),
      showCompare = prices.final < prices.base - 0.001,
      disabled = liveSelector && !inStock(product, selection, qty),
      selectAttr =
        liveSelector && !selected
          ? ' data-nameless-qty-selector="' +
            esc(sel.id) +
            '" value="' +
            qty +
            '"'
          : "";

    return (
      '<div class="qb-tier' +
      (selected ? " is-selected" : "") +
      '">' +
      '<button class="qb-tier__main" type="button" role="radio" aria-checked="' +
      (selected ? "true" : "false") +
      '"' +
      selectAttr +
      (disabled ? " disabled" : "") +
      ">" +
      '<span class="qb-radio" aria-hidden="true"></span>' +
      '<span class="qb-tier__copy">' +
      '<span class="qb-tier__title">' +
      esc(rangeTitle(tier)) +
      "</span>" +
      (saveAmt > 0.001
        ? '<span class="qb-tier__save">' +
          esc(saveLabel()) +
          " " +
          esc(fmt(saveAmt, cur)) +
          "</span>"
        : "") +
      "</span>" +
      '<span class="qb-tier__prices">' +
      '<span class="qb-tier__unit-row">' +
      '<strong class="qb-tier__unit">' +
      esc(fmt(prices.final, cur)) +
      " " +
      esc(unitPriceSuffix()) +
      "</strong>" +
      (showCompare
        ? '<s class="qb-tier__compare">' + esc(fmt(prices.base, cur)) + "</s>"
        : "") +
      "</span>" +
      '<span class="qb-tier__total-row">' +
      '<strong class="qb-tier__total">' +
      esc(fmt(prices.finalTotal, cur)) +
      "</strong>" +
      (showCompare
        ? '<s class="qb-tier__compare">' +
          esc(fmt(prices.baseTotal, cur)) +
          "</s>"
        : "") +
      "</span></span></button>" +
      '<div class="qb-tier__panel">' +
      qtyStepperHtml(tier, qty) +
      "</div>" +
      "</div>"
    );
  }

  var heading = meta.title || "";
  var soldOut = anySoldOut();

  container.innerHTML =
    '<div class="qb-widget">' +
    (heading ? '<h2 class="qb-heading">' + esc(heading) + "</h2>" : "") +
    variantSelectHtml() +
    '<div class="qb-tier-list" role="radiogroup"' +
    (heading
      ? ' aria-label="' + esc(heading) + '"'
      : ' aria-label="Quantity offers"') +
    ">" +
    tiers
      .map(function (tier, index) {
        return tierHtml(tier, index);
      })
      .join("") +
    "</div>" +
    (atcOverride
      ? ""
      : '<button class="qb-atc" type="button" data-nameless-atc="' +
        esc(snapshot.bundleId) +
        '"' +
        (soldOut || !liveSelector || selectedQty <= 0 ? " disabled" : "") +
        ">" +
        esc(meta.atcLabel || "Add to cart") +
        "</button>") +
    "</div>";

  (function autoSelectFirst() {
    if (!liveSelector || !tiers.length || selectedQty > 0 || container.__qbDefaulted)
      return;
    container.__qbDefaulted = true;
    var btn = container.querySelector(".qb-tier__main[data-nameless-qty-selector]");
    if (btn && !btn.disabled) {
      setTimeout(function () {
        if (document.contains(btn)) btn.click();
      }, 0);
    }
  })();

  (function placeAboveThemeAtcAndHide() {
    var mount = container.closest("[data-nameless-block]") || container;
    if (!mount || !mount.parentNode) return;

    function hideEl(el) {
      if (!el || el.closest("[data-nameless-block]")) return;
      el.style.setProperty("display", "none", "important");
      el.setAttribute("aria-hidden", "true");
      el.setAttribute("data-nameless-hidden-theme-atc", "true");
    }

    function apply() {
      var productForm =
          document.querySelector("product-form.product-form") ||
          document.querySelector("product-form"),
        buttons =
          (productForm &&
            productForm.querySelector(".product-form__buttons")) ||
          document.querySelector(".product-form__buttons"),
        form =
          (productForm &&
            productForm.querySelector('form[action*="/cart/add"]')) ||
          document.querySelector('form[action*="/cart/add"]'),
        atcBtn =
          (buttons &&
            (buttons.querySelector('button[name="add"]') ||
              buttons.querySelector(".product-form__submit") ||
              buttons.querySelector('button[type="submit"]'))) ||
          document.querySelector(
            'product-form button[name="add"], .product-form__submit, form[action*="/cart/add"] button[name="add"]',
          ),
        anchor = buttons || form || atcBtn;

      if (
        mount &&
        anchor &&
        anchor.parentNode &&
        mount !== anchor &&
        !(
          mount.parentNode === anchor.parentNode &&
          mount.nextSibling === anchor
        )
      ) {
        anchor.parentNode.insertBefore(mount, anchor);
      }
      if (atcOverride) return;
      if (buttons) hideEl(buttons);
      else {
        if (atcBtn) hideEl(atcBtn);
        var buyNow =
          (form && form.querySelector(".shopify-payment-button")) ||
          document.querySelector(
            'product-form .shopify-payment-button, [data-shopify="payment-button"]',
          );
        if (buyNow) hideEl(buyNow);
      }
    }

    apply();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () {
        apply();
        requestAnimationFrame(apply);
      });
    }
    setTimeout(apply, 0);
    setTimeout(apply, 100);
    setTimeout(apply, 400);
  })();
});
