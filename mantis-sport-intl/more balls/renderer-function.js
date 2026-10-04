window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx.snapshot || {};
  var container = ctx.container;
  var selectors = snapshot.selectors || [];
  var conditionSets = snapshot.conditionSets || [];
  var meta = snapshot.meta || {};
  var SET_PRICES = { 1: 7.75, 3: 19.99, 6: 34.99, 18: 97.65 };
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
    var i;
    if (selection && selection.variantId) {
      for (i = 0; i < variants.length; i++) {
        if (variants[i].id === selection.variantId || sameId(variants[i].id, selection.variantId)) return variants[i];
      }
    }
    for (i = 0; i < variants.length; i++) {
      if (variants[i].available) return variants[i];
    }
    return variants[0];
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
        var chosen = activeVariant(products[i], null);
        if (chosen && chosen.available) return products[i];
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

  function readPercent(reward) {
    if (!reward) return 0;
    var raw = reward.raw || {};
    var spec = raw.spec && typeof raw.spec === "object" ? raw.spec : {};
    var type = String(reward.type || "");
    var rawType = String(reward.rawType || spec.type || raw.type || "");
    var isPct = type === "percentageDiscount" || type === "percentage" || /percent/i.test(rawType);
    var value = reward.percentage;
    if (value == null) value = spec.percentage;
    if (value == null) value = raw.percentage;
    if (value == null) value = reward.amount;
    if (value == null) value = spec.amount;
    if (!isPct && !(Number(value) > 0 && Number(value) <= 100)) return 0;
    if (!isPct) return 0;
    return Number(value) || 0;
  }

  function percentFor(set, selectorId) {
    var total = 0;
    var rewards = rewardsOf(set);
    for (var i = 0; i < rewards.length; i++) {
      if (rewards[i] && appliesTo(rewards[i], selectorId)) total += readPercent(rewards[i]);
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

  function setPriceFromMap(map, qty) {
    if (!map || typeof map !== "object") return null;
    var value = map[qty];
    if (value == null) value = map[String(qty)];
    return value == null ? null : value;
  }

  function resolveSetPrice(qty, fromSet) {
    if (fromSet && Number(fromSet.amount) > 0) return fromSet;
    var value = setPriceFromMap(meta.setPrices || meta.setPriceByQty, qty);
    if (value == null) value = setPriceFromMap(SET_PRICES, qty);
    if (value == null) return { amount: 0, mode: "TOTAL" };
    if (typeof value === "number") return { amount: value, mode: meta.setPriceMode || "TOTAL" };
    return {
      amount: Number(value.amount) || 0,
      mode: value.mode || meta.setPriceMode || "TOTAL"
    };
  }

  function regularUnit(unit) {
    var compare = variant && (Number(variant.compareAtAmount) || Number(variant.compareAtPriceAmount) || Number(variant.compareAtPrice) || 0);
    if (compare > Number(unit) && Number(unit) > 0) return compare;
    if (Number(unit) > 0) return Number(unit);
    return Number(meta.previewPrice) || SET_PRICES[1] || 7.75;
  }

  function priceFor(qty, unitPrice, percent, fixed, setPrice, setQty) {
    var quantity = Math.max(1, Number(qty) || 1);
    var base = regularUnit(unitPrice);
    var pack = resolveSetPrice(Number(setQty) || quantity, setPrice);
    var setAmt = pack && Number(pack.amount) > 0 ? Number(pack.amount) : 0;
    var setMode = pack && pack.mode ? String(pack.mode) : "TOTAL";
    if (setAmt > 0) {
      var configuredQty = Math.max(1, Number(setQty) || quantity);
      var setTotal = setMode === "PER_UNIT" ? setAmt * quantity : setAmt * (quantity / configuredQty);
      return {
        base: roundMoney(base),
        final: roundMoney(setTotal / quantity),
        baseTotal: roundMoney(base * quantity),
        finalTotal: roundMoney(setTotal)
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

  function savePercent(tier, priced) {
    if (tier && Number(tier.percentage) > 0) return Math.round(tier.percentage);
    if (priced && priced.base > 0 && priced.final < priced.base - 0.001) {
      return Math.round((priced.base - priced.final) / priced.base * 100);
    }
    if (priced && priced.baseTotal > 0 && priced.finalTotal < priced.baseTotal - 0.001) {
      return Math.round((priced.baseTotal - priced.finalTotal) / priced.baseTotal * 100);
    }
    return 0;
  }

  function unitsPerKit() {
    var units = num(meta.unitsPerKit);
    return units == null || units <= 0 ? 4 : units;
  }

  function defaultTitle(qty) {
    var titles = meta.tierTitles || {
      1: "4 balls (1 tube)",
      3: "12 balls (3 tubes)",
      6: "24 balls (6 tubes)",
      18: "18 tube box + (72 balls)"
    };
    if (titles[qty] != null) return String(titles[qty]);
    if (titles[String(qty)] != null) return String(titles[String(qty)]);
    return "";
  }

  function tierTitle(tier, index, count, displayQty) {
    var min = Number(tier.min) || 1;
    var qty = Number(displayQty) || min;
    var last = index === count - 1 && count >= 2;
    var named = defaultTitle(qty);
    if (named) return named;
    var balls = qty * unitsPerKit();
    var unit = meta.unitLabel || "balls";
    if (last && qty > min) {
      return qty + " tube box + (" + balls + " " + unit + ")";
    }
    named = defaultTitle(min);
    if (named && qty === min) return named;
    var kit = qty === 1 ? (meta.kitLabel || "tube") : (meta.kitLabelPlural || "tubes");
    return balls + " " + unit + " (" + qty + " " + kit + ")";
  }

  function tierBadge(tier, priced, index, count) {
    var badges = meta.tierBadges || meta.badges || null;
    if (badges) {
      if (badges[tier.min] != null) return String(badges[tier.min]);
      if (badges[String(tier.min)] != null) return String(badges[String(tier.min)]);
      if (badges[index] != null) return String(badges[index]);
    }
    if (index === 0 || count < 2) return "";
    var savePct = savePercent(tier, priced);
    var shipping = meta.shippingBadge || "FREE SHIPPING";
    if (index === count - 1) {
      if (meta.lastTierBadge) return String(meta.lastTierBadge);
      if (savePct > 0) return "SAVE " + savePct + "% + " + shipping;
      return "SAVE 30% + " + shipping;
    }
    if (savePct > 0) return "SAVE " + savePct + "%";
    return "";
  }

  function tierRibbon(index, count) {
    if (count < 2) return "";
    if (index === count - 1) return meta.lastRibbon || meta.popularLabel || "Most Popular";
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

  function qtyHtml(tier) {
    var min = tier.min;
    var current = quantity >= min ? quantity : min;
    var down = Math.max(min, current - 1);
    var up = current + 1;
    var locked = current <= min;
    return (
      '<div class="rw-qty" data-rw-qty>' +
        '<div class="rw-qty__title"><span>' + esc(meta.qtyLabel || "Quantity") + "</span></div>" +
        '<div class="rw-qty__controls">' +
          '<button class="rw-qty__btn' + (locked ? " is-disabled" : "") + '" type="button" data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + ' value="' + esc(down) + '" aria-label="Decrease quantity"' + (locked ? " disabled" : "") + ">-</button>" +
          '<div class="rw-qty__value" aria-live="polite">' + esc(current) + "</div>" +
          '<button class="rw-qty__btn" type="button" data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + ' value="' + esc(up) + '" aria-label="Increase quantity">+</button>' +
        "</div>" +
      "</div>"
    );
  }

  function variantBridge() {
    if (!selector || !product) return "";
    var variants = product.variants || [];
    if (!variants.length) return "";
    var selectedId = selection && selection.variantId || "";
    var options = "";
    var i;
    for (i = 0; i < variants.length; i++) {
      var variantItem = variants[i];
      options +=
        '<option value="' + esc(variantItem.id) + '"' +
        (variantItem.id === selectedId || sameId(variantItem.id, selectedId) ? " selected" : "") +
        (variantItem.available ? "" : " disabled") +
        ">" + esc(variantItem.title) + (variantItem.available ? "" : " — Sold out") + "</option>";
    }
    return '<select class="rw-variant-bridge" tabindex="-1" aria-hidden="true" data-nameless-variant-selector="' + esc(selector.id) + '"' + productAttr + ">" + options + "</select>";
  }

  function renderTier(tier, index) {
    var last = index === tiers.length - 1;
    var selected = !soldOut && (isSelected(tier, quantity, tiers, index) || (quantity <= 0 && index === 0));
    var displayQty = selected && last && quantity >= tier.min ? quantity : tier.min;
    var priced = priceFor(displayQty, unitPrice, tier.percentage, tier.fixed, tier.setPrice, tier.min);
    var onSale = priced.finalTotal < priced.baseTotal - 0.001;
    var ribbon = tierRibbon(index, tiers.length);
    var badge = tierBadge(tier, priced, index, tiers.length);
    var showQty = selected && last;
    return (
      '<div class="rw-tier' + (selected ? " is-selected" : "") + (ribbon ? " has-ribbon" : "") + '">' +
        (ribbon ? ribbonHtml(ribbon) : "") +
        '<button class="rw-tier__main' + (selected ? " is-selected" : "") + '" type="button" data-nameless-qty-selector="' + esc(selector.id) + '"' + productAttr + ' value="' + displayQty + '" aria-pressed="' + (selected ? "true" : "false") + '">' +
          '<span class="rw-radio" aria-hidden="true"></span>' +
          '<span class="rw-tier__copy' + (last && badge ? " rw-tier__copy--stack" : "") + '">' +
            "<span>" + esc(tierTitle(tier, index, tiers.length, displayQty)) + "</span>" +
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
      priceAmount: Number(meta.previewPrice) || 7.75,
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
  var heading = meta.title || meta.heading || "More balls > More discount";
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
    ? priceFor(atcQty, unitPrice, activeTier.percentage, activeTier.fixed, activeTier.setPrice, activeTier.min)
    : null;
  var atcSave = activeTier && atcPriced ? savePercent(activeTier, atcPriced) : 0;
  var soldOut = productSoldOut(product) || !!(selection && selection.soldOut) || !!(variant && variant.available === false);
  var atcLabel = soldOut
    ? esc(meta.soldOutLabel || "Sold out")
    : lastOpenSelected
      ? "Buy " + esc(atcQty) + (atcSave > 0 ? ' | save <span class="money">' + esc(atcSave) + "%</span>" : "")
      : esc(meta.atcLabel || "Add to cart");
  var showBuyNow = !soldOut && meta.showBuyNow === true;

  container.innerHTML =
    '<div class="rw-widget">' +
      (selector && product && tiers.length
        ? '<div class="rw-heading"><div class="rw-heading__title"><span>' + esc(heading) + '</span></div><div class="rw-heading__rule" aria-hidden="true"></div></div>' +
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
});
