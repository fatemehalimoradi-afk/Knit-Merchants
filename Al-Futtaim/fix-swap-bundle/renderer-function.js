window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx && ctx.snapshot;
  var container = ctx && ctx.container;
  if (!container) return;

  if (
    !snapshot ||
    !snapshot.selectors ||
    snapshot.selectors.length === 0
  ) {
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

  function formatMoney(amount, currencyCode) {
    if (typeof amount !== "number" || !isFinite(amount)) return "";
    var rounded = Math.round(amount * 100) / 100;
    var text =
      Math.round(rounded * 100) % 100 === 0
        ? String(Math.round(rounded))
        : rounded.toFixed(2);
    if (currencyCode === "AED") return text + " AED";
    if (currencyCode) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyCode,
        }).format(rounded);
      } catch (e) {}
      return text + " " + currencyCode;
    }
    return text;
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

  function productOf(selector) {
    if (!selector) return null;
    if (selector.kind === "productSingle") return selector.product || null;
    if (selector.kind === "collectionSingle") {
      return selector.resolvedProduct || null;
    }
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
        if (variants[i] && variants[i].id === selection.variantId) {
          return variants[i];
        }
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

  function pricingOf(member, currencyCode) {
    var selection = member && member.selection;
    var variant = variantOf(member && member.product, selection);
    var currency =
      (variant && variant.currencyCode) || currencyCode;
    var list =
      variant && typeof variant.priceAmount === "number" ? variant.priceAmount : 0;
    var qty = qtyOf(member);
    var base =
      selection && typeof selection.basePrice === "number" ? selection.basePrice : list;
    var finalPrice;
    if (selection && typeof selection.finalPrice === "number" && qty > 0) {
      finalPrice = selection.finalPrice;
    } else if (selection && typeof selection.finalPrice === "number") {
      finalPrice = selection.finalPrice;
    } else {
      finalPrice = list;
    }
    return { base: base, final: finalPrice, currency: currency };
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
        var groupIndex = groups.length;
        groups.push(fresh);
        for (var n = 0; n < fresh.length; n++) grouped[fresh[n]] = groupIndex;
      }
    }

    return { grouped: grouped, groups: groups };
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

  function memberKey(member) {
    return member.selectorId + "::" + member.productId;
  }

  function pickCurrent(members) {
    if (!members.length) return null;
    for (var i = 0; i < members.length; i++) {
      if (qtyOf(members[i]) > 0) return members[i];
    }
    return members[0];
  }

  function buildSlots() {
    var selectors = snapshot.selectors || [];
    var map = swapGroupMap();
    var used = {};
    var slots = [];

    function consume(ids) {
      for (var i = 0; i < ids.length; i++) used[ids[i]] = true;
    }

    for (var i = 0; i < selectors.length; i++) {
      var selector = selectors[i];
      if (!selector || used[selector.id]) continue;

      var groupIndex = map.grouped[selector.id];
      if (typeof groupIndex === "number") {
        var groupIds = map.groups[groupIndex] || [];
        var members = [];
        var seenMember = {};
        for (var g = 0; g < groupIds.length; g++) {
          var groupedSelector = selectorById(groupIds[g]);
          var fromGroup = membersFromSelector(groupedSelector);
          for (var m = 0; m < fromGroup.length; m++) {
            var key = memberKey(fromGroup[m]);
            if (!seenMember[key]) {
              seenMember[key] = true;
              members.push(fromGroup[m]);
            }
          }
        }
        if (members.length) {
          slots.push({ members: members });
          consume(groupIds);
        }
        continue;
      }

      var own = membersFromSelector(selector);
      if (own.length) {
        slots.push({ members: own });
        used[selector.id] = true;
      }
    }

    return slots;
  }

  function swapIcon() {
    return (
      '<svg class="nb-swap__icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M3.2 6.2A5.2 5.2 0 0 1 12.4 5.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M11.1 3.2v2.4h2.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M12.8 9.8A5.2 5.2 0 0 1 3.6 10.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M4.9 12.8V10.4H2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>"
    );
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

  function isFreeSlot(slotIndex, slotCount, member) {
    if (isEngineFree(member)) return true;
    return slotCount === 3 && slotIndex === 1;
  }

  function renderPrice(prices, extraClass, isFree) {
    var compare =
      isFree ||
      (typeof prices.base === "number" &&
        typeof prices.final === "number" &&
        prices.base > prices.final + 0.001)
        ? formatMoney(prices.base, prices.currency)
        : "";
    if (isFree) {
      return (
        '<div class="nb-price' +
        (extraClass ? " " + extraClass : "") +
        '">' +
        '<span class="nb-price__free">Free</span>' +
        (compare ? '<s class="nb-price__compare">' + esc(compare) + "</s>" : "") +
        "</div>"
      );
    }
    var finalText = formatMoney(prices.final, prices.currency);
    if (!finalText && !compare) return "";
    return (
      '<div class="nb-price' +
      (extraClass ? " " + extraClass : "") +
      '">' +
      (finalText
        ? '<span class="nb-price__final">' + esc(finalText) + "</span>"
        : "") +
      (compare
        ? '<s class="nb-price__compare">' + esc(compare) + "</s>"
        : "") +
      "</div>"
    );
  }

  function renderMedia(product, selection, extraClass) {
    var image = imageOf(product, selection);
    var cls = "nb-media" + (extraClass ? " " + extraClass : "");
    if (image && image.url) {
      return (
        '<div class="' +
        cls +
        '"><img class="nb-media__image" src="' +
        esc(image.url) +
        '" alt="' +
        esc(image.altText || product.title || "") +
        '"></div>'
      );
    }
    return (
      '<div class="' +
      cls +
      ' nb-media--placeholder" aria-hidden="true">' +
      esc(((product && product.title) || "P").charAt(0)) +
      "</div>"
    );
  }

  function productAttr(member) {
    return member && member.isMulti
      ? ' data-nameless-product-id="' + esc(member.productId) + '"'
      : "";
  }

  function renderVariantSelect(member) {
    var product = member && member.product;
    if (!product || !hasMeaningfulVariants(product)) return "";
    var variants = product.variants || [];
    var selection = member.selection;
    var currentId = selection && selection.variantId ? selection.variantId : "";
    if (!currentId) {
      var fallback = variantOf(product, selection);
      currentId = fallback && fallback.id ? fallback.id : "";
    }
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
    return (
      '<select class="nb-select" data-nameless-variant-selector="' +
      esc(member.selectorId) +
      '"' +
      productAttr(member) +
      ' aria-label="Variant">' +
      options +
      "</select>"
    );
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

  function planInputs(members, chosen) {
    var out = hiddenQty(chosen, 1);
    var extras = 0;
    for (var i = 0; i < members.length; i++) {
      if (memberKey(members[i]) === memberKey(chosen)) continue;
      if (qtyOf(members[i]) > 0 || extras === 0) {
        out += hiddenQty(members[i], 0);
        extras += 1;
      }
    }
    if (extras === 0 && members.length > 1) {
      for (var j = 0; j < members.length; j++) {
        if (memberKey(members[j]) !== memberKey(chosen)) {
          out += hiddenQty(members[j], 0);
          break;
        }
      }
    }
    return out;
  }

  function renderSlotCard(slot, slotIndex, slotCount, current, currencyCode) {
    var product = current.product;
    var soldOut = !!(current.selection && current.selection.soldOut);
    var isFree = isFreeSlot(slotIndex, slotCount, current);
    var canSwap = slot.members.length > 1;
    var swapId =
      "nb-swap-" +
      String(snapshot.bundleId || "bundle").replace(/[^a-zA-Z0-9_-]/g, "") +
      "-" +
      slotIndex;
    var prices = pricingOf(current, currencyCode);
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
    var freeLabel = isFree
      ? '<span class="nb-card__free">Free</span>'
      : "";

    return (
      '<article class="nb-slot' +
      (isFree ? " is-free" : "") +
      '" data-nb-slot="' +
      esc(String(slotIndex)) +
      '">' +
      swapToggle +
      '<div class="nb-card' +
      (soldOut ? " is-sold-out" : "") +
      (isFree ? " is-free" : "") +
      '">' +
      swapLabel +
      freeLabel +
      renderMedia(product, current.selection, "nb-card__media") +
      renderPrice(prices, "nb-card__price", isFree) +
      '<div class="nb-card__title">' +
      esc(product.title || "Product") +
      "</div>" +
      (soldOut ? '<div class="nb-card__badge">Sold out</div>' : "") +
      renderVariantSelect(current) +
      "</div></article>"
    );
  }

  function renderAlternative(slot, member, currencyCode, isFree) {
    var product = member.product;
    var soldOut = !!(member.selection && member.selection.soldOut);
    var prices = pricingOf(member, currencyCode);
    return (
      '<button class="nb-alt' +
      (soldOut ? " is-sold-out" : "") +
      (isFree ? " is-free" : "") +
      '" type="button" aria-label="Replace with ' +
      esc(product.title || "product") +
      '"' +
      (soldOut ? " disabled" : "") +
      ">" +
      '<span class="nb-alt__check" aria-hidden="true"></span>' +
      (isFree ? '<span class="nb-card__free">Free</span>' : "") +
      renderMedia(product, member.selection, "nb-alt__media") +
      renderPrice(prices, "nb-alt__price", isFree) +
      '<span class="nb-alt__title">' +
      esc(product.title || "Product") +
      "</span>" +
      planInputs(slot.members, member) +
      "</button>"
    );
  }

  function renderReplace(slot, slotIndex, slotCount, current, currencyCode) {
    if (slot.members.length < 2) return "";
    var isFree = isFreeSlot(slotIndex, slotCount, current);
    var alts = "";
    for (var i = 0; i < slot.members.length; i++) {
      if (memberKey(slot.members[i]) === memberKey(current)) continue;
      alts += renderAlternative(slot, slot.members[i], currencyCode, isFree);
    }
    if (!alts) return "";
    return (
      '<section class="nb-replace" data-nb-slot="' +
      esc(String(slotIndex)) +
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

  function renderFooter(currencyCode) {
    var totals = snapshot.totals || {};
    var count = itemCount();
    var countLabel = count === 1 ? "1 item" : count + " items";
    var subtotal = formatMoney(totals.subtotal, currencyCode);
    var showCompare =
      typeof totals.baseSubtotal === "number" &&
      typeof totals.subtotal === "number" &&
      totals.baseSubtotal > totals.subtotal;
    var compare = showCompare
      ? formatMoney(totals.baseSubtotal, currencyCode)
      : "";
    var disabled = snapshot.status !== "ready" || hasSoldOutSelection();
    var atc = "";
    if (!snapshot.meta || !snapshot.meta.atcOverride) {
      atc =
        '<button class="nb-atc" type="button" data-nameless-atc="' +
        esc(snapshot.bundleId) +
        '"' +
        (disabled ? ' disabled aria-disabled="true"' : "") +
        ">Add " +
        esc(String(count)) +
        " items to bag</button>";
    }

    return (
      '<footer class="nb-footer">' +
      '<div class="nb-footer__meta">' +
      '<span class="nb-footer__count">' +
      esc(countLabel) +
      "</span>" +
      '<span class="nb-footer__totals">' +
      (compare
        ? '<s class="nb-footer__compare">' + esc(compare) + "</s>"
        : "") +
      (subtotal
        ? '<span class="nb-footer__total">' + esc(subtotal) + "</span>"
        : "") +
      "</span></div>" +
      atc +
      "</footer>"
    );
  }

  function changeOf(member, quantity) {
    var change = {
      selectorId: member.selectorId,
      quantity: quantity,
    };
    if (member.isMulti) change.productId = member.productId;
    return change;
  }

  function ensureSlotDefaults(slots) {
    if (!slots.length || container.__nbSwapDefaulted) return;
    if (!window.nameless || typeof window.nameless.dispatch !== "function") {
      return;
    }
    var changes = [];
    var seen = {};
    for (var i = 0; i < slots.length; i++) {
      var members = slots[i].members || [];
      var chosen = pickCurrent(members);
      if (!chosen || qtyOf(chosen) >= 1) continue;
      var key = memberKey(chosen);
      if (seen[key]) continue;
      seen[key] = true;
      changes.push(changeOf(chosen, 1));
      for (var m = 0; m < members.length; m++) {
        var extra = members[m];
        var extraKey = memberKey(extra);
        if (seen[extraKey] || qtyOf(extra) <= 0) continue;
        seen[extraKey] = true;
        changes.push(changeOf(extra, 0));
      }
    }
    if (!changes.length) return;
    container.__nbSwapDefaulted = true;
    if (changes.length === 1 && !changes[0].productId) {
      window.nameless.dispatch("quantityChange", {
        bundleId: snapshot.bundleId,
        selectorId: changes[0].selectorId,
        quantity: changes[0].quantity,
      });
      return;
    }
    window.nameless.dispatch("selectionPlanChange", {
      bundleId: snapshot.bundleId,
      changes: changes,
    });
  }

  var currencyCode = getCurrencyCode();
  var slots = buildSlots();
  ensureSlotDefaults(slots);
  var slotHtml = "";
  var replaceHtml = "";

  for (var s = 0; s < slots.length; s++) {
    var current = pickCurrent(slots[s].members);
    if (!current) continue;
    slotHtml += renderSlotCard(slots[s], s, slots.length, current, currencyCode);
    replaceHtml += renderReplace(
      slots[s],
      s,
      slots.length,
      current,
      currencyCode
    );
  }

  var title =
    snapshot.meta && snapshot.meta.title ? snapshot.meta.title : "";

  container.innerHTML =
    '<div class="nb-widget nb-widget--swap">' +
    (title ? '<h2 class="nb-kicker">' + esc(title) + "</h2>" : "") +
    '<div class="nb-slots">' +
    slotHtml +
    "</div>" +
    replaceHtml +
    renderFooter(currencyCode) +
    "</div>";
});
