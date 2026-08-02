window.nameless.defineRenderer(function(a) {
  var e = a.snapshot,
    t = a.container;

  function n(a) {
    return String(null == a ? "" : a).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\"/g, "&quot;")
  }

  function i(a, e) {
    var t = Number(a);
    isFinite(t) || (t = 0);
    try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: e || "USD"
      }).format(t)
    } catch (a) {
      return (e ? e + " " : "") + t.toFixed(2)
    }
  }

  function l(a) {
    var t = e.selections && e.selections[a];
    return t && !Array.isArray(t) ? t : null
  }

  function o(a, t) {
    var n = e.selections && e.selections[a];
    if (!Array.isArray(n)) return null;
    for (var i = 0; i < n.length; i++)
      if (n[i] && n[i].productId === t) return n[i];
    return null
  }

  function r() {
    var a = t && t.ownerDocument;
    return a ? a.querySelector('quantity-input input.quantity__input[name="quantity"][form]') : null
  }

  function d() {
    for (var a = e.conditionSets || [], t = 0; t < a.length; t++)
      for (var n = a[t].rewardSet && a[t].rewardSet.rewards || [], i = 0; i < n.length; i++)
        if ("percentageDiscount" === n[i].type && Number(n[i].percentage) > 0) return Math.round(Number(n[i].percentage));
    return 0
  }

  function s(a, t, l) {
    var o = l && Number(l.quantity) || 0,
      r = o > 0,
      s = !(!l || !l.soldOut),
      c = function(a, e) {
        var t, n = a && a.variants || [];
        if (e && e.variantId)
          for (t = 0; t < n.length; t++)
            if (n[t].id === e.variantId) return n[t];
        for (t = 0; t < n.length; t++)
          if (n[t].available) return n[t];
        return n[0] || null
      }(t, l),
      u = c && c.image,
      m = l ? l.basePrice : c ? c.priceAmount : 0,
      p = d(),
      v = l && r ? l.finalPrice : p ? Math.round(m * (1 - p / 100) * 100) / 100 : m,
      _ = c ? c.currencyCode : e.totals.currencyCode,
      h = t.handle ? "/products/" + encodeURIComponent(t.handle) : "",
      f = "collectionMulti" === a.kind ? ' data-nameless-product-id="' + n(t.id) + '"' : "";
    return '<article class="amolia-addon' + (r ? " is-selected" : "") + (s ? " is-sold-out" : "") + '"><div class="amolia-addon__row"><label class="amolia-addon__select"><input class="amolia-addon__checkbox" type="checkbox" data-nameless-qty-selector="' + n(a.id) + '"' + f + (r ? " checked" : "") + (s ? " disabled" : "") + ' aria-label="Add ' + n(t.title) + '"><span class="amolia-addon__control" aria-hidden="true"></span></label><div class="amolia-addon__media">' + (u ? '<img class="amolia-addon__image" src="' + n(u.url) + '" alt="' + n(u.altText || t.title) + '">' : '<span class="amolia-addon__image-placeholder" aria-hidden="true">+</span>') + '</div><div class="amolia-addon__content"><div class="amolia-addon__heading"><h4 class="amolia-addon__title">' + n(t.title) + (h ? '<a class="amolia-addon__outgoing-link" href="' + n(h) + '" target="_blank" rel="noopener noreferrer" aria-label="View ' + n(t.title) + '"><svg class="amolia-addon__outgoing-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.91667 12.25C2.59583 12.25 2.32118 12.1358 2.09271 11.9073C1.86424 11.6788 1.75 11.4042 1.75 11.0833V2.91667C1.75 2.59583 1.86424 2.32118 2.09271 2.09271C2.32118 1.86424 2.59583 1.75 2.91667 1.75H7V2.91667H2.91667V11.0833H11.0833V7H12.25V11.0833C12.25 11.4042 12.1358 11.6788 11.9073 11.9073C11.6788 12.1358 11.4042 12.25 11.0833 12.25H2.91667ZM5.65833 9.15833L4.84167 8.34167L10.2667 2.91667H8.16667V1.75H12.25V5.83333H11.0833V3.73333L5.65833 9.15833Z" fill="#191919" /><path d="M2.91667 12.25C2.59583 12.25 2.32118 12.1358 2.09271 11.9073C1.86424 11.6788 1.75 11.4042 1.75 11.0833V2.91667C1.75 2.59583 1.86424 2.32118 2.09271 2.09271C2.32118 1.86424 2.59583 1.75 2.91667 1.75H7V2.91667H2.91667V11.0833H11.0833V7H12.25V11.0833C12.25 11.4042 12.1358 11.6788 11.9073 11.9073C11.6788 12.1358 11.4042 12.25 11.0833 12.25H2.91667ZM5.65833 9.15833L4.84167 8.34167L10.2667 2.91667H8.16667V1.75H12.25V5.83333H11.0833V3.73333L5.65833 9.15833Z" fill="white" fill-opacity="0.5" /></svg></a>' : "") + "</h4>" + (s ? '<span class="amolia-addon__sold-out">Sold out</span>' : "") + '</div><div class="amolia-addon__price"><span class="amolia-addon__price-now">+ ' + n(i(v, _)) + "</span>" + (v < m ? '<s class="amolia-addon__price-was">' + n(i(m, _)) + "</s>" : "") + '</div><input class="amolia-addon__quantity" type="number" min="0" max="1" step="1" readonly tabindex="-1" aria-hidden="true" value="' + n(r ? Math.min(o, 1) : 1) + '" data-nameless-qty-selector="' + n(a.id) + '"' + f + (s ? " disabled" : "") + "></div></div>" + function(a, e, t, i) {
      var l = e.variants || [];
      if (l.length < 2) return "";
      for (var o = "", r = 0; r < l.length; r++) {
        var d = l[r];
        o += '<option value="' + n(d.id) + '"' + (t && d.id === t.variantId ? " selected" : "") + (d.available ? "" : " disabled") + ">" + n(d.title) + (d.available ? "" : " — Sold out") + "</option>"
      }
      return '<label class="amolia-addon__variant-label"><span class="amolia-visually-hidden">Choose ' + n(e.title) + ' variant</span><select class="amolia-addon__variant" data-nameless-variant-selector="' + n(a.id) + '"' + i + ">" + o + "</select></label>"
    }(a, t, l, f) + "</article>"
  }
  var c = e.selectors || [],
    u = c[0];
  (u && "productSingle" === u.kind ? u.product : u && "collectionSingle" === u.kind && u.resolvedProduct) && u && function a(t) {
    var n = function() {
        var a = r();
        if (!(a instanceof HTMLInputElement)) return null;
        var e = Math.floor(Number(a.value));
        return isFinite(e) && e > 0 ? e : null
      }(),
      i = l(t),
      o = i ? Math.max(0, Math.floor(Number(i.quantity) || 0)) : 0;
    null != n && o !== n && window.nameless && "function" == typeof window.nameless.dispatch && window.nameless.dispatch("quantityChange", {
      bundleId: e.bundleId,
      selectorId: t,
      quantity: n
    });
    var d = r();
    d instanceof HTMLInputElement && !d.__amoliaPdpQuantitySync && (d.__amoliaPdpQuantitySync = !0, d.addEventListener("input", function() {
      a(t)
    }), d.addEventListener("change", function() {
      a(t)
    }))
  }(u.id);
  for (var m = "", p = !1, v = 1; v < c.length; v++) {
    var _ = c[v];
    if ("collectionMulti" !== _.kind) {
      var h = "productSingle" === _.kind ? _.product : _.resolvedProduct;
      if (h) {
        var f = l(_.id);
        f && f.quantity > 0 && f.soldOut && (p = !0), m += s(_, h, f)
      }
    } else
      for (var g = _.collection && _.collection.products || [], y = 0; y < g.length; y++) {
        var b = g[y],
          w = o(_.id, b.id);
        w && w.quantity > 0 && w.soldOut && (p = !0), m += s(_, b, w)
      }
  }
  e.totals;
  var H = d(),
    C = e.meta.atcOverride ? "" : '<button class="amolia-widget__atc" type="button" data-nameless-atc="' + n(e.bundleId) + '"' + (p ? " disabled" : "") + ">Add bundle to cart</button>";
  t.innerHTML = '<section class="amolia-widget"><header class="amolia-widget__header"><div class="amolia-widget__title-row"><h3 class="amolia-widget__title">' + n(e.meta.title || "Product Add-ons") + "</h3>" + (H ? '<span class="amolia-widget__discount">' + n(H) + "% OFF</span>" : "") + '</div><p class="amolia-widget__subtitle">' + n("Get 30% off selected soap- and shampoo bars from Kystnær when you buy a toiletry bag!") + "</p></header>" + (m ? '<div class="amolia-widget__addon-list">' + m + "</div>" : '<p class="amolia-widget__empty">No add-ons are available right now.</p>') + C + "</section>"
});