window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx.snapshot || {};
  var container = ctx.container;
  var selectors = snapshot.selectors || [];
  var conditionSets = snapshot.conditionSets || [];
  var meta = snapshot.meta || {};
  if (!container) return;

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

  function themeVariantRoot() {
    return document.querySelector("variant-selects");
  }

  function themeSelectedOptionValue() {
    var root = themeVariantRoot();
    if (!root) return "";
    var checked = root.querySelector('input[type="radio"]:checked');
    if (checked && checked.value) return String(checked.value).trim();
    var select = root.querySelector("select");
    if (select && select.value) return String(select.value).trim();
    var label = root.querySelector(".form__label__value");
    if (label && label.textContent) return String(label.textContent).trim();
    return "";
  }

  function themeJsonVariants() {
    var root = themeVariantRoot();
    if (!root) return [];
    var script = root.querySelector('script[type="application/json"]');
    if (!script) return [];
    try {
      var data = JSON.parse(script.textContent || "[]");
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.variants)) return data.variants;
    } catch (err) {}
    return [];
  }

  function themeSelectedNumericId() {
    var title = themeSelectedOptionValue();
    var json = themeJsonVariants();
    var i;
    for (i = 0; i < json.length; i++) {
      var item = json[i];
      if (!item) continue;
      if (
        (item.title && String(item.title).trim() === title) ||
        (item.option1 && String(item.option1).trim() === title) ||
        (item.public_title && String(item.public_title).trim() === title)
      ) {
        return numericId(item.id);
      }
    }
    var idInput = document.querySelector('form[action*="/cart/add"] [name="id"]');
    if (idInput && idInput.value) return numericId(idInput.value);
    try {
      var fromUrl = new URLSearchParams(window.location.search).get("variant");
      if (fromUrl) return numericId(fromUrl);
    } catch (err) {}
    return "";
  }

  function themeMatchedVariant(prod) {
    var variants = (prod && prod.variants) || [];
    if (!variants.length) return null;
    var numeric = themeSelectedNumericId();
    var title = themeSelectedOptionValue();
    var i;
    if (numeric) {
      for (i = 0; i < variants.length; i++) {
        if (numericId(variants[i].id) === numeric) return variants[i];
      }
    }
    if (title) {
      for (i = 0; i < variants.length; i++) {
        if (variants[i].title === title) return variants[i];
      }
    }
    return null;
  }

  function syncThemeOption(title) {
    var root = themeVariantRoot();
    if (!root || !title || container.__rwSyncingTheme) return;
    var radios = root.querySelectorAll('input[type="radio"]');
    var i;
    for (i = 0; i < radios.length; i++) {
      if (radios[i].value !== title) continue;
      if (radios[i].checked) return;
      container.__rwSyncingTheme = true;
      radios[i].checked = true;
      radios[i].dispatchEvent(new Event("input", { bubbles: true }));
      radios[i].dispatchEvent(new Event("change", { bubbles: true }));
      container.__rwSyncingTheme = false;
      return;
    }
    var selects = root.querySelectorAll("select");
    for (i = 0; i < selects.length; i++) {
      var options = selects[i].options;
      var k;
      for (k = 0; k < options.length; k++) {
        if (options[k].value !== title) continue;
        if (selects[i].value === title) return;
        container.__rwSyncingTheme = true;
        selects[i].value = title;
        selects[i].dispatchEvent(new Event("change", { bubbles: true }));
        container.__rwSyncingTheme = false;
        return;
      }
    }
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
    if (collection && collection.references && collection.references.nodes && collection.references.nodes.length) {
      return collection.references.nodes;
    }
    if (selector.products && selector.products.length) return selector.products;
    if (selector.resolvedProduct) return [selector.resolvedProduct];
    if (selector.product) return [selector.product];
    return [];
  }

  function activeVariant(product, selection) {
    var variants = (product && product.variants) || [];
    if (!variants.length) return null;
    var themeVar = themeMatchedVariant(product);
    var i;
    if (themeVar) {
      for (i = 0; i < variants.length; i++) {
        if (variants[i].id === themeVar.id || sameId(variants[i].id, themeVar.id)) return variants[i];
      }
    }
    if (selection && selection.variantId) {
      for (i = 0; i < variants.length; i++) {
        if (variants[i].id === selection.variantId || sameId(variants[i].id, selection.variantId)) return variants[i];
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
      if (resolveProduct(selectors[i], pageId) || isCollection(selectors[i]) || selectors[i].product) {
        matches.push(selectors[i]);
      }
    }
    if (!matches.length) return selectors[0] || null;
    if (pageId) {
      for (i = 0; i < matches.length; i++) {
        var product = resolveProduct(matches[i], pageId);
        if (product && sameId(product.id, pageId)) return matches[i];
      }
      for (i = 0; i < matches.length; i++) {
        if (isCollection(matches[i])) return matches[i];
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
      var reward = rewards[i];
      if (reward && reward.type === "fixedDiscount" && appliesTo(reward, selectorId)) {
        amount += Number(reward.amount) || 0;
        if (reward.mode) mode = String(reward.mode);
      }
    }
    return { amount: amount, mode: mode };
  }

  function isSetPriceReward(reward) {
    if (!reward) return false;
    var type = String(reward.type || "");
    var raw = reward.raw || {};
    var spec = raw.spec && typeof raw.spec === "object" ? raw.spec : {};
    var rawType = String(reward.rawType || spec.type || raw.type || "");
    return type === "setPrice" || type === "set_price" || /set[_-]?price/i.test(rawType);
  }

  function readSetPriceReward(reward) {
    if (!reward) return { amount: 0, mode: "TOTAL" };
    var raw = reward.raw || {};
    var spec = raw.spec && typeof raw.spec === "object" ? raw.spec : {};
    var amount = reward.price;
    if (amount == null) amount = reward.amount;
    if (amount == null) amount = spec.price;
    if (amount == null) amount = spec.amount;
    if (amount == null) amount = raw.price;
    var mode = reward.mode || spec.mode || raw.mode || "TOTAL";
    if (mode === "PER_SELECTOR" || mode === "SET") mode = "TOTAL";
    if (mode === "SET_PER_UNIT") mode = "PER_UNIT";
    return { amount: Number(amount) || 0, mode: String(mode) };
  }

  function setPriceFor(set, selectorId) {
    var found = { amount: 0, mode: "TOTAL" };
    var rewards = rewardsOf(set);
    for (var i = 0; i < rewards.length; i++) {
      if (rewards[i] && isSetPriceReward(rewards[i]) && appliesTo(rewards[i], selectorId)) {
        var parsed = readSetPriceReward(rewards[i]);
        if (parsed.amount > 0) found = parsed;
      }
    }
    return found;
  }

  function resolveSetPrice(qty, fromSet) {
    if (fromSet && Number(fromSet.amount) > 0) return fromSet;
    var map = meta.setPrices || meta.setPriceByQty || {};
    var value = map[qty];
    if (value == null) value = map[String(qty)];
    if (value == null) return { amount: 0, mode: "TOTAL" };
    if (typeof value === "number") return { amount: value, mode: meta.setPriceMode || "TOTAL" };
    return {
      amount: Number(value.amount) || 0,
      mode: value.mode || meta.setPriceMode || "TOTAL"
    };
  }

  function priceFor(qty, unitPrice, percent, fixed, setPrice) {
    var quantity = Math.max(1, Number(qty) || 1);
    var base = Number(unitPrice) || 0;
    var pack = resolveSetPrice(quantity, setPrice);
    var setAmt = pack && Number(pack.amount) > 0 ? Number(pack.amount) : 0;
    var setMode = pack && pack.mode ? String(pack.mode) : "TOTAL";
    if (setAmt > 0) {
      var finalTotal = setMode === "PER_UNIT" ? setAmt * quantity : setAmt;
      return {
        base: roundMoney(base),
        final: roundMoney(finalTotal / quantity),
        baseTotal: roundMoney(base * quantity),
        finalTotal: roundMoney(finalTotal)
      };
    }
    var pct = Number(percent) || 0;
    var off = fixed && Number(fixed.amount) > 0 ? Number(fixed.amount) : 0;
    var offMode = fixed && fixed.mode ? String(fixed.mode) : "TOTAL";
    var discounted = base * (1 - pct / 100) * quantity;
    var take = 0;
    if (off > 0) take = offMode === "PER_UNIT" ? Math.min(off * quantity, discounted) : Math.min(off, discounted);
    var finalTotal = Math.max(0, discounted - take);
    return {
      base: roundMoney(base),
      final: roundMoney(finalTotal / quantity),
      baseTotal: roundMoney(base * quantity),
      finalTotal: roundMoney(finalTotal)
    };
  }

  function savePercent(tier, priced) {
    if (tier.percentage > 0) return Math.round(tier.percentage);
    if (priced.final < priced.base - 0.001) return Math.round((priced.base - priced.final) / priced.base * 100);
    return 0;
  }

  function isSelected(tier, qty, tiers, index) {
    if (!(qty > 0)) return false;
    if (!tier.open) return qty === tier.quantity;
    var next = tiers[index + 1];
    return next ? qty >= tier.min && qty < next.min : qty >= tier.min;
  }

  function productSoldOut(prod) {
    if (!prod) return false;
    if (prod.available === false) return true;
    var variants = prod.variants || [];
    if (!variants.length) return false;
    var i;
    for (i = 0; i < variants.length; i++) {
      if (variants[i] && variants[i].available) return false;
    }
    return true;
  }

  function itemUnavailable(item) {
    if (!item) return false;
    if (item.kind === "variant") return !!(item.variant && item.variant.available === false);
    if (item.kind === "product") {
      if (item.product && item.product.available === false) return true;
      var chosen = activeVariant(item.product, null);
      return !chosen || chosen.available === false;
    }
    return false;
  }

  function selectionSoldOut() {
    var entries = selectionEntries();
    var i;
    for (i = 0; i < entries.length; i++) {
      if (entries[i] && entries[i].soldOut && (typeof entries[i].quantity !== "number" || entries[i].quantity > 0)) return true;
    }
    return false;
  }

  function buildTiers(selector) {
    if (!selector) return [];
    var map = {};
    var i;
    for (i = 0; i < conditionSets.length; i++) {
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
          fixed: fixedFor(set, selector.id),
          setPrice: setPriceFor(set, selector.id)
        };
      }
    }
    var tiers = Object.keys(map).map(function (key) {
      return map[key];
    }).sort(function (a, b) {
      return a.min - b.min;
    });
    for (i = 0; i < tiers.length; i++) {
      if (i === tiers.length - 1) {
        tiers[i].open = true;
        tiers[i].max = null;
      } else {
        tiers[i].open = false;
        tiers[i].max = tiers[i].min;
        tiers[i].quantity = tiers[i].min;
      }
    }
    return tiers;
  }

  function tierTitle(tier) {
    var qty = Number(tier.min) || 1;
    if (meta.tierTitles && meta.tierTitles[qty] != null) return String(meta.tierTitles[qty]);
    var priced = priceFor(qty, unitPrice, tier.percentage, tier.fixed, tier.setPrice);
    var save = savePercent(tier, priced);
    if (save > 0) return "Buy " + qty + (tier.open ? " or more" : "") + " = Save " + save + "%";
    var units = num(meta.unitsPerKit);
    if (units == null || units <= 0) units = 72;
    return "Buy " + qty + " (" + qty * units + " " + (meta.unitLabel || "balls") + ")";
  }

  function tierBadge(tier, index, count) {
    var badges = meta.tierBadges || meta.badges || null;
    if (badges) {
      if (badges[tier.min] != null) return String(badges[tier.min]);
      if (badges[String(tier.min)] != null) return String(badges[String(tier.min)]);
      if (badges[index] != null) return String(badges[index]);
    }
    if (count < 2) return "";
    if (index === 1) return meta.midTierBadge || "+ FREE SHIPPING";
    if (index === count - 1) return meta.lastTierBadge || "+ FREE SHIPPING";
    return "";
  }

  function tierRibbon(index, count) {
    if (count < 2) return "";
    if (index === count - 1) return meta.lastRibbon || "Best Value";
    if (index === 1) return meta.midRibbon || meta.popularLabel || "Most popular";
    return "";
  }

  function ribbonHtml(label) {
    return (
      '<div class="rw-ribbon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">' +
          '<path d="M8 0L0 8H8V0Z" fill="var(--rbr__fill-badge)"></path>' +
          '<path d="M8 0L0 8H8V0Z" fill="black" opacity="0.2"></path>' +
        "</svg>" +
        '<span class="rw-ribbon__label">' + esc(label) + "</span>" +
        '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">' +
          '<path d="M0 0L8 8H0V0Z" fill="var(--rbr__fill-badge)"></path>' +
          '<path d="M0 0L8 8H0V0Z" fill="black" opacity="0.2"></path>' +
        "</svg>" +
      "</div>"
    );
  }

  function selectionEntries() {
    if (!selector) return [];
    var raw = snapshot.selections && snapshot.selections[selector.id];
    if (!raw) return [];
    return Array.isArray(raw) ? raw.filter(Boolean) : [raw];
  }

  function namedVariants(prod) {
    var variants = (prod && prod.variants) || [];
    var named = [];
    var i;
    for (i = 0; i < variants.length; i++) {
      if (variants[i] && variants[i].title && variants[i].title !== "Default Title") named.push(variants[i]);
    }
    return named;
  }

  function packagingItems() {
    if (isCollection(selector)) {
      var products = collectionProducts(selector);
      if (products.length) {
        return products.map(function (item) {
          return { kind: "product", id: item.id, title: item.title, product: item };
        });
      }
    }
    var variants = namedVariants(product);
    if (variants.length) {
      return variants.map(function (item) {
        return { kind: "variant", id: item.id, title: item.title, variant: item };
      });
    }
    if (product) {
      var chosen = variant || (product.variants && product.variants[0]) || null;
      return [{
        kind: "variant",
        id: chosen && chosen.id || product.id,
        title: product.title,
        variant: chosen
      }];
    }
    return [];
  }

  function packagingKind() {
    var items = packagingItems();
    return items.length ? items[0].kind : "";
  }

  function findPackagingItem(id) {
    var items = packagingItems();
    var i;
    for (i = 0; i < items.length; i++) {
      if (sameId(items[i].id, id) || items[i].id === id) return items[i];
    }
    return items[0] || null;
  }

  function defaultPackagingId() {
    var items = packagingItems();
    if (!items.length) return product && product.id || "";
    var themeVar = themeMatchedVariant(product);
    var i;
    if (themeVar) {
      for (i = 0; i < items.length; i++) {
        if (items[i].kind === "variant" && (items[i].id === themeVar.id || sameId(items[i].id, themeVar.id))) return items[i].id;
        if (items[i].kind === "product" && items[i].title === themeVar.title) return items[i].id;
      }
    }
    var current = product && product.id;
    if (current) {
      for (i = 0; i < items.length; i++) {
        if (items[i].kind === "product" && sameId(items[i].id, current)) return items[i].id;
        if (items[i].kind === "variant" && variant && items[i].id === variant.id) return items[i].id;
      }
    }
    return items[0].id;
  }

  function slotIds(count) {
    var stored = container.__rwSlots || [];
    var fromSelection = [];
    var entries = selectionEntries();
    var i;
    var j;
    if (packagingKind() === "product") {
      for (i = 0; i < entries.length; i++) {
        var qty = typeof entries[i].quantity === "number" ? entries[i].quantity : 0;
        for (j = 0; j < qty; j++) fromSelection.push(entries[i].productId || defaultPackagingId());
      }
    } else {
      var variantId = selection && selection.variantId || defaultPackagingId();
      var selectedQty = selection && typeof selection.quantity === "number" ? selection.quantity : count;
      for (i = 0; i < selectedQty; i++) fromSelection.push(stored[i] || variantId);
    }
    var base = stored.length ? stored : fromSelection;
    var slots = [];
    var fallback = defaultPackagingId();
    for (i = 0; i < count; i++) slots.push(base[i] || fallback);
    container.__rwSlots = slots;
    return slots;
  }

  function slotBaseTotal(count) {
    var slots = slotIds(count);
    var total = 0;
    var i;
    for (i = 0; i < slots.length; i++) {
      var item = findPackagingItem(slots[i]);
      if (item && item.kind === "product") {
        var chosen = activeVariant(item.product, null);
        total += chosen && Number(chosen.priceAmount) || unitPrice;
      } else if (item && item.variant) {
        total += Number(item.variant.priceAmount) || unitPrice;
      } else {
        total += unitPrice;
      }
    }
    return total;
  }

  function priceForCount(qty, percent, fixed, setPrice) {
    if (packagingItems().length && qty > 0) {
      var baseTotal = slotBaseTotal(qty);
      var unit = qty > 0 ? baseTotal / qty : unitPrice;
      return priceFor(qty, unit, percent, fixed, setPrice);
    }
    return priceFor(qty, unitPrice, percent, fixed, setPrice);
  }

  function dispatchPackaging(slots) {
    container.__rwSlots = slots;
    if (!window.nameless || typeof window.nameless.dispatch !== "function") return;
    if (packagingKind() !== "product") return;
    var counts = {};
    var i;
    for (i = 0; i < slots.length; i++) {
      counts[slots[i]] = (counts[slots[i]] || 0) + 1;
    }
    var items = packagingItems();
    var changes = [];
    for (i = 0; i < items.length; i++) {
      var item = items[i];
      var chosen = activeVariant(item.product, null);
      changes.push({
        selectorId: selector.id,
        productId: item.id,
        quantity: counts[item.id] || 0,
        variantId: chosen && chosen.id
      });
    }
    window.nameless.dispatch("selectionPlanChange", {
      bundleId: snapshot.bundleId,
      changes: changes
    });
  }

  function qtyHtml(tier) {
    var current = quantity >= tier.min ? quantity : tier.min;
    var down = Math.max(tier.min, current - 1);
    var up = current + 1;
    var atMin = current <= tier.min;
    var collectionPack = packagingKind() === "product";
    var minusAttr = collectionPack
      ? ' data-rw-set-qty="' + esc(down) + '"'
      : ' data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + ' value="' + esc(down) + '"';
    var plusAttr = collectionPack
      ? ' data-rw-set-qty="' + esc(up) + '"'
      : ' data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + ' value="' + esc(up) + '"';
    return (
      '<div class="rw-qty" data-rw-qty>' +
        '<div class="rw-qty__title"><span>' + esc(meta.qtyLabel || "Quantity") + "</span></div>" +
        '<div class="rw-qty__controls">' +
          '<button class="rw-qty__btn' + (atMin ? " is-disabled" : "") + '" type="button"' + minusAttr + ' aria-label="Decrease quantity"' + (atMin ? " disabled" : "") + ">-</button>" +
          '<div class="rw-qty__value" aria-live="polite">' + esc(current) + "</div>" +
          '<button class="rw-qty__btn" type="button"' + plusAttr + ' aria-label="Increase quantity">+</button>' +
        "</div>" +
      "</div>"
    );
  }

  function packagingHtml(count) {
    var items = packagingItems();
    if (!items.length || count < 1) return "";
    var hidden = !!container.__rwPackagingHidden;
    var slots = slotIds(count);
    var rows = "";
    var i;
    var j;
    for (i = 0; i < slots.length; i++) {
      var options = "";
      for (j = 0; j < items.length; j++) {
        var unavailable = itemUnavailable(items[j]);
        options +=
          '<option value="' + esc(items[j].id) + '"' +
          (items[j].id === slots[i] || sameId(items[j].id, slots[i]) ? " selected" : "") +
          (unavailable ? " disabled" : "") +
          ">" + esc(items[j].title) + (unavailable ? " — Sold out" : "") + "</option>";
      }
      rows +=
        '<div class="rw-pack__slot">' +
          '<span class="rw-pack__index">#' + (i + 1) + "</span>" +
          '<select class="rw-pack__select" data-rw-pack-slot="' + i + '" aria-label="Packaging ' + (i + 1) + '">' + options + "</select>" +
        "</div>";
    }
    return (
      '<div class="rw-pack' + (hidden ? " is-hidden" : "") + '" data-rw-pack>' +
        '<div class="rw-pack__head">' +
          '<div class="rw-pack__title"><span>' + esc(meta.packagingLabel || "Choose Packaging") + "</span></div>" +
          '<button class="rw-pack__toggle" type="button" data-rw-pack-toggle>' + esc(hidden ? (meta.showLabel || "Show") : (meta.hideLabel || "Hide")) + "</button>" +
        "</div>" +
        '<div class="rw-pack__slots"' + (hidden ? " hidden" : "") + ">" + rows + "</div>" +
      "</div>"
    );
  }

  function variantOptions() {
    var named = namedVariants(product);
    if (named.length >= 2) return named;
    var json = themeJsonVariants();
    if (json.length >= 2) {
      return json.map(function (item) {
        var id = item && item.id != null ? String(item.id) : "";
        var knit = null;
        var variants = (product && product.variants) || [];
        var i;
        for (i = 0; i < variants.length; i++) {
          if (sameId(variants[i].id, id) || variants[i].title === (item.title || item.option1)) {
            knit = variants[i];
            break;
          }
        }
        return knit || {
          id: id.indexOf("gid://") === 0 ? id : "gid://shopify/ProductVariant/" + numericId(id),
          title: item.title || item.option1 || "",
          available: item.available !== false,
          priceAmount: item.price != null ? Number(item.price) / 100 : unitPrice
        };
      });
    }
    return named;
  }

  function variantButtonsHtml() {
    var options = variantOptions();
    if (options.length < 2) return "";
    var current = themeMatchedVariant(product) || variant;
    var currentTitle = (current && current.title) || themeSelectedOptionValue() || options[0].title;
    var optionName = meta.variantOptionLabel || "Packaging";
    var buttons = "";
    var i;
    for (i = 0; i < options.length; i++) {
      var option = options[i];
      var on = !!(current && (option.id === current.id || sameId(option.id, current.id) || option.title === currentTitle));
      var out = option.available === false;
      buttons +=
        '<button type="button" class="rw-var__btn' + (on ? " is-selected" : "") + (out ? " is-soldout" : "") + '" data-rw-variant="' + esc(option.id) + '" data-rw-variant-title="' + esc(option.title) + '"' +
        (out ? " disabled" : "") +
        ' aria-pressed="' + (on ? "true" : "false") + '">' +
        esc(option.title) +
        "</button>";
    }
    return (
      '<div class="rw-var" data-rw-var>' +
        '<div class="rw-var__label">' + esc(optionName) + ': <span>' + esc(currentTitle) + "</span></div>" +
        '<div class="rw-var__btns">' + buttons + "</div>" +
      "</div>"
    );
  }

  function variantBridge() {
    if (!selector || !product) return "";
    var variants = product.variants || [];
    if (!variants.length) return "";
    var selectedId = "";
    var themeVar = themeMatchedVariant(product);
    if (themeVar) selectedId = themeVar.id;
    else if (selection && selection.variantId) selectedId = selection.variantId;
    var options = "";
    for (var i = 0; i < variants.length; i++) {
      var variant = variants[i];
      options +=
        '<option value="' + esc(variant.id) + '"' +
        (variant.id === selectedId || sameId(variant.id, selectedId) ? " selected" : "") +
        (variant.available ? "" : " disabled") +
        ">" + esc(variant.title) + (variant.available ? "" : " — Sold out") + "</option>";
    }
    return '<select class="rw-variant-bridge" tabindex="-1" aria-hidden="true" data-nameless-variant-selector="' + esc(selector.id) + '"' + productAttr + ">" + options + "</select>";
  }

  function renderTier(tier, index) {
    var last = index === tiers.length - 1;
    var selected = !soldOut && (isSelected(tier, quantity, tiers, index) || (quantity <= 0 && index === 0));
    var displayQty = selected && last && quantity >= tier.min ? quantity : tier.min;
    var priced = selected && last
      ? priceForCount(displayQty, tier.percentage, tier.fixed, tier.setPrice)
      : priceFor(displayQty, unitPrice, tier.percentage, tier.fixed, tier.setPrice);
    var onSale = priced.finalTotal < priced.baseTotal - 0.001;
    var ribbon = tierRibbon(index, tiers.length);
    var badge = tierBadge(tier, index, tiers.length);
    var showQty = selected && last;
    var collectionPack = packagingKind() === "product";
    var qtyAttr = collectionPack
      ? ' data-rw-set-qty="' + displayQty + '"'
      : ' data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + ' value="' + displayQty + '"';
    return (
      '<div class="rw-tier' + (selected ? " is-selected" : "") + (ribbon ? " has-ribbon" : "") + '">' +
        (ribbon ? ribbonHtml(ribbon) : "") +
        '<button class="rw-tier__main' + (selected ? " is-selected" : "") + '" type="button"' + qtyAttr + ' aria-pressed="' + (selected ? "true" : "false") + '">' +
          '<span class="rw-radio" aria-hidden="true"></span>' +
          '<span class="rw-tier__copy' + (last ? " rw-tier__copy--stack" : "") + '">' +
            "<span>" + esc(tierTitle(tier)) + "</span>" +
            (badge ? '<span class="rw-tier__badge"><span>' + esc(badge) + "</span></span>" : "") +
          "</span>" +
          '<span class="rw-tier__prices">' +
            (onSale ? '<span class="rw-visually-hidden">Sale price</span>' : "") +
            '<span class="rw-tier__price money">' + esc(money(priced.finalTotal, currency)) + "</span>" +
            (onSale ? '<span class="rw-visually-hidden">Regular price</span><span class="rw-tier__compare money">' + esc(money(priced.baseTotal, currency)) + "</span>" : "") +
          "</span>" +
        "</button>" +
        (showQty ? '<div class="rw-divider" aria-hidden="true"></div>' + qtyHtml(tier) : "") +
      "</div>"
    );
  }

  function bindActions() {
    var widget = container.querySelector(".rw-widget");
    if (!widget) return;

    var buyNow = widget.querySelector("[data-rw-buynow]");
    if (buyNow) {
      buyNow.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (buyNow.disabled) return;
        var atc = widget.querySelector("[data-nameless-atc]");
        if (!atc || atc.disabled) return;
        container.__rwBuyNow = true;
        atc.click();
        var ticks = 0;
        var timer = setInterval(function () {
          ticks += 1;
          if ((atc.textContent || "").toLowerCase().indexOf("added") !== -1 || ticks > 50) {
            clearInterval(timer);
            if (container.__rwBuyNow) {
              container.__rwBuyNow = false;
              window.location.href = "/checkout";
            }
          }
        }, 100);
      });
    }

    widget.addEventListener("click", function (event) {
      var varBtn = event.target && event.target.closest && event.target.closest("[data-rw-variant]");
      if (!varBtn || varBtn.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      var variantId = varBtn.getAttribute("data-rw-variant");
      var title = varBtn.getAttribute("data-rw-variant-title") || "";
      var bridge = widget.querySelector(".rw-variant-bridge");
      if (bridge && variantId) {
        var match = "";
        var opts = bridge.options;
        var i;
        for (i = 0; i < opts.length; i++) {
          if (opts[i].value === variantId || sameId(opts[i].value, variantId)) {
            match = opts[i].value;
            break;
          }
        }
        if (match) {
          bridge.value = match;
          container.__rwPushedThemeId = match;
          container.__rwThemeVariantId = match;
          if (container.__rwSlots && container.__rwSlots.length) {
            for (i = 0; i < container.__rwSlots.length; i++) container.__rwSlots[i] = match;
          }
          bridge.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      if (title) syncThemeOption(title);
    });

    widget.addEventListener("change", function (event) {
      var target = event.target;
      if (!target || !target.getAttribute || !target.hasAttribute("data-rw-pack-slot")) return;
      var index = Number(target.getAttribute("data-rw-pack-slot"));
      if (!Number.isFinite(index)) return;
      var slots = (container.__rwSlots || []).slice();
      slots[index] = target.value;
      container.__rwSlots = slots;
      if (packagingKind() === "product") {
        dispatchPackaging(slots);
        return;
      }
      var bridge = widget.querySelector(".rw-variant-bridge");
      if (bridge && target.value && bridge.value !== target.value) {
        bridge.value = target.value;
        bridge.dispatchEvent(new Event("change", { bubbles: true }));
      }
      var item = findPackagingItem(target.value);
      if (item && item.kind === "variant" && item.title) syncThemeOption(item.title);
      if (item && item.variant && item.variant.title) syncThemeOption(item.variant.title);
    });

    widget.addEventListener("click", function (event) {
      var btn = event.target && event.target.closest && event.target.closest("[data-rw-set-qty]");
      if (!btn || btn.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      var nextQty = Math.max(1, Number(btn.getAttribute("data-rw-set-qty")) || 1);
      var slots = slotIds(nextQty);
      if (slots.length > nextQty) slots = slots.slice(0, nextQty);
      while (slots.length < nextQty) slots.push(slots[slots.length - 1] || defaultPackagingId());
      dispatchPackaging(slots);
    });

    if (!soldOut && quantity <= 0 && !container.__rwDefaultTier) {
      var first = widget.querySelector(".rw-tier__main");
      if (first && !first.disabled) {
        container.__rwDefaultTier = true;
        first.click();
      }
    }

    var atcButton = widget.querySelector("[data-nameless-atc]");
    if (atcButton) {
      atcButton.addEventListener("click", function () {
        if (container.__rwBuyNow) return;
        var ticks = 0;
        var timer = setInterval(function () {
          ticks += 1;
          var added = (atcButton.textContent || "").toLowerCase().indexOf("added") !== -1;
          if (added || ticks > 50) {
            clearInterval(timer);
            if (added && !container.__rwBuyNow) {
              document.documentElement.dispatchEvent(new CustomEvent("cart:refresh", { bubbles: true }));
              var cartLink = document.querySelector('a[href*="/cart"]');
              setTimeout(function () {
                if (cartLink) cartLink.click();
              }, 100);
            }
          }
        }, 100);
      });
    }

    bindThemeVariantSync();
  }

  function applyThemeVariantToBundle() {
    var widget = container.querySelector(".rw-widget");
    var matched = themeMatchedVariant(product);
    if (!matched || container.__rwSyncingTheme) return;
    if (container.__rwPushedThemeId && sameId(container.__rwPushedThemeId, matched.id)) return;

    var slots = container.__rwSlots;
    var prev = container.__rwThemeVariantId;
    var i;
    if (slots && slots.length) {
      var uniform = true;
      for (i = 0; i < slots.length; i++) {
        if (!(sameId(slots[i], slots[0]) || (prev && sameId(slots[i], prev)))) {
          uniform = false;
          break;
        }
      }
      if (uniform) {
        for (i = 0; i < slots.length; i++) slots[i] = matched.id;
        container.__rwSlots = slots;
      }
    }
    container.__rwThemeVariantId = matched.id;

    var bridge = widget && widget.querySelector(".rw-variant-bridge");
    if (!bridge) {
      container.__rwPushedThemeId = matched.id;
      return;
    }
    var optionMatch = "";
    var options = bridge.options;
    for (i = 0; i < options.length; i++) {
      if (options[i].value === matched.id || sameId(options[i].value, matched.id)) {
        optionMatch = options[i].value;
        break;
      }
    }
    if (!optionMatch) {
      container.__rwPushedThemeId = matched.id;
      return;
    }
    container.__rwPushedThemeId = matched.id;
    if (bridge.value !== optionMatch) bridge.value = optionMatch;
    var knitId = selection && selection.variantId;
    if (!knitId || !sameId(knitId, matched.id)) {
      bridge.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function revealThemeVariants() {
    var root = themeVariantRoot();
    var block = container.closest("[data-nameless-block]") || container;
    if (!root) return;
    root.removeAttribute("data-hide-variants");
    root.setAttribute("data-is-disabled", "false");
    root.removeAttribute("aria-hidden");
    root.removeAttribute("hidden");
    root.classList.remove("hidden", "hide", "visually-hidden");
    root.style.setProperty("display", "block", "important");
    root.style.setProperty("visibility", "visible", "important");
    root.style.setProperty("opacity", "1", "important");
    root.style.setProperty("height", "auto", "important");
    root.style.setProperty("pointer-events", "auto", "important");
    root.setAttribute("data-nameless-shown", "true");
    var inputs = root.querySelectorAll("input, label, select, button");
    var i;
    for (i = 0; i < inputs.length; i++) {
      inputs[i].disabled = false;
      inputs[i].removeAttribute("aria-disabled");
      inputs[i].style.pointerEvents = "auto";
    }
    if (block && block.parentNode && block.previousElementSibling !== root) {
      block.parentNode.insertBefore(root, block);
    }
  }

  function bindThemeVariantSync() {
    revealThemeVariants();
    if (!themeVariantRoot() && variantOptions().length < 2) return;
    applyThemeVariantToBundle();
    if (container.__rwThemeHandler) {
      document.removeEventListener("change", container.__rwThemeHandler, true);
    }
    container.__rwThemeHandler = function (event) {
      var target = event.target;
      if (!target || !target.closest || !target.closest("variant-selects")) return;
      if (container.__rwSyncingTheme) return;
      container.__rwPushedThemeId = "";
      applyThemeVariantToBundle();
    };
    document.addEventListener("change", container.__rwThemeHandler, true);
    if (container.__rwShopifyVariantHandler) {
      document.removeEventListener("variant:change", container.__rwShopifyVariantHandler);
    }
    container.__rwShopifyVariantHandler = function () {
      if (container.__rwSyncingTheme) return;
      container.__rwPushedThemeId = "";
      applyThemeVariantToBundle();
    };
    document.addEventListener("variant:change", container.__rwShopifyVariantHandler);
  }

  function placeBeforeThemeAtc() {
    var block = container.closest("[data-nameless-block]") || container;
    function move() {
      var themeAtc = document.querySelector("form .product-add-to-cart-container");
      if (!themeAtc || !themeAtc.parentNode) return;
      if (block && block !== themeAtc && (block.parentNode !== themeAtc.parentNode || block.nextSibling !== themeAtc)) {
        themeAtc.parentNode.insertBefore(block, themeAtc);
      }
      if (!themeAtc.closest("[data-nameless-block]")) {
        themeAtc.style.setProperty("display", "none", "important");
        themeAtc.setAttribute("aria-hidden", "true");
        themeAtc.setAttribute("data-nameless-hidden-theme-atc", "true");
      }
    }
    if (!block || !block.parentNode) return;
    move();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () {
        move();
        requestAnimationFrame(move);
      });
    }
    setTimeout(move, 0);
    setTimeout(move, 100);
    setTimeout(move, 400);
  }

  var pageId = pageProductId();
  var selector = pickVolumeSelector(pageId);
  var product = resolveProduct(selector, pageId) || (selector ? {
    id: pageId ? "gid://shopify/Product/" + pageId : "gid://shopify/Product/preview",
    title: "Preview",
    variants: [{
      id: "gid://shopify/ProductVariant/preview",
      title: "Default Title",
      available: true,
      priceAmount: Number(meta.previewPrice) || 75.99,
      currencyCode: currencyCode()
    }]
  } : null);
  var productAttr = selector && isCollection(selector) && product ? ' data-nameless-product-id="' + esc(product.id) + '"' : "";
  var selection = selectionFor(selector, product);
  var variant = activeVariant(product, selection);
  var unitPrice = variant && Number(variant.priceAmount) || 0;
  var currency = (variant && variant.currencyCode) || currencyCode();
  var tiers = buildTiers(selector);
  var i;
  var quantity = 0;
  var selectionList = snapshot.selections && selector ? snapshot.selections[selector.id] : null;
  if (Array.isArray(selectionList)) {
    for (i = 0; i < selectionList.length; i++) {
      if (selectionList[i] && typeof selectionList[i].quantity === "number") quantity += selectionList[i].quantity;
    }
  } else if (selection && typeof selection.quantity === "number") {
    quantity = selection.quantity;
  }
  var heading = meta.title || meta.heading || "More balls... More discount...";
  var activeTier = null;
  for (i = 0; i < tiers.length; i++) {
    if (isSelected(tiers[i], quantity, tiers, i)) {
      activeTier = tiers[i];
      break;
    }
  }
  if (!activeTier && tiers.length) activeTier = quantity > 0 ? tiers[tiers.length - 1] : tiers[0];
  var atcQty = activeTier && quantity > 0 ? quantity : activeTier ? activeTier.min : 1;
  var lastOpenSelected = !!(activeTier && tiers.length && activeTier === tiers[tiers.length - 1] && quantity >= activeTier.min);
  var atcPriced = activeTier
    ? (lastOpenSelected
      ? priceForCount(atcQty, activeTier.percentage, activeTier.fixed, activeTier.setPrice)
      : priceFor(atcQty, unitPrice, activeTier.percentage, activeTier.fixed, activeTier.setPrice))
    : null;
  var atcSave = activeTier && atcPriced ? savePercent(activeTier, atcPriced) : 0;
  var soldOut = productSoldOut(product) || selectionSoldOut() || !!(variant && variant.available === false);
  if (!soldOut && container.__rwSlots && container.__rwSlots.length) {
    for (i = 0; i < container.__rwSlots.length; i++) {
      if (itemUnavailable(findPackagingItem(container.__rwSlots[i]))) {
        soldOut = true;
        break;
      }
    }
  }
  var atcLabel = soldOut
    ? esc(meta.soldOutLabel || "Sold out")
    : lastOpenSelected
      ? "Buy " + esc(atcQty) + (atcSave > 0 ? ' | save <span class="money">' + esc(atcSave) + "%</span>" : "")
      : esc(meta.atcLabel || "Add to cart");
  var showBuyNow = !soldOut && meta.showBuyNow === true;

  container.innerHTML =
    '<div class="rw-widget">' +
      (selector && product && tiers.length
        ? (themeVariantRoot() ? "" : variantButtonsHtml()) +
          '<div class="rw-heading"><div class="rw-heading__title"><span>' + esc(heading) + '</span></div><div class="rw-heading__rule" aria-hidden="true"></div></div>' +
          (soldOut ? '<div class="rw-soldout" role="status"><span>' + esc(meta.soldOutMessage || "The product is sold out") + "</span></div>" : "") +
          '<div class="rw-tier-list">' + tiers.map(renderTier).join("") + "</div>" +
          variantBridge() +
          '<div class="rw-actions">' +
            '<button class="rw-atc' + (soldOut ? " is-soldout" : "") + '" type="button" data-nameless-atc="' + esc(snapshot.bundleId) + '"' + (soldOut ? " disabled" : "") + "><span>" + atcLabel + "</span></button>" +
            (showBuyNow ? '<button class="rw-buynow" type="button" data-rw-buynow' + (soldOut ? " disabled" : "") + ">" + esc(meta.buyNowLabel || "Buy it now") + "</button>" : "") +
          "</div>"
        : "") +
    "</div>";

  bindActions();
  placeBeforeThemeAtc();
  revealThemeVariants();
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(function () {
      revealThemeVariants();
      requestAnimationFrame(revealThemeVariants);
    });
  }
  setTimeout(revealThemeVariants, 0);
  setTimeout(revealThemeVariants, 100);
  setTimeout(revealThemeVariants, 400);
});
