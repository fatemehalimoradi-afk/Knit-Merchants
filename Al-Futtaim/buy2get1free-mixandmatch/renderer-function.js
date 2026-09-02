window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx && ctx.snapshot;
  var container = ctx && ctx.container;
  if (!container) return;

  if (!snapshot || !snapshot.selectors || snapshot.selectors.length === 0) {
    container.innerHTML = "";
    return;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMoney(amount, currencyCode, decimals) {
    if (typeof amount !== "number" || !isFinite(amount)) return "";
    var rounded = Math.round(amount * 100) / 100;
    var digits =
      decimals != null
        ? decimals
        : Math.round(rounded * 100) % 100 === 0
          ? 0
          : 2;
    var text = rounded.toFixed(digits);
    if (digits === 0) text = String(Math.round(rounded));
    if (currencyCode === "AED") return "AED " + text;
    if (currencyCode) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyCode,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(rounded);
      } catch (e) {}
      return currencyCode + " " + text;
    }
    return text;
  }

  function productOf(selector) {
    if (!selector) return null;
    if (selector.kind === "productSingle") return selector.product || null;
    if (selector.kind === "collectionSingle") return selector.resolvedProduct || null;
    return null;
  }

  function selectionOf(selectorId) {
    var entry = snapshot.selections && snapshot.selections[selectorId];
    if (!entry || Array.isArray(entry)) return null;
    return entry;
  }

  function multiSelection(selectorId, productId) {
    var entries = snapshot.selections && snapshot.selections[selectorId];
    if (!Array.isArray(entries)) return null;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i] && entries[i].productId === productId) return entries[i];
    }
    return null;
  }

  function qtyOf(member) {
    if (!member || !member.selection) return 0;
    return typeof member.selection.quantity === "number"
      ? member.selection.quantity
      : 0;
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
    return variants[0] || null;
  }

  function hasMeaningfulVariants(product) {
    var variants = product && product.variants ? product.variants : [];
    if (variants.length <= 1) return false;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i] && variants[i].title && variants[i].title !== "Default Title") {
        return true;
      }
    }
    return false;
  }

  function imageOf(product, selection) {
    var variant = variantOf(product, selection);
    if (variant && variant.image && variant.image.url) return variant.image;
    if (product && product.featuredImage && product.featuredImage.url) {
      return product.featuredImage;
    }
    if (product && product.image && product.image.url) return product.image;
    return null;
  }

  function getCurrencyCode() {
    if (snapshot.totals && snapshot.totals.currencyCode) {
      return snapshot.totals.currencyCode;
    }
    var selectors = snapshot.selectors || [];
    for (var i = 0; i < selectors.length; i++) {
      var product = productOf(selectors[i]);
      var variants = product && product.variants;
      if (variants && variants.length && variants[0].currencyCode) {
        return variants[0].currencyCode;
      }
      var products =
        selectors[i].kind === "collectionMulti" &&
        selectors[i].collection &&
        selectors[i].collection.products
          ? selectors[i].collection.products
          : [];
      if (products.length && products[0].variants && products[0].variants[0]) {
        return products[0].variants[0].currencyCode || null;
      }
    }
    return null;
  }

  function pricingOf(member, currencyCode) {
    var selection = member && member.selection;
    var variant = variantOf(member && member.product, selection);
    var currency = (variant && variant.currencyCode) || currencyCode;
    var list =
      variant && typeof variant.priceAmount === "number" ? variant.priceAmount : 0;
    var base =
      selection && typeof selection.basePrice === "number" ? selection.basePrice : list;
    var finalPrice =
      selection && typeof selection.finalPrice === "number"
        ? selection.finalPrice
        : list;
    return { base: base, final: finalPrice, currency: currency };
  }

  function isEngineFree(member) {
    if (!member || qtyOf(member) <= 0) return false;
    var selection = member.selection;
    if (
      selection &&
      typeof selection.cumulativePercentageDiscount === "number" &&
      selection.cumulativePercentageDiscount >= 99.999
    ) {
      return true;
    }
    var prices = pricingOf(member, null);
    return prices.final <= 0.001 && prices.base > 0.001;
  }

  function resolveFreeKey(cards) {
    var cheapest = null;
    var cheapestUnit = Infinity;
    var units = 0;
    for (var i = 0; i < cards.length; i++) {
      var member = cards[i] && cards[i].current;
      if (!member) continue;
      if (isEngineFree(member)) return memberKey(member);
      var qty = qtyOf(member);
      if (qty <= 0) continue;
      units += qty;
      var prices = pricingOf(member, null);
      var unit = prices.base / qty;
      if (unit < cheapestUnit) {
        cheapestUnit = unit;
        cheapest = member;
      }
    }
    if (units >= 3 && cheapest) return memberKey(cheapest);
    return "";
  }

  function isFreeLine(member, freeKey) {
    if (isEngineFree(member)) return true;
    return !!(freeKey && member && memberKey(member) === freeKey && qtyOf(member) > 0);
  }

  function selectorById(id) {
    var selectors = snapshot.selectors || [];
    for (var i = 0; i < selectors.length; i++) {
      if (selectors[i] && selectors[i].id === id) return selectors[i];
    }
    return null;
  }

  function uniqueIds(list) {
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && !seen[list[i]]) {
        seen[list[i]] = true;
        out.push(list[i]);
      }
    }
    return out;
  }

  function memberKey(member) {
    return member.selectorId + "::" + member.productId;
  }

  function productAttr(member) {
    return member && member.isMulti
      ? ' data-nameless-product-id="' + esc(member.productId) + '"'
      : "";
  }

  function memberFromSingle(selector) {
    var product = productOf(selector);
    if (!selector || !product) return null;
    return {
      selectorId: selector.id,
      product: product,
      productId: product.id,
      selection: selectionOf(selector.id),
      isMulti: false,
    };
  }

  function memberFromMulti(selector, product) {
    if (!selector || !product) return null;
    return {
      selectorId: selector.id,
      product: product,
      productId: product.id,
      selection: multiSelection(selector.id, product.id),
      isMulti: true,
    };
  }

  function membersFromSelector(selector) {
    if (!selector) return [];
    if (selector.kind === "collectionMulti") {
      var products =
        selector.collection && Array.isArray(selector.collection.products)
          ? selector.collection.products
          : [];
      var list = [];
      for (var i = 0; i < products.length; i++) {
        var member = memberFromMulti(selector, products[i]);
        if (member) list.push(member);
      }
      return list;
    }
    var single = memberFromSingle(selector);
    return single ? [single] : [];
  }

  function swapGroupMap() {
    var grouped = {};
    var groups = [];
    var conditionSets = snapshot.conditionSets || [];

    for (var i = 0; i < conditionSets.length; i++) {
      var conditions = (conditionSets[i] && conditionSets[i].conditions) || [];
      for (var j = 0; j < conditions.length; j++) {
        var condition = conditions[j];
        if (!condition || condition.type !== "quantity") continue;
        if (condition.maximum !== 1) continue;
        var refs = condition.satisfiesFor || [];
        var ids = [];
        for (var k = 0; k < refs.length; k++) {
          if (refs[k] && refs[k].selectorId) ids.push(refs[k].selectorId);
        }
        ids = uniqueIds(ids);
        if (ids.length < 2) continue;
        var fresh = [];
        for (var m = 0; m < ids.length; m++) {
          if (!grouped[ids[m]]) fresh.push(ids[m]);
        }
        if (fresh.length < 2) continue;
        groups.push(fresh);
        for (var n = 0; n < fresh.length; n++) grouped[fresh[n]] = groups.length - 1;
      }
    }

    return { grouped: grouped, groups: groups };
  }

  function pickCurrent(members) {
    if (!members.length) return null;
    for (var i = 0; i < members.length; i++) {
      if (qtyOf(members[i]) > 0) return members[i];
    }
    return members[0];
  }

  function slotIsSharedCollection(members) {
    if (!members.length) return false;
    var first = members[0].selectorId;
    for (var i = 0; i < members.length; i++) {
      if (!members[i].isMulti || members[i].selectorId !== first) return false;
    }
    return members.length > 1;
  }

  function buildCards() {
    var selectors = snapshot.selectors || [];
    var map = swapGroupMap();
    var used = {};
    var slots = [];

    for (var i = 0; i < selectors.length; i++) {
      var selector = selectors[i];
      if (!selector || used[selector.id]) continue;

      var groupIndex = map.grouped[selector.id];
      if (typeof groupIndex === "number") {
        var groupIds = map.groups[groupIndex] || [];
        var members = [];
        var seenMember = {};
        for (var g = 0; g < groupIds.length; g++) {
          var fromGroup = membersFromSelector(selectorById(groupIds[g]));
          for (var m = 0; m < fromGroup.length; m++) {
            var key = memberKey(fromGroup[m]);
            if (!seenMember[key]) {
              seenMember[key] = true;
              members.push(fromGroup[m]);
            }
          }
          used[groupIds[g]] = true;
        }
        if (members.length) {
          slots.push({ members: members, exclusive: true });
        }
        continue;
      }

      var own = membersFromSelector(selector);
      if (own.length) {
        slots.push({
          members: own,
          exclusive: !slotIsSharedCollection(own),
        });
        used[selector.id] = true;
      }
    }

    var cards = [];
    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      if (slotIsSharedCollection(slot.members)) {
        var selected = [];
        var unused = [];
        for (var p = 0; p < slot.members.length; p++) {
          if (qtyOf(slot.members[p]) > 0) selected.push(slot.members[p]);
          else unused.push(slot.members[p]);
        }
        var pool = selected.concat(unused);
        var limit = Math.min(3, pool.length);
        for (var c = 0; c < limit; c++) {
          var current = pool[c];
          if (!current) continue;
          cards.push({
            members: slot.members,
            current: current,
            exclusive: false,
          });
        }
      } else {
        var currentMember = pickCurrent(slot.members);
        if (!currentMember) continue;
        cards.push({
          members: slot.members,
          current: currentMember,
          exclusive: slot.exclusive,
        });
      }
    }

    return capCards(cards);
  }

  function capCards(cards) {
    if (cards.length <= 3) return cards;

    var extras = [];
    var seen = {};
    function takeMembers(list) {
      for (var i = 0; i < list.length; i++) {
        var key = memberKey(list[i]);
        if (seen[key]) continue;
        seen[key] = true;
        extras.push(list[i]);
      }
    }

    var kept = cards.slice(0, 3);
    for (var k = 0; k < kept.length; k++) takeMembers(kept[k].members);
    for (var e = 3; e < cards.length; e++) takeMembers(cards[e].members);

    for (var c = 0; c < kept.length; c++) {
      kept[c].members = extras;
      kept[c].exclusive = false;
    }
    return kept;
  }

  function maxQtyFor(selectorId) {
    var max = null;
    var conditionSets = snapshot.conditionSets || [];
    for (var i = 0; i < conditionSets.length; i++) {
      var conditions = (conditionSets[i] && conditionSets[i].conditions) || [];
      for (var j = 0; j < conditions.length; j++) {
        var condition = conditions[j];
        if (!condition || condition.type !== "quantity") continue;
        if (typeof condition.maximum !== "number") continue;
        var refs = condition.satisfiesFor || [];
        var matches = false;
        for (var k = 0; k < refs.length; k++) {
          if (refs[k] && refs[k].selectorId === selectorId) matches = true;
        }
        if (!matches) continue;
        max = max == null ? condition.maximum : Math.min(max, condition.maximum);
      }
    }
    return max;
  }

  function swatchOf(variant) {
    var title = String((variant && variant.title) || "").toLowerCase();
    var colors = [
      ["black", "#1a1a1a"],
      ["white", "#f4f4f4"],
      ["navy", "#17345c"],
      ["blue", "#1d4e89"],
      ["rouge", "#c4161c"],
      ["red", "#c4161c"],
      ["burgundy", "#6e1d2a"],
      ["wine", "#6e1d2a"],
      ["pink", "#e31c79"],
      ["rose", "#d4789c"],
      ["coral", "#e36b5c"],
      ["orange", "#e36b1a"],
      ["gold", "#c6a15b"],
      ["lead", "#6b4a2e"],
      ["brown", "#8a5a32"],
      ["nude", "#d4b08c"],
      ["beige", "#d8c3a5"],
      ["green", "#2f7d4a"],
      ["purple", "#6b3fa0"],
      ["violet", "#6b3fa0"],
      ["silver", "#c0c0c0"],
      ["grey", "#8a8a8a"],
      ["gray", "#8a8a8a"],
    ];
    for (var i = 0; i < colors.length; i++) {
      if (title.indexOf(colors[i][0]) !== -1) {
        return { type: "color", value: colors[i][1] };
      }
    }
    var hash = 0;
    for (var j = 0; j < title.length; j++) {
      hash = title.charCodeAt(j) + ((hash << 5) - hash);
    }
    return {
      type: "color",
      value: "hsl(" + (Math.abs(hash) % 360) + " 32% 48%)",
    };
  }

  function hiddenQty(member, quantity) {
    return (
      '<input type="hidden" data-nameless-qty-selector="' +
      esc(member.selectorId) +
      '"' +
      productAttr(member) +
      ' value="' +
      esc(String(quantity)) +
      '">'
    );
  }

  function planInputs(card, chosen) {
    var currentQty = qtyOf(card.current);
    var nextQty = currentQty > 0 ? currentQty : 1;
    var out = hiddenQty(chosen, nextQty);
    if (memberKey(chosen) !== memberKey(card.current)) {
      out += hiddenQty(card.current, 0);
    }
    if (!card.exclusive) return out;

    var extras = memberKey(chosen) === memberKey(card.current) ? 0 : 1;
    for (var i = 0; i < card.members.length; i++) {
      if (memberKey(card.members[i]) === memberKey(chosen)) continue;
      if (memberKey(card.members[i]) === memberKey(card.current)) continue;
      if (qtyOf(card.members[i]) > 0 || extras === 0) {
        out += hiddenQty(card.members[i], 0);
        extras += 1;
      }
    }
    return out;
  }

  function swapIcon() {
    return (
      '<svg class="nb-swap__icon" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M3.2 6.2A5.2 5.2 0 0 1 12.4 5.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M11.1 3.2v2.4h2.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M12.8 9.8A5.2 5.2 0 0 1 3.6 10.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M4.9 12.8V10.4H2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>"
    );
  }

  function renderMedia(product, selection) {
    var image = imageOf(product, selection);
    if (image && image.url) {
      return (
        '<img class="nb-media__image" src="' +
        esc(image.url) +
        '" alt="' +
        esc(image.altText || product.title || "") +
        '">'
      );
    }
    return (
      '<span class="nb-media__placeholder" aria-hidden="true">' +
      esc(((product && product.title) || "P").charAt(0)) +
      "</span>"
    );
  }

  function renderPrice(member, currencyCode, freeKey) {
    var prices = pricingOf(member, currencyCode);
    var free = isFreeLine(member, freeKey);
    var compare =
      free || prices.base > prices.final + 0.001
        ? formatMoney(prices.base, prices.currency)
        : "";
    if (free) {
      return (
        '<div class="nb-price">' +
        '<span class="nb-price__free">Free</span>' +
        (compare ? '<s class="nb-price__compare">' + esc(compare) + "</s>" : "") +
        "</div>"
      );
    }
    var finalText = formatMoney(prices.final, prices.currency);
    if (!finalText && !compare) return "";
    return (
      '<div class="nb-price">' +
      (finalText
        ? '<span class="nb-price__final">' + esc(finalText) + "</span>"
        : "") +
      (compare ? '<s class="nb-price__compare">' + esc(compare) + "</s>" : "") +
      "</div>"
    );
  }

  function renderVariantSelect(member) {
    var product = member && member.product;
    if (!product || !hasMeaningfulVariants(product)) return "";
    var variants = product.variants || [];
    var selection = member.selection;
    var current = variantOf(product, selection);
    var currentId = current && current.id ? current.id : "";
    var options = "";
    for (var i = 0; i < variants.length; i++) {
      var variant = variants[i];
      if (!variant || !variant.id) continue;
      var selected = variant.id === currentId ? " selected" : "";
      var disabled = variant.available ? "" : " disabled";
      var label = variant.title || "Option";
      if (!variant.available) label += " — Sold out";
      options +=
        '<option value="' +
        esc(variant.id) +
        '"' +
        selected +
        disabled +
        ">" +
        esc(label) +
        "</option>";
    }
    if (!options) return "";
    var swatch = swatchOf(current);
    return (
      '<label class="nb-color">' +
      '<span class="nb-color__label">Color</span>' +
      '<span class="nb-color__field">' +
      '<span class="nb-color__swatch" style="background:' +
      esc(swatch.value) +
      '"></span>' +
      '<select class="nb-color__select" data-nameless-variant-selector="' +
      esc(member.selectorId) +
      '"' +
      productAttr(member) +
      ' aria-label="Color">' +
      options +
      "</select>" +
      '<span class="nb-color__caret" aria-hidden="true"></span>' +
      "</span></label>"
    );
  }

  function renderStepper(member) {
    var qty = qtyOf(member);
    var max = maxQtyFor(member.selectorId);
    var minusDisabled = qty <= 1 || !!(member.selection && member.selection.soldOut);
    var plusDisabled =
      !!(member.selection && member.selection.soldOut) ||
      (typeof max === "number" && qty >= max);
    var attrs = productAttr(member);
    return (
      '<div class="nb-stepper" role="group" aria-label="Quantity">' +
      '<button class="nb-stepper__btn" type="button" data-nameless-qty-selector="' +
      esc(member.selectorId) +
      '"' +
      attrs +
      ' value="' +
      esc(String(Math.max(0, qty - 1))) +
      '" aria-label="Decrease quantity"' +
      (minusDisabled ? " disabled" : "") +
      ">−</button>" +
      '<span class="nb-stepper__value">' +
      esc(String(qty)) +
      "</span>" +
      '<button class="nb-stepper__btn" type="button" data-nameless-qty-selector="' +
      esc(member.selectorId) +
      '"' +
      attrs +
      ' value="' +
      esc(String(qty + 1)) +
      '" aria-label="Increase quantity"' +
      (plusDisabled ? " disabled" : "") +
      ">+</button></div>"
    );
  }

  function renderCard(card, cardIndex, currencyCode, freeKey) {
    var current = card.current;
    var product = current.product;
    var soldOut = !!(current.selection && current.selection.soldOut);
    var canSwap = cardIndex > 0 && card.members.length > 1;
    var swapId =
      "nb-b2g1-swap-" +
      String(snapshot.bundleId || "bundle").replace(/[^a-zA-Z0-9_-]/g, "") +
      "-" +
      cardIndex;
    var swapToggle = canSwap
      ? '<input class="nb-swap-toggle" type="checkbox" id="' +
        esc(swapId) +
        '">'
      : "";
    var swapLabel = canSwap
      ? '<label class="nb-swap" for="' +
        esc(swapId) +
        '" aria-label="Select alternatives">' +
        swapIcon() +
        "</label>"
      : "";

    return (
      '<article class="nb-card-wrap" data-nb-slot="' +
      esc(String(cardIndex)) +
      '">' +
      swapToggle +
      '<div class="nb-card' +
      (soldOut ? " is-sold-out" : "") +
      (isFreeLine(current, freeKey) ? " is-free" : "") +
      '">' +
      '<div class="nb-card__media">' +
      swapLabel +
      renderMedia(product, current.selection) +
      "</div>" +
      '<div class="nb-card__body">' +
      renderPrice(current, currencyCode, freeKey) +
      '<div class="nb-card__title">' +
      esc(product.title || "Product") +
      "</div>" +
      (soldOut ? '<div class="nb-card__badge">Sold out</div>' : "") +
      '<div class="nb-card__controls">' +
      renderVariantSelect(current) +
      renderStepper(current) +
      "</div></div></div></article>"
    );
  }

  function renderAlternative(card, member, currencyCode) {
    var product = member.product;
    var soldOut = !!(member.selection && member.selection.soldOut);
    var prices = pricingOf(member, currencyCode);
    var priceText = formatMoney(prices.final || prices.base, prices.currency);
    return (
      '<button class="nb-alt' +
      (soldOut ? " is-sold-out" : "") +
      '" type="button" aria-label="Replace with ' +
      esc(product.title || "product") +
      '"' +
      (soldOut ? " disabled" : "") +
      ">" +
      '<span class="nb-alt__check" aria-hidden="true"></span>' +
      '<span class="nb-alt__media">' +
      renderMedia(product, member.selection) +
      "</span>" +
      (priceText
        ? '<span class="nb-alt__price">' + esc(priceText) + "</span>"
        : "") +
      '<span class="nb-alt__title">' +
      esc(product.title || "Product") +
      "</span>" +
      planInputs(card, member) +
      "</button>"
    );
  }

  function renderReplace(card, cardIndex, currencyCode) {
    if (card.members.length < 2) return "";
    var shown = {};
    shown[memberKey(card.current)] = true;
    var alts = "";
    for (var i = 0; i < card.members.length; i++) {
      var member = card.members[i];
      if (shown[memberKey(member)]) continue;
      shown[memberKey(member)] = true;
      alts += renderAlternative(card, member, currencyCode);
    }
    if (!alts) return "";
    return (
      '<section class="nb-replace" data-nb-slot="' +
      esc(String(cardIndex)) +
      '">' +
      '<h3 class="nb-replace__title">Replace with</h3>' +
      '<div class="nb-replace__list">' +
      alts +
      "</div></section>"
    );
  }

  function itemCount() {
    if (snapshot.totals && typeof snapshot.totals.itemCount === "number") {
      return snapshot.totals.itemCount;
    }
    var total = 0;
    var selectors = snapshot.selectors || [];
    for (var i = 0; i < selectors.length; i++) {
      var entry = snapshot.selections && snapshot.selections[selectors[i].id];
      if (!entry) continue;
      if (Array.isArray(entry)) {
        for (var j = 0; j < entry.length; j++) {
          if (entry[j] && typeof entry[j].quantity === "number") {
            total += entry[j].quantity;
          }
        }
      } else if (typeof entry.quantity === "number") {
        total += entry.quantity;
      }
    }
    return total;
  }

  function countFreeUnits(cards, freeKey) {
    if (freeKey && itemCount() >= 3) return 1;
    var units = 0;
    for (var i = 0; i < cards.length; i++) {
      if (isEngineFree(cards[i].current)) units += 1;
    }
    return units;
  }

  function paidCount(count, cards, freeKey) {
    var free = countFreeUnits(cards, freeKey);
    if (free > 0) return Math.max(0, count - free);
    return count;
  }

  function displayTotals(cards, freeKey, currencyCode) {
    var totals = snapshot.totals || {};
    var engineDiscount =
      typeof totals.baseSubtotal === "number" &&
      typeof totals.subtotal === "number" &&
      totals.baseSubtotal > totals.subtotal + 0.001;
    if (engineDiscount) {
      return {
        subtotal: totals.subtotal,
        compare: totals.baseSubtotal,
        currency: currencyCode,
      };
    }
    if (freeKey && itemCount() >= 3) {
      var base = 0;
      var paid = 0;
      for (var i = 0; i < cards.length; i++) {
        var member = cards[i].current;
        var prices = pricingOf(member, currencyCode);
        base += prices.base;
        if (!isFreeLine(member, freeKey)) paid += prices.base;
      }
      return { subtotal: paid, compare: base, currency: currencyCode };
    }
    return {
      subtotal: totals.subtotal,
      compare: null,
      currency: currencyCode,
    };
  }

  function hasSoldOutSelection() {
    var selectors = snapshot.selectors || [];
    for (var i = 0; i < selectors.length; i++) {
      var entry = snapshot.selections && snapshot.selections[selectors[i].id];
      if (!entry) continue;
      if (Array.isArray(entry)) {
        for (var j = 0; j < entry.length; j++) {
          if (entry[j] && entry[j].quantity > 0 && entry[j].soldOut) return true;
        }
      } else if (entry.quantity > 0 && entry.soldOut) {
        return true;
      }
    }
    return false;
  }

  function renderAside(cards, currencyCode, freeKey) {
    var shown = displayTotals(cards, freeKey, currencyCode);
    var count = itemCount();
    var paid = paidCount(count, cards, freeKey);
    var countLabel = count === 1 ? "1 item" : count + " items";
    var subtotal = formatMoney(shown.subtotal, shown.currency, 2);
    var compare =
      shown.compare != null && shown.compare > shown.subtotal + 0.001
        ? formatMoney(shown.compare, shown.currency, 2)
        : "";
    var disabled =
      snapshot.status !== "ready" || hasSoldOutSelection() || count < 3;
    var atc = "";
    if (!snapshot.meta || !snapshot.meta.atcOverride) {
      atc =
        '<button class="nb-atc" type="button" data-nameless-atc="' +
        esc(snapshot.bundleId) +
        '"' +
        (disabled ? ' disabled aria-disabled="true"' : "") +
        ">Add " +
        esc(String(paid)) +
        (paid === 1 ? " item" : " items") +
        " to bag</button>";
    }

    return (
      '<aside class="nb-aside">' +
      '<div class="nb-aside__count">' +
      esc(countLabel) +
      "</div>" +
      '<div class="nb-aside__totals">' +
      (subtotal
        ? '<span class="nb-aside__total">' + esc(subtotal) + "</span>"
        : "") +
      (compare
        ? '<s class="nb-aside__compare">' + esc(compare) + "</s>"
        : "") +
      "</div>" +
      atc +
      "</aside>"
    );
  }

  function ensureThreeItemMix(cards) {
    if (!cards.length || container.__nbB2g1Defaulted) return;
    var changes = [];
    var seen = {};
    for (var i = 0; i < cards.length && i < 3; i++) {
      var member = cards[i] && cards[i].current;
      if (!member || qtyOf(member) >= 1) continue;
      var key = memberKey(member);
      if (seen[key]) continue;
      seen[key] = true;
      changes.push({
        selectorId: member.selectorId,
        quantity: 1,
        productId: member.isMulti ? member.productId : undefined,
      });
    }
    if (!changes.length) return;
    if (!window.nameless || typeof window.nameless.dispatch !== "function") {
      return;
    }
    container.__nbB2g1Defaulted = true;
    if (changes.length >= 2) {
      window.nameless.dispatch("selectionPlanChange", {
        bundleId: snapshot.bundleId,
        changes: changes,
      });
      return;
    }
    var first = changes[0];
    var payload = {
      bundleId: snapshot.bundleId,
      selectorId: first.selectorId,
      quantity: 1,
    };
    if (first.productId) payload.productId = first.productId;
    window.nameless.dispatch("quantityChange", payload);
  }

  var currencyCode = getCurrencyCode();
  var cards = buildCards();
  ensureThreeItemMix(cards);
  var freeKey = resolveFreeKey(cards);
  var cardsHtml = "";
  var replaceHtml = "";

  for (var i = 0; i < cards.length; i++) {
    if (i > 0) {
      cardsHtml += '<span class="nb-plus" aria-hidden="true">+</span>';
    }
    cardsHtml += renderCard(cards[i], i, currencyCode, freeKey);
    replaceHtml += renderReplace(cards[i], i, currencyCode);
  }

  var rawTitle =
    snapshot.meta && (snapshot.meta.title || snapshot.meta.subtitle);
  var title =
    rawTitle && /\s/.test(rawTitle) && rawTitle.toLowerCase().indexOf("buy2get1") === -1
      ? rawTitle
      : "Buy 2 Get 1 Free - Mix & Match";

  container.innerHTML =
    '<div class="nb-widget nb-widget--b2g1">' +
    '<div class="nb-badge">' +
    esc(title) +
    "</div>" +
    '<div class="nb-shell">' +
    '<div class="nb-main">' +
    '<div class="nb-cards">' +
    cardsHtml +
    "</div>" +
    replaceHtml +
    "</div>" +
    renderAside(cards, currencyCode, freeKey) +
    "</div></div>";
});
