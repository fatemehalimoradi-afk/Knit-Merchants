window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx.snapshot || {};
  var container = ctx.container;
  var selectors = snapshot.selectors || [];
  var conditionSets = snapshot.conditionSets || [];
  var meta = snapshot.meta || {};
  if (!container) return;

  if (!container.__msNoFocusScroll) {
    container.__msNoFocusScroll = true;
    container.addEventListener("mousedown", function (event) {
      var target = event.target;
      if (!target || !target.closest || !target.closest("button")) return;
      event.preventDefault();
    });
  }

  function scrollState() {
    var parents = [];
    var node = container.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.scrollHeight > node.clientHeight + 1) {
        parents.push({ el: node, top: node.scrollTop, left: node.scrollLeft });
      }
      node = node.parentElement;
    }
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft || 0,
      y: window.pageYOffset || document.documentElement.scrollTop || 0,
      parents: parents
    };
  }

  function restoreScroll(state) {
    window.scrollTo(state.x, state.y);
    for (var i = 0; i < state.parents.length; i++) {
      state.parents[i].el.scrollTop = state.parents[i].top;
      state.parents[i].el.scrollLeft = state.parents[i].left;
    }
  }

  function holdScroll(run) {
    var state = scrollState();
    var active = document.activeElement;
    if (active && active !== container && container.contains(active) && typeof active.blur === "function") {
      active.blur();
      restoreScroll(state);
    }
    run();
    restoreScroll(state);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () { restoreScroll(state); });
    }
    setTimeout(function () { restoreScroll(state); }, 0);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function num(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function roundMoney(value) {
    return Math.round(100 * (Number(value) || 0)) / 100;
  }

  function numericId(value) {
    var text = String(value || "");
    var match = text.match(/(\d+)$/);
    return match ? match[1] : text;
  }

  function sameId(a, b) {
    return !!(a && b) && (a === b || numericId(a) === numericId(b) || String(a).endsWith("/" + numericId(b)) || String(b).endsWith("/" + numericId(a)));
  }

  function currencyCode() {
    return (snapshot.totals && snapshot.totals.currencyCode) || "GBP";
  }

  function money(amount, code) {
    var value = Number(amount) || 0;
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: code || currencyCode(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch (err) {
      return "£" + value.toFixed(2);
    }
  }

  function pageProductId() {
    var el =
      document.querySelector("[data-nameless-app-embed][data-product-id]") ||
      document.querySelector("[data-nameless-block][data-product-id]") ||
      (container && container.closest("[data-product-id]")) ||
      null;
    return el ? numericId(el.getAttribute("data-product-id")) : "";
  }

  function isCollection(selector) {
    if (!selector) return false;
    if (selector.kind === "collectionMulti" || selector.kind === "collectionSingle") return true;
    if (selector.collection) return true;
    var type = String(selector.type || selector.itemType || "").toLowerCase();
    return type.indexOf("collection") !== -1 || type.indexOf("multi") !== -1;
  }

  function collectionProducts(selector) {
    if (!selector) return [];
    var collection = selector.collection;
    if (collection && collection.products && collection.products.length) return collection.products;
    if (collection && collection.references && collection.references.nodes && collection.references.nodes.length) return collection.references.nodes;
    if (selector.products && selector.products.length) return selector.products;
    if (selector.resolvedProduct) return [selector.resolvedProduct];
    if (selector.product) return [selector.product];
    return [];
  }

  function activeVariant(product, selection) {
    var variants = (product && product.variants) || [];
    var i;
    if (selection && selection.variantId) {
      for (i = 0; i < variants.length; i++) {
        if (variants[i].id === selection.variantId) return variants[i];
      }
    }
    for (i = 0; i < variants.length; i++) {
      if (variants[i].available) return variants[i];
    }
    return variants[0] || null;
  }

  function resolveProduct(selector, pageId) {
    if (!selector) return null;
    if (selector.kind === "productSingle") return selector.product || null;
    if (isCollection(selector)) {
      var products = collectionProducts(selector);
      var i;
      if (pageId) {
        for (i = 0; i < products.length; i++) {
          if (products[i] && sameId(products[i].id, pageId)) return products[i];
        }
      }
      for (i = 0; i < products.length; i++) {
        var variant = activeVariant(products[i], null);
        if (variant && variant.available) return products[i];
      }
      return products[0] || selector.resolvedProduct || selector.product || null;
    }
    return selector.product || selector.resolvedProduct || null;
  }

  function pickVolumeSelector(pageId) {
    var matches = [];
    var i;
    for (i = 0; i < selectors.length; i++) {
      if (resolveProduct(selectors[i], pageId) || isCollection(selectors[i]) || selectors[i].product) matches.push(selectors[i]);
    }
    if (!matches.length) return selectors[0] || null;
    if (pageId) {
      for (i = 0; i < matches.length; i++) {
        var product = resolveProduct(matches[i], pageId);
        if (product && sameId(product.id, pageId)) return matches[i];
      }
    }
    return matches[0];
  }

  function selectionFor(selector, product) {
    if (!selector) return null;
    var selection = snapshot.selections && snapshot.selections[selector.id];
    if (!selection) return null;
    if (Array.isArray(selection)) {
      if (!product) return null;
      for (var i = 0; i < selection.length; i++) {
        if (selection[i] && sameId(selection[i].productId, product.id)) return selection[i];
      }
      return null;
    }
    if (selection.productId && product && !sameId(selection.productId, product.id)) return null;
    return selection;
  }

  function rewardsOf(set) {
    return set && set.rewardSet && Array.isArray(set.rewardSet.rewards) ? set.rewardSet.rewards : [];
  }

  function appliesTo(reward, selectorId) {
    var targets = Array.isArray(reward.appliesTo) ? reward.appliesTo : [];
    return !targets.length || targets.some(function (item) {
      return item && item.selectorId === selectorId;
    });
  }

  function quantityRule(set, selectorId) {
    var conditions = (set && Array.isArray(set.conditions) ? set.conditions : []) || [];
    var fallback = null;
    for (var i = 0; i < conditions.length; i++) {
      var condition = conditions[i];
      if (!condition || condition.type !== "quantity") continue;
      fallback = fallback || condition;
      var ids = (Array.isArray(condition.satisfiesFor) ? condition.satisfiesFor : []).map(function (item) {
        return item && item.selectorId;
      }).filter(Boolean);
      if (!ids.length || ids.indexOf(selectorId) !== -1) return condition;
    }
    return fallback;
  }

  function percentFor(set, selectorId) {
    var total = 0;
    var rewards = rewardsOf(set);
    for (var i = 0; i < rewards.length; i++) {
      if (rewards[i] && rewards[i].type === "percentageDiscount" && appliesTo(rewards[i], selectorId)) {
        total += Number(rewards[i].percentage) || 0;
      }
    }
    return Math.min(total, 100);
  }

  function fixedFor(set, selectorId) {
    var amount = 0;
    var mode = "TOTAL";
    var rewards = rewardsOf(set);
    for (var i = 0; i < rewards.length; i++) {
      if (rewards[i] && rewards[i].type === "fixedDiscount" && appliesTo(rewards[i], selectorId)) {
        amount += Number(rewards[i].amount) || 0;
        if (rewards[i].mode) mode = String(rewards[i].mode);
      }
    }
    return { amount: amount, mode: mode };
  }

  function priceFor(qty, unitPrice, percent, fixed) {
    var quantity = Math.max(1, Number(qty) || 1);
    var base = Number(unitPrice) || 0;
    var afterPercent = base * (1 - (Number(percent) || 0) / 100) * quantity;
    var discount = 0;
    var fixedAmount = fixed && Number(fixed.amount) > 0 ? Number(fixed.amount) : 0;
    if (fixedAmount > 0) {
      discount = fixed.mode === "PER_UNIT" ? Math.min(fixedAmount * quantity, afterPercent) : Math.min(fixedAmount, afterPercent);
    }
    var finalTotal = Math.max(0, afterPercent - discount);
    return {
      base: roundMoney(base),
      final: roundMoney(finalTotal / quantity),
      baseTotal: roundMoney(base * quantity),
      finalTotal: roundMoney(finalTotal)
    };
  }

  function volumeTiers(selector) {
    if (!selector) return [];
    var map = {};
    for (var i = 0; i < conditionSets.length; i++) {
      var set = conditionSets[i];
      var rule = quantityRule(set, selector.id);
      if (!rule) continue;
      var min = num(rule.minimum);
      var max = num(rule.maximum);
      if (min == null || min <= 0) continue;
      var open = max == null || max > min;
      var key = open ? "open:" + min : "exact:" + min;
      if (!map[key]) {
        map[key] = {
          quantity: min,
          min: min,
          max: open ? max : min,
          open: open,
          percentage: percentFor(set, selector.id),
          fixed: fixedFor(set, selector.id)
        };
      }
    }
    return Object.keys(map).map(function (key) {
      return map[key];
    }).sort(function (a, b) {
      return a.min - b.min;
    });
  }

  function tierSelected(tier, qty, tiers, index) {
    if (!(qty > 0)) return false;
    if (!tier.open) return qty === tier.quantity;
    var next = tiers[index + 1];
    return next ? qty >= tier.min && qty < next.min : qty >= tier.min;
  }

  function tierTitle(tier, index, total) {
    var qty = Number(tier.min) || 1;
    if (meta.tierTitles && meta.tierTitles[qty] != null) return String(meta.tierTitles[qty]);
    if (meta.tierTitles && meta.tierTitles[String(qty)] != null) return String(meta.tierTitles[String(qty)]);
    var perKit = num(meta.unitsPerKit);
    if (perKit == null || perKit <= 0) perKit = 4;
    var balls = qty * perKit;
    var unit = meta.unitLabel || "balls";
    var kit = meta.kitLabel || "tube";
    var kits = meta.kitLabelPlural || "tubes";
    if (index === total - 1 && total >= 2) {
      return balls + " " + unit + " + (" + qty + " " + (meta.lastTierKitLabel || "tube box") + ")";
    }
    return balls + " " + unit + " (" + qty + " " + (qty === 1 ? kit : kits) + ")";
  }

  function tierBadge(tier, index, total) {
    if (meta.tierBadges && meta.tierBadges[tier.min] != null) return String(meta.tierBadges[tier.min]);
    if (meta.tierBadges && meta.tierBadges[String(tier.min)] != null) return String(meta.tierBadges[String(tier.min)]);
    var pct = Math.round(Number(tier.percentage) || 0);
    if (pct <= 0) return "";
    if (index === total - 1) return "SAVE " + pct + "% + FREE SHIPPING";
    return "SAVE " + pct + "%";
  }

  function tierRibbon(index, total) {
    if (total < 2) return "";
    if (index === total - 1) return meta.lastRibbon || "Most Popular";
    if (index === 1 && meta.midRibbon) return String(meta.midRibbon);
    return "";
  }

  function ribbonHtml(label) {
    if (!label) return "";
    return (
      '<div class="ms-ribbon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M8 0L0 8H8V0Z" fill="var(--rbr__fill-badge)"></path><path d="M8 0L0 8H8V0Z" fill="black" opacity="0.2"></path></svg>' +
        "<span>" + esc(label) + "</span>" +
        '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M0 0L8 8H0V0Z" fill="var(--rbr__fill-badge)"></path><path d="M0 0L8 8H0V0Z" fill="black" opacity="0.2"></path></svg>' +
      "</div>"
    );
  }

  function addonPercent(selector) {
    var best = 0;
    for (var i = 0; i < conditionSets.length; i++) {
      best = Math.max(best, percentFor(conditionSets[i], selector.id));
    }
    return best;
  }

  function addonProducts(selector) {
    if (selector.kind === "collectionMulti") return collectionProducts(selector);
    var product = selector.kind === "productSingle" ? selector.product : selector.resolvedProduct || selector.product;
    return product ? [product] : [];
  }

  var pageId = pageProductId();
  var volumeSelector = pickVolumeSelector(pageId);
  var volumeProduct = resolveProduct(volumeSelector, pageId) || (volumeSelector ? {
    id: pageId ? "gid://shopify/Product/" + pageId : "gid://shopify/Product/preview",
    title: "Preview",
    variants: [{
      id: "gid://shopify/ProductVariant/preview",
      title: "Default Title",
      available: true,
      priceAmount: Number(meta.previewPrice) || 24.95,
      currencyCode: currencyCode()
    }]
  } : null);
  var volumeAttr = volumeSelector && isCollection(volumeSelector) && volumeProduct
    ? ' data-nameless-product-id="' + esc(volumeProduct.id) + '"'
    : "";
  var volumeSelection = selectionFor(volumeSelector, volumeProduct);
  var volumeVariant = activeVariant(volumeProduct, volumeSelection);
  var unitPrice = volumeVariant && Number(volumeVariant.priceAmount) || 0;
  var unitCurrency = (volumeVariant && volumeVariant.currencyCode) || currencyCode();
  var tiers = volumeTiers(volumeSelector);
  if (tiers.length) {
    for (var ti = 0; ti < tiers.length; ti++) {
      if (ti === tiers.length - 1) {
        tiers[ti].open = true;
        tiers[ti].max = null;
      } else {
        tiers[ti].open = false;
        tiers[ti].max = tiers[ti].min;
        tiers[ti].quantity = tiers[ti].min;
      }
    }
  }
  var qty = volumeSelection && typeof volumeSelection.quantity === "number" ? volumeSelection.quantity : 0;
  var soldOut = false;
  var bundleName = snapshot.title || meta.title || "";
  var vdHeading = meta.vdTitle || "Buy More... Save More...";

  function renderTiers() {
    if (!volumeSelector || !volumeProduct || !tiers.length) return "";
    var rows = "";
    for (var i = 0; i < tiers.length; i++) {
      var tier = tiers[i];
      var selected = tierSelected(tier, qty, tiers, i);
      var last = i === tiers.length - 1;
      var displayQty = selected && last && qty >= tier.min ? qty : tier.min;
      var priced = priceFor(displayQty, unitPrice, tier.percentage, tier.fixed);
      var onSale = priced.finalTotal < priced.baseTotal - 0.001;
      var available = !volumeVariant || (volumeVariant.available && (volumeVariant.inventoryQuantity == null || volumeVariant.inventoryQuantity >= displayQty));
      if (selected && !available && meta.allowSoldOut === false) soldOut = true;
      var badge = tierBadge(tier, i, tiers.length);
      var ribbon = tierRibbon(i, tiers.length);
      var down = Math.max(tier.min, displayQty - 1);
      var atMin = displayQty <= tier.min;
      var qtyHtml = selected && last
        ? '<div class="ms-qty"><span class="ms-qty__label">' + esc(meta.qtyLabel || "Quantity") + '</span><div class="ms-qty__controls"><button class="ms-qty__btn' + (atMin ? " is-disabled" : "") + '" type="button" data-nameless-qty-selector="' + esc(volumeSelector.id) + '"' + volumeAttr + ' value="' + esc(down) + '" aria-label="Decrease quantity"' + (atMin ? " disabled" : "") + '>-</button><span class="ms-qty__value">' + esc(displayQty) + '</span><button class="ms-qty__btn" type="button" data-nameless-qty-selector="' + esc(volumeSelector.id) + '"' + volumeAttr + ' value="' + esc(displayQty + 1) + '" aria-label="Increase quantity">+</button></div></div>'
        : "";
      rows +=
        '<div class="ms-tier-wrap' + (selected ? " is-selected" : "") + (ribbon ? " has-ribbon" : "") + '">' +
          ribbonHtml(ribbon) +
          '<button class="ms-tier' + (selected ? " is-selected" : "") + '" type="button" data-nameless-qty-selector="' +
          esc(volumeSelector.id) + '"' + volumeAttr + ' value="' + esc(displayQty) + '" aria-pressed="' + (selected ? "true" : "false") + '"' +
          (available || meta.allowSoldOut !== false ? "" : " disabled") + ">" +
            '<span class="ms-tier__radio" aria-hidden="true"></span>' +
            '<span class="ms-tier__copy">' +
              '<span class="ms-tier__title">' + esc(tierTitle(tier, i, tiers.length)) + "</span>" +
              (badge ? '<span class="ms-tier__badge">' + esc(badge) + "</span>" : "") +
            "</span>" +
            '<span class="ms-tier__prices">' +
              '<span class="ms-tier__price">' + esc(money(priced.finalTotal, unitCurrency)) + "</span>" +
              (onSale ? '<s class="ms-tier__compare">' + esc(money(priced.baseTotal, unitCurrency)) + "</s>" : "") +
            "</span>" +
          "</button>" +
          qtyHtml +
        "</div>";
    }
    var headingTitle = bundleName || vdHeading;
    return (
      '<section class="ms-vd">' +
        '<div class="ms-heading"><h3 class="ms-heading__title">' + esc(headingTitle) + '</h3><span class="ms-heading__rule" aria-hidden="true"></span></div>' +
        '<div class="ms-tier-list">' + rows + "</div>" +
      "</section>"
    );
  }

  function renderAddonRow(selector, product) {
    var selection = selectionFor(selector, product);
    var quantity = selection && Number(selection.quantity) || 0;
    var selected = quantity > 0;
    var out = !!(selection && selection.soldOut);
    if (selected && out) soldOut = true;
    var variant = activeVariant(product, selection);
    var image = variant && variant.image;
    var base = selection && selection.basePrice != null ? selection.basePrice : variant ? variant.priceAmount : 0;
    var percent = addonPercent(selector);
    var final = selection && selected && selection.finalPrice != null
      ? selection.finalPrice
      : percent
        ? roundMoney(base * (1 - percent / 100))
        : base;
    var code = (variant && variant.currencyCode) || currencyCode();
    var handle = product.handle ? "/products/" + encodeURIComponent(product.handle) : "";
    var productAttr = selector.kind === "collectionMulti" ? ' data-nameless-product-id="' + esc(product.id) + '"' : "";
    var variants = product.variants || [];
    var variantHtml = "";
    if (variants.length > 1) {
      var options = "";
      for (var i = 0; i < variants.length; i++) {
        options +=
          '<option value="' + esc(variants[i].id) + '"' +
          (selection && variants[i].id === selection.variantId ? " selected" : "") +
          (variants[i].available ? "" : " disabled") + ">" +
          esc(variants[i].title) + (variants[i].available ? "" : " — Sold out") +
          "</option>";
      }
      variantHtml =
        '<label class="ms-addon__variant-label"><span class="ms-sr">Choose ' + esc(product.title) +
        ' variant</span><select class="ms-addon__variant" data-nameless-variant-selector="' +
        esc(selector.id) + '"' + productAttr + ">" + options + "</select></label>";
    }
    var addonTitle = meta.addonTitle || "Grab a grip";
    var subtitle = meta.addonSubtitle || "Soft & Tacky with Antibacterial Protection";
    return (
      '<article class="ms-addon' + (selected ? " is-selected" : "") + (out ? " is-sold-out" : "") + '">' +
        '<div class="ms-addon__intro">' +
          '<div class="ms-addon__intro-row">' +
            '<h3 class="ms-addons__title">' + esc(addonTitle) + "</h3>" +
            (percent ? '<span class="ms-addons__off">' + esc(percent) + "% OFF</span>" : "") +
          "</div>" +
          (subtitle ? '<p class="ms-addons__subtitle">' + esc(subtitle) + "</p>" : "") +
        "</div>" +
        '<div class="ms-addon__row">' +
          '<label class="ms-addon__select">' +
            '<input class="ms-addon__checkbox" type="checkbox" data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + (selected ? " checked" : "") + (out ? " disabled" : "") + ' aria-label="Add ' + esc(product.title) + '">' +
            '<span class="ms-addon__control" aria-hidden="true"></span>' +
          "</label>" +
          '<div class="ms-addon__media">' +
            (image
              ? '<img class="ms-addon__image" src="' + esc(image.url) + '" alt="' + esc(image.altText || product.title) + '">'
              : '<span class="ms-addon__placeholder" aria-hidden="true"></span>') +
          "</div>" +
          '<div class="ms-addon__content">' +
            '<h4 class="ms-addon__title">' +
              esc(product.title) +
              (handle
                ? '<a class="ms-addon__link" href="' + esc(handle) + '" target="_blank" rel="noopener noreferrer" aria-label="View ' + esc(product.title) + '"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.92 12.25A1.16 1.16 0 0 1 1.75 11.08V2.92A1.16 1.16 0 0 1 2.92 1.75H7v1.17H2.92v8.16h8.16V7H12.25v4.08a1.16 1.16 0 0 1-1.17 1.17H2.92Zm2.74-3.09-.82-.82 5.43-5.42H8.17V1.75h4.08v4.08h-1.17V3.73L5.66 9.16Z" fill="currentColor"/></svg></a>'
                : "") +
            "</h4>" +
            '<div class="ms-addon__price">' +
              '<span class="ms-addon__now">+ ' + esc(money(final, code)) + "</span>" +
              (final < base - 0.001 ? '<s class="ms-addon__was">' + esc(money(base, code)) + "</s>" : "") +
            "</div>" +
            '<input class="ms-addon__qty" type="number" min="0" max="1" step="1" readonly tabindex="-1" aria-hidden="true" value="' +
              esc(selected ? Math.min(quantity, 1) : 1) +
              '" data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + (out ? " disabled" : "") + ">" +
          "</div>" +
        "</div>" +
        variantHtml +
      "</article>"
    );
  }

  function renderAddons() {
    var rows = "";
    for (var i = 0; i < selectors.length; i++) {
      var selector = selectors[i];
      if (volumeSelector && selector.id === volumeSelector.id) continue;
      var products = addonProducts(selector);
      for (var p = 0; p < products.length; p++) {
        if (pageId && sameId(products[p].id, pageId)) continue;
        rows += renderAddonRow(selector, products[p]);
      }
    }
    if (!rows) return "";
    return '<section class="ms-addons"><div class="ms-addons__list">' + rows + "</div></section>";
  }

  function renderVariantBridge() {
    if (!volumeSelector || !volumeProduct) return "";
    var variants = volumeProduct.variants || [];
    if (!variants.length) return "";
    var current = volumeSelection && volumeSelection.variantId || "";
    var options = "";
    for (var i = 0; i < variants.length; i++) {
      options +=
        '<option value="' + esc(variants[i].id) + '"' +
        (variants[i].id === current ? " selected" : "") +
        (variants[i].available ? "" : " disabled") + ">" +
        esc(variants[i].title) + "</option>";
    }
    return '<select class="ms-sr" tabindex="-1" aria-hidden="true" data-nameless-variant-selector="' +
      esc(volumeSelector.id) + '"' + volumeAttr + ">" + options + "</select>";
  }

  var vdHtml = renderTiers();
  var addonHtml = renderAddons();
  var atcHtml = meta.atcOverride
    ? ""
    : '<button class="ms-atc" type="button" data-nameless-atc="' + esc(snapshot.bundleId) + '"' +
      (soldOut ? " disabled" : "") + ">" + esc(meta.atcLabel || "Add to cart") + "</button>";

  holdScroll(function () {
    container.innerHTML =
      '<div class="ms-widget">' + vdHtml + addonHtml + renderVariantBridge() + atcHtml + "</div>";
  });

  if (volumeSelector && tiers.length && qty <= 0 && !container.__msSeeded && window.nameless && typeof window.nameless.dispatch === "function") {
    container.__msSeeded = true;
    var seed = { bundleId: snapshot.bundleId, selectorId: volumeSelector.id, quantity: tiers[0].min };
    if (volumeAttr) seed.productId = volumeProduct.id;
    window.nameless.dispatch("quantityChange", seed);
  }

  (function reloadAfterAdd() {
    var ns = window.nameless;
    if (!ns || window.__msReloadAfterAdd) return;
    window.__msReloadAfterAdd = true;
    if (typeof ns.use === "function") {
      ns.use({
        addToCart: {
          after: function (ctx) {
            if (!ctx || !ctx.result || !ctx.result.ok) return;
            window.location.reload();
          }
        }
      });
    }
  })();

  (function hideThemeAtc() {
    var mount = container.closest("[data-nameless-block]") || container;
    function place() {
      var theme = document.querySelector("form .product-add-to-cart-container");
      if (!theme || !theme.parentNode || !mount.parentNode) return;
      if (mount !== theme && !(mount.parentNode === theme.parentNode && mount.nextSibling === theme)) {
        var state = scrollState();
        theme.parentNode.insertBefore(mount, theme);
        restoreScroll(state);
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(function () { restoreScroll(state); });
        }
      }
      if (!theme.closest("[data-nameless-block]")) {
        theme.style.setProperty("display", "none", "important");
        theme.setAttribute("aria-hidden", "true");
        theme.setAttribute("data-nameless-hidden-theme-atc", "true");
      }
    }
    place();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () {
        place();
        requestAnimationFrame(place);
      });
    }
    setTimeout(place, 0);
    setTimeout(place, 100);
    setTimeout(place, 400);
  })();
});
