window.nameless.defineRenderer(function(n) {
  var e = n && n.container;
  if (e) try {
    e.innerHTML = function(n) {
      for (var e = n && n.selectors || [], i = n && n.conditionSets || [], u = n && n.meta || {}, c = null, m = null, b = 0; b < e.length; b++) {
        var f = e[b],
          p = s(f);
        if (f && f.id && "collectionMulti" !== f.kind && p && p.variants && p.variants.length) {
          c = f, m = p;
          break
        }
      }
      if (!c) return "";
      for (var h = function(n, e) {
          var t = n && n.selections ? n.selections[e] : null;
          return t && !Array.isArray(t) ? t : null
        }(n, c.id), g = h && a(h.quantity) ? h.quantity : 0, y = function(n, e) {
          var t = n && n.variants || [];
          if (!t.length) return null;
          if (e && e.variantId)
            for (var r = 0; r < t.length; r++)
              if (t[r] && t[r].id === e.variantId) return t[r];
          for (var a = 0; a < t.length; a++)
            if (t[a] && t[a].available) return t[a];
          return t[0] || null
        }(m, h), _ = y && y.currencyCode || n.totals && n.totals.currencyCode || "", x = h && a(h.basePrice) && h.basePrice > 0 ? h.basePrice : y && a(y.priceAmount) ? y.priceAmount : 0, q = !(!h || !h.soldOut), S = function(n, e) {
          for (var t = [], r = {}, i = 0; i < n.length; i++) {
            var l = o(n[i], e);
            if (l && a(l.min) && !(l.min < 1)) {
              var s = String(l.min);
              r[s] || (r[s] = !0, t.push({
                min: Math.round(l.min),
                max: a(l.max) ? Math.round(l.max) : null
              }))
            }
          }
          return t.sort(function(n, e) {
            return n.min - e.min
          }), t.length ? (t[0].min > 1 && t.unshift({
            min: 1,
            max: t[0].min - 1
          }), t) : [{
            min: 1,
            max: null
          }]
        }(i, c.id), A = function(n, e) {
          if (e <= 0) return -1;
          for (var t = -1, r = 0; r < n.length; r++) e >= n[r].min && (null === n[r].max || e <= n[r].max) && (t = r);
          if (-1 === t)
            for (var a = 0; a < n.length; a++) e >= n[a].min && (t = a);
          return t
        }(S, g), P = 0, I = "", w = 0; w < S.length; w++) {
        var M = S[w],
          D = w === A,
          O = D && g > 0 ? g : M.min,
          T = D && h && a(h.cumulativePercentageDiscount) ? h.cumulativePercentageDiscount : d(i, c.id, O),
          k = D && h && a(h.finalPrice) ? h.finalPrice : r(x * (1 - T / 100));
        D && (P = T), I += v({
          tier: M,
          selectorId: c.id,
          product: m,
          entry: h,
          qty: O,
          percent: T,
          basePrice: x,
          finalPrice: k,
          currency: _,
          selected: D,
          soldOut: q,
          isLast: w === S.length - 1,
          highlighted: S.length > 1 && 1 === w
        })
      }
      var F = u.title || "",
        L = u.subtitle || "";
      return '<div class="nbv-widget">' + (F ? '<div class="nbv-heading"><h2 class="nbv-heading__title">' + t(F) + "</h2></div>" : "") + (L ? '<p class="nbv-subtitle">' + t(L) + "</p>" : "") + '<div class="nbv-tiers" role="radiogroup"' + (F ? ' aria-label="' + t(F) + '"' : ' aria-label="Quantity offers"') + ">" + I + "</div>" + (q ? '<p class="nbv-note">The selected option is sold out — choose another one.</p>' : "") + (u.atcOverride ? "" : function(n, e, r, a) {
        var i = a ? "Sold out" : e <= 0 ? "Select an option" : r > 0 ? "Add " + e + " | save " + l(r) + "%" : "Add " + e + " to cart",
          s = a || e <= 0;
        return '<button class="nbv-atc" type="button" data-nameless-atc="' + t(n.bundleId) + '"' + (s ? " disabled" : "") + ">" + t(i) + "</button>"
      }(n, g, P, q)) + "</div>"
    }(n && n.snapshot)
  } catch (n) {
    try {
      e.innerHTML = ""
    } catch (n) {}
  }

  function t(n) {
    return String(null == n ? "" : n).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function r(n) {
    return Math.round(100 * (Number(n) || 0)) / 100
  }

  function a(n) {
    return "number" == typeof n && isFinite(n)
  }

  function i(n, e) {
    if (!a(n)) return "";
    if (e) try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: e
      }).format(n)
    } catch (n) {}
    return n.toFixed(2)
  }

  function l(n) {
    return String(Math.round(10 * (Number(n) || 0)) / 10)
  }

  function s(n) {
    return n ? "productSingle" === n.kind ? n.product || null : "collectionSingle" === n.kind ? n.resolvedProduct || n.collection && Array.isArray(n.collection.products) && n.collection.products[0] || null : n.resolvedProduct || n.product || null : null
  }

  function u(n, e) {
    for (var t = Array.isArray(n) ? n : [], r = 0; r < t.length; r++)
      if (t[r] && t[r].selectorId === e) return !0;
    return !1
  }

  function o(n, e) {
    for (var t = n && n.conditions || [], r = null, i = null, l = !1, s = 0; s < t.length; s++) {
      var o = t[s];
      o && "quantity" === o.type && u(o.satisfiesFor, e) && (l = !0, a(o.minimum) && (r = null === r ? o.minimum : Math.max(r, o.minimum)), a(o.maximum) && (i = null === i ? o.maximum : Math.min(i, o.maximum)))
    }
    return l ? {
      min: r,
      max: i
    } : null
  }

  function c(n, e) {
    for (var t = n && n.rewardSet && Array.isArray(n.rewardSet.rewards) ? n.rewardSet.rewards : [], r = 0, a = 0; a < t.length; a++) {
      var i = t[a];
      i && "percentageDiscount" === i.type && u(i.appliesTo, e) && (r += Number(i.percentage) || 0)
    }
    return r
  }

  function d(n, e, t) {
    for (var r = 0, a = 0; a < n.length; a++) {
      var i = o(n[a], e);
      i && (null !== i.min && t < i.min || null !== i.max && t > i.max || null === i.min && null === i.max || (r += c(n[a], e)))
    }
    return Math.min(r, 100)
  }

  function v(n) {
    var e, r, a, s, u = n.tier,
      o = n.selected,
      c = n.highlighted,
      d = null === u.max || u.max > u.min,
      v = o ? (d ? function(n, e, r) {
        var a = e <= r.min,
          i = null !== r.max && e >= r.max || e >= 99;
        return '<div class="nbv-qty"><span class="nbv-qty__label">Quantity</span><span class="nbv-qty__controls"><button class="nbv-qty__step" type="button" aria-label="Decrease quantity"' + (a ? " disabled" : ' data-nameless-qty-selector="' + t(n) + '" value="' + (e - 1) + '"') + '>&minus;</button><span class="nbv-qty__value" aria-live="polite">' + t(e) + '</span><button class="nbv-qty__step nbv-qty__step--plus" type="button" aria-label="Increase quantity"' + (i ? " disabled" : ' data-nameless-qty-selector="' + t(n) + '" value="' + (e + 1) + '"') + ">+</button></span></div>"
      }(n.selectorId, n.qty, u) : "") + function(n, e, r) {
        if (! function(n) {
            var e = n && n.variants || [];
            if (e.length <= 1) return !1;
            for (var t = 0; t < e.length; t++)
              if (e[t] && e[t].title && "Default Title" !== e[t].title) return !0;
            return !1
          }(e)) return "";
        for (var a = e.variants || [], i = r && r.variantId ? r.variantId : "", l = i ? "" : '<option value="" disabled selected>Select</option>', s = 0; s < a.length; s++) {
          var u = a[s];
          if (u && u.id) {
            var o = u.title || "Variant";
            u.available || (o += " — Sold out"), l += '<option value="' + t(u.id) + '"' + (u.id === i ? " selected" : "") + (u.available ? "" : " disabled") + ">" + t(o) + "</option>"
          }
        }
        if (!l) return "";
        var c = "nbv-variant-" + String(n).replace(/[^a-zA-Z0-9_-]/g, "-");
        return '<div class="nbv-field"><label class="nbv-field__label" for="' + t(c) + '">' + t(function(n) {
          for (var e = n && n.variants || [], t = /^(one ?size|xx?x?s|xx?x?l|[2-6]x?l|s|m|l|small|medium|large|x-?large|extra ?large|\d{1,3}(\.\d)?)$/i, r = 0, a = 0; a < e.length; a++) {
            var i = e[a] && e[a].title;
            if (i && "Default Title" !== i && (r += 1, !t.test(String(i).trim()))) return "Options"
          }
          return r ? "Size" : "Options"
        }(e)) + '</label><select class="nbv-field__select" id="' + t(c) + '" data-nameless-variant-selector="' + t(n) + '">' + l + "</select></div>"
      }(n.selectorId, n.product, n.entry) : "";
    return '<div class="nbv-tier' + (o ? " is-selected" : "") + (n.soldOut && o ? " is-sold-out" : "") + (c ? " has-ribbon" : "") + '">' + (c ? '<span class="nbv-tier__ribbon">' + t("Most popular") + "</span>" : "") + '<button class="nbv-tier__head" type="button" role="radio" aria-checked="' + (o ? "true" : "false") + '"' + (o ? "" : ' data-nameless-qty-selector="' + t(n.selectorId) + '" value="' + u.min + '"') + '><span class="nbv-radio" aria-hidden="true"></span><span class="nbv-tier__label">' + t(function(n, e) {
      var t = null === n.max && e;
      return "Buy " + n.min + (t ? " or more" : "")
    }(u, n.isLast)) + (n.percent > 0 ? '<span class="nbv-tier__save">Save ' + t(l(n.percent)) + "%</span>" : "") + "</span>" + (s = (e = n.finalPrice) < (r = n.basePrice) - .005, '<span class="nbv-tier__pricing"><span class="nbv-tier__now">' + t(i(e, a = n.currency)) + '<span class="nbv-tier__each">/each</span></span>' + (s ? '<s class="nbv-tier__was">' + t(i(r, a)) + "</s>" : "") + "</span></button>") + (v ? '<div class="nbv-tier__panel">' + v + "</div>" : "") + "</div>"
  }
});