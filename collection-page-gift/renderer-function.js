window.nameless.defineRenderer(function (ctx) {
  var snapshot = ctx.snapshot || {};
  var container = ctx.container;
  var selectors = snapshot.selectors || [];
  var selections = snapshot.selections || {};
  var totals = snapshot.totals || {};
  var meta = snapshot.meta || {};
  var conditionSets = snapshot.conditionSets || [];

  if (!container) return;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(amount, currency) {
    var value = Number(amount);
    if (!isFinite(value)) value = 0;
    try {
      return new Intl.NumberFormat(ctx.locale || undefined, {
        style: "currency",
        currency: currency || totals.currencyCode || "USD",
        maximumFractionDigits: 2
      }).format(value);
    } catch (err) {
      return (currency || "") + " " + value.toFixed(2);
    }
  }

  function isHost(sel) {
    return sel && (sel.kind === "productSingle" || sel.kind === "collectionSingle");
  }

  function isGift(sel) {
    return sel && sel.kind === "collectionMulti";
  }

  function hostProduct(sel) {
    if (!sel) return null;
    if (sel.kind === "productSingle") return sel.product || null;
    if (sel.kind === "collectionSingle") return sel.resolvedProduct || null;
    return null;
  }

  function singleEntry(sel) {
    if (!sel) return null;
    var entry = selections[sel.id];
    return entry && !Array.isArray(entry) ? entry : null;
  }

  function multiEntries(sel) {
    var entries = sel ? selections[sel.id] : null;
    return Array.isArray(entries) ? entries : [];
  }

  function findMultiEntry(sel, productId) {
    var entries = multiEntries(sel);
    var i;
    for (i = 0; i < entries.length; i++) {
      if (entries[i] && entries[i].productId === productId) return entries[i];
    }
    return null;
  }

  function qtyOf(sel) {
    if (!sel) return 0;
    if (isGift(sel)) {
      return multiEntries(sel).reduce(function (sum, entry) {
        return sum + Number(entry && entry.quantity ? entry.quantity : 0);
      }, 0);
    }
    var entry = singleEntry(sel);
    return entry ? Number(entry.quantity || 0) : 0;
  }

  function rewardPercent(selectorId) {
    var percent = 0;
    var i;
    var j;
    var rewards;
    var reward;
    for (i = 0; i < conditionSets.length; i++) {
      rewards = conditionSets[i] && conditionSets[i].rewardSet && conditionSets[i].rewardSet.rewards;
      if (!rewards) continue;
      for (j = 0; j < rewards.length; j++) {
        reward = rewards[j];
        if (!reward || reward.type !== "percentageDiscount") continue;
        if (
          (reward.appliesTo || []).some(function (target) {
            return target && target.selectorId === selectorId;
          })
        ) {
          percent = Math.max(percent, Number(reward.percentage) || 0);
        }
      }
    }
    return percent;
  }

  function activeVariant(product, entry) {
    var variants = (product && product.variants) || [];
    var i;
    if (!variants.length) return null;
    if (entry && entry.variantId) {
      for (i = 0; i < variants.length; i++) {
        if (variants[i].id === entry.variantId) return variants[i];
      }
    }
    for (i = 0; i < variants.length; i++) {
      if (variants[i].available) return variants[i];
    }
    return variants[0];
  }

  function variantImage(product, variant) {
    if (variant && variant.image && variant.image.url) return variant.image;
    var variants = (product && product.variants) || [];
    var i;
    for (i = 0; i < variants.length; i++) {
      if (variants[i].image && variants[i].image.url) return variants[i].image;
    }
    return null;
  }

  function hasRealVariants(product) {
    var variants = (product && product.variants) || [];
    var i;
    if (variants.length <= 1) return false;
    for (i = 0; i < variants.length; i++) {
      if (variants[i].title && variants[i].title !== "Default Title") return true;
    }
    return false;
  }

  function variantSelect(sel, product, entry, withProductId) {
    if (!hasRealVariants(product)) return "";
    var variants = product.variants || [];
    var current = entry && entry.variantId ? entry.variantId : variants[0] && variants[0].id;
    var options = variants
      .map(function (variant) {
        return (
          '<option value="' +
          esc(variant.id) +
          '"' +
          (variant.id === current ? " selected" : "") +
          (variant.available ? "" : " disabled") +
          ">" +
          esc(variant.title) +
          (variant.available ? "" : " — " + ctx.t("Sold out")) +
          "</option>"
        );
      })
      .join("");
    return (
      '<label class="nb-field">' +
      '<span class="nb-field__label">' +
      ctx.t("Variant") +
      "</span>" +
      '<select class="nb-select"' +
      ' data-nameless-variant-selector="' +
      esc(sel.id) +
      '"' +
      (withProductId ? ' data-nameless-product-id="' + esc(product.id) + '"' : "") +
      ">" +
      options +
      "</select>" +
      "</label>"
    );
  }

  function mediaHtml(product, variant, extraClass) {
    var image = variantImage(product, variant);
    if (image) {
      return (
        '<img class="nb-media' +
        (extraClass ? " " + extraClass : "") +
        '" src="' +
        esc(image.url) +
        '" alt="' +
        esc(image.altText || product.title) +
        '">'
      );
    }
    return (
      '<span class="nb-media nb-media--placeholder' +
      (extraClass ? " " + extraClass : "") +
      '" aria-hidden="true">' +
      esc((product.title || "?").charAt(0)) +
      "</span>"
    );
  }

  function pricePair(base, final, currency, freeLabel) {
    var safeBase = Number(base) || 0;
    var safeFinal = Number(final);
    if (!isFinite(safeFinal)) safeFinal = safeBase;
    var isFree = safeFinal <= 0.001;
    var discounted = safeFinal + 0.001 < safeBase;
    var now = isFree
      ? '<span class="nb-price__now nb-price__now--free">' + (freeLabel || ctx.t("Free")) + "</span>"
      : '<span class="nb-price__now">' + esc(money(safeFinal, currency)) + "</span>";
    var was = discounted
      ? '<s class="nb-price__was">' + esc(money(safeBase, currency)) + "</s>"
      : "";
    return '<span class="nb-price">' + now + was + "</span>";
  }

  function hostSels() {
    return selectors.filter(isHost);
  }

  function giftSels() {
    return selectors.filter(isGift);
  }

  var hosts = hostSels();
  var gifts = giftSels();
  var host = hosts[0] || null;
  var gift = gifts[0] || null;
  var hostQty = qtyOf(host);
  var giftQty = qtyOf(gift);
  var hostPct = host ? rewardPercent(host.id) : 25;
  if (!hostPct) hostPct = 25;

  function renderHost(sel) {
    var product = hostProduct(sel);
    if (!product) {
      return (
        '<section class="nb-host nb-host--empty">' +
        '<p class="nb-note">' +
        ctx.t("This offer appears on products in the collection.") +
        "</p>" +
        "</section>"
      );
    }

    var entry = singleEntry(sel);
    var variant = activeVariant(product, entry);
    var currency = (variant && variant.currencyCode) || totals.currencyCode;
    var base = entry && entry.quantity > 0 ? entry.basePrice : variant ? variant.priceAmount : 0;
    var applied =
      entry &&
      typeof entry.finalPrice === "number" &&
      entry.finalPrice + 0.001 < (Number(entry.basePrice) || base);
    var final = applied ? entry.finalPrice : base * (1 - hostPct / 100);
    var soldOut = !!(entry && entry.soldOut);
    var qty = entry ? Number(entry.quantity || 0) : 0;

    return (
      '<section class="nb-host' +
      (soldOut ? " is-sold-out" : "") +
      '">' +
      mediaHtml(product, variant, "nb-media--host") +
      '<div class="nb-host__body">' +
      '<div class="nb-host__topline">' +
      '<h3 class="nb-host__title">' +
      esc(product.title) +
      "</h3>" +
      '<span class="nb-pill">' +
      ctx.t("{{percent}}% off", { percent: Math.round(hostPct) }) +
      "</span>" +
      "</div>" +
      (soldOut ? '<p class="nb-badge">' + ctx.t("Sold out") + "</p>" : "") +
      pricePair(base, final, currency) +
      '<div class="nb-host__controls">' +
      variantSelect(sel, product, entry, false) +
      '<label class="nb-field">' +
      '<span class="nb-field__label">' +
      ctx.t("Qty") +
      "</span>" +
      '<input class="nb-qty" type="number" min="1" step="1" value="' +
      qty +
      '" data-nameless-qty-selector="' +
      esc(sel.id) +
      '">' +
      "</label>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderGiftCard(sel, product) {
    var entry = findMultiEntry(sel, product.id);
    var qty = entry ? Number(entry.quantity || 0) : 0;
    var selected = qty > 0;
    var variant = activeVariant(product, entry);
    var currency = (variant && variant.currencyCode) || totals.currencyCode;
    var base = entry && selected ? entry.basePrice : variant ? variant.priceAmount : 0;
    var final =
      entry && selected && typeof entry.finalPrice === "number" ? entry.finalPrice : 0;
    var soldOut = !!(entry && entry.soldOut) || (variant && variant.available === false);

    return (
      '<article class="nb-gift' +
      (selected ? " is-selected" : "") +
      (soldOut ? " is-sold-out" : "") +
      '">' +
      '<button class="nb-gift__pick" type="button" value="1"' +
      ' data-nameless-qty-selector="' +
      esc(sel.id) +
      '" data-nameless-product-id="' +
      esc(product.id) +
      '" aria-pressed="' +
      (selected ? "true" : "false") +
      '"' +
      (soldOut ? " disabled" : "") +
      ">" +
      mediaHtml(product, variant, "nb-media--gift") +
      '<span class="nb-gift__name">' +
      esc(product.title) +
      "</span>" +
      pricePair(base, selected ? final : 0, currency, ctx.t("Free")) +
      (selected ? '<span class="nb-gift__tick">' + ctx.t("Selected") + "</span>" : "") +
      (soldOut ? '<span class="nb-badge">' + ctx.t("Sold out") + "</span>" : "") +
      "</button>" +
      variantSelect(sel, product, entry, true) +
      "</article>"
    );
  }

  function renderGifts(sel) {
    var products = (sel.collection && sel.collection.products) || [];
    var heading = (sel.collection && sel.collection.title) || ctx.t("Free gift");
    var cards;
    if (!products.length) {
      cards = '<p class="nb-note">' + ctx.t("No gifts in this collection yet.") + "</p>";
    } else {
      cards =
        '<div class="nb-gifts__grid">' +
        products
          .map(function (product) {
            return renderGiftCard(sel, product);
          })
          .join("") +
        "</div>";
    }

    return (
      '<section class="nb-gifts">' +
      '<div class="nb-gifts__head">' +
      '<h3 class="nb-gifts__title">' +
      ctx.t("Choose your free gift") +
      "</h3>" +
      '<p class="nb-gifts__hint">' +
      ctx.t("Pick any 1 product from {{collection}}.", { collection: heading }) +
      "</p>" +
      "</div>" +
      cards +
      "</section>"
    );
  }

  var hint = "";
  if (hostQty < 1) {
    hint = ctx.t("Add this product to unlock the free gift.");
  } else if (giftQty < 1) {
    hint = ctx.t("Select a free gift to unlock this offer.");
  } else if (giftQty > 1) {
    hint = ctx.t("Choose only 1 free gift.");
  }

  var offerReady = hostQty >= 1 && giftQty === 1;
  var soldOutSelected = selectors.some(function (sel) {
    if (isGift(sel)) {
      return multiEntries(sel).some(function (entry) {
        return entry && entry.quantity > 0 && entry.soldOut;
      });
    }
    var entry = singleEntry(sel);
    return !!(entry && entry.quantity > 0 && entry.soldOut);
  });
  var canBuy = offerReady && !soldOutSelected;

  var saveAmount = Math.max(0, Number(totals.baseSubtotal || 0) - Number(totals.subtotal || 0));
  var itemCount = Number(totals.itemCount || 0);
  var currency = totals.currencyCode;
  var hasDiscount = Number(totals.subtotal) + 0.001 < Number(totals.baseSubtotal);

  var footerAtc = meta.atcOverride
    ? ""
    : '<button class="nb-atc" type="button" data-nameless-atc="' +
      esc(snapshot.bundleId) +
      '"' +
      (canBuy ? "" : " disabled") +
      ">" +
      ctx.t("Add to cart") +
      "</button>";

  var hostHtml = hosts
    .map(function (sel) {
      return renderHost(sel);
    })
    .join("");
  var giftHtml = gifts
    .map(function (sel) {
      return renderGifts(sel);
    })
    .join("");

  if (!hosts.length && !gifts.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML =
    '<div class="nb-offer">' +
    '<header class="nb-offer__banner">' +
    '<p class="nb-offer__kicker">' +
    ctx.t("{{percent}}% off + free gift", { percent: Math.round(hostPct) }) +
    "</p>" +
    '<h2 class="nb-offer__title">' +
    esc(meta.title || "") +
    "</h2>" +
    (meta.subtitle ? '<p class="nb-offer__sub">' + esc(meta.subtitle) + "</p>" : "") +
    "</header>" +
    hostHtml +
    giftHtml +
    '<footer class="nb-foot">' +
    (hint ? '<p class="nb-foot__hint">' + hint + "</p>" : "") +
    '<div class="nb-foot__row">' +
    '<div class="nb-foot__totals">' +
    '<p class="nb-foot__count">' +
    (itemCount === 1
      ? ctx.t("{{count}} item", { count: 1 })
      : ctx.t("{{count}} items", { count: itemCount })) +
    "</p>" +
    '<p class="nb-foot__price">' +
    (hasDiscount
      ? "<s>" +
        esc(money(totals.baseSubtotal, currency)) +
        "</s> <strong>" +
        esc(money(totals.subtotal, currency)) +
        "</strong>"
      : "<strong>" + esc(money(totals.subtotal || 0, currency)) + "</strong>") +
    "</p>" +
    (offerReady && saveAmount > 0
      ? '<p class="nb-foot__save">' + ctx.t("Save {{amount}}", { amount: money(saveAmount, currency) }) + "</p>"
      : "") +
    "</div>" +
    footerAtc +
    "</div>" +
    "</footer>" +
    "</div>";
});
