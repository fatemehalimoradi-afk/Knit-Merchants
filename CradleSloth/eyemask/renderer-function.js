window.nameless.defineRenderer(function(t) {
  var n = t.snapshot,
    e = t.container,
    r = n.selectors || [],
    a = n.conditionSets || [];

  function i(t) {
    return String(null == t ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function u(t) {
    var n = Number(t);
    return Number.isFinite(n) ? n : null
  }

  function s(t) {
    return Math.round(100 * (Number(t) || 0)) / 100
  }

  function o() {
    return n.totals.currencyCode || "USD"
  }

  function l(t, n) {
    var e = Number(t) || 0,
      r = Math.round(100 * e) % 100 == 0 ? 0 : 2;
    try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: n || o(),
        minimumFractionDigits: r,
        maximumFractionDigits: r
      }).format(e)
    } catch (t) {
      return "$" + e.toFixed(r)
    }
  }

  function c(t) {
    return t ? "productSingle" === t.kind ? t.product : "collectionSingle" === t.kind ? t.resolvedProduct : null : null
  }

  function d(t, n) {
    var e = t && t.variants || [];
    if (!e.length) return null;
    if (n)
      for (var r = 0; r < e.length; r++)
        if (e[r].id === n.variantId) return e[r];
    for (var a = 0; a < e.length; a++)
      if (e[a].available) return e[a];
    return e[0]
  }

  function m(t) {
    return t && t.rewardSet && Array.isArray(t.rewardSet.rewards) ? t.rewardSet.rewards : []
  }

  function f(t, n) {
    return (Array.isArray(t.appliesTo) ? t.appliesTo : []).some(function(t) {
      return t && t.selectorId === n
    })
  }

  function p(t, n) {
    for (var e = (t && Array.isArray(t.conditions) ? t.conditions : []) || [], r = 0; r < e.length; r++) {
      var a = e[r];
      if (a && "quantity" === a.type && -1 !== (Array.isArray(a.satisfiesFor) ? a.satisfiesFor : []).map(function(t) {
          return t && t.selectorId
        }).filter(Boolean).indexOf(n)) return a
    }
    return null
  }

  function y(t) {
    var n = u(t && t.minimum),
      e = u(t && t.maximum);
    return null === n || null === e ? null : n === e ? n : null
  }

  function b(t, n) {
    for (var e = m(t), r = 0, a = 0; a < e.length; a++) {
      var i = e[a];
      i && "percentageDiscount" === i.type && f(i, n) && (r += Number(i.percentage) || 0)
    }
    return Math.min(r, 100)
  }

  function v(t, n) {
    for (var e = m(t), r = 0, a = "TOTAL", i = 0; i < e.length; i++) {
      var u = e[i];
      u && "fixedDiscount" === u.type && f(u, n) && (r += Number(u.amount) || 0, u.mode && (a = String(u.mode)))
    }
    return {
      amount: r,
      mode: a
    }
  }
  var g = function() {
      var t, n = (e.closest("[data-nameless-block]") || e).getAttribute("data-product-id") || "",
        a = n ? 0 === n.indexOf("gid://") ? n : "gid://shopify/Product/" + n : "",
        i = [];
      for (t = 0; t < r.length; t++) c(r[t]) && i.push(r[t]);
      if (!i.length) return null;
      if (a)
        for (t = 0; t < i.length; t++) {
          var u = c(i[t]);
          if (u && (u.id === a || String(u.id).endsWith("/" + n))) return i[t]
        }
      return i[0]
    }(),
    h = c(g),
    q = function(t) {
      if (!t) return null;
      var e = n.selections[t.id];
      return e && !Array.isArray(e) ? e : null
    }(g),
    _ = d(h, q),
    S = _ && Number(_.priceAmount) || 0,
    A = _ && _.currencyCode || o(),
    x = function(t) {
      if (!t) return [];
      var n, e = {};
      for (n = 0; n < a.length; n++) {
        var r = a[n],
          i = y(p(r, t.id));
        null === i || i <= 0 || e[i] || (e[i] = {
          quantity: i,
          percentage: b(r, t.id),
          fixed: v(r, t.id)
        })
      }
      return Object.keys(e).map(function(t) {
        return e[t]
      }).sort(function(t, n) {
        return t.quantity - n.quantity
      })
    }(g),
    N = function() {
      for (var t = 0; t < r.length; t++) {
        var e = n.selections[r[t].id];
        if (Array.isArray(e)) {
          for (var a = 0; a < e.length; a++)
            if (e[a] && e[a].quantity > 0 && e[a].soldOut) return !0
        } else if (e && e.quantity > 0 && e.soldOut) return !0
      }
      return !1
    }();
  e.innerHTML = '<div class="bs-widget">' + (g && h && x.length ? '<div class="bs-heading"><span class="bs-heading__rule"></span><span class="bs-heading__text">Bundle &amp; Save</span><span class="bs-heading__rule"></span></div><div class="bs-tier-list">' + x.map(function(t) {
      var n = function(t, n, e, r) {
          var a = Math.max(1, Number(t) || 1),
            i = Number(n) || 0,
            u = Number(e) || 0,
            o = r && Number(r.amount) > 0 ? Number(r.amount) : 0,
            l = r && r.mode ? String(r.mode) : "TOTAL",
            c = i * (1 - u / 100) * a,
            d = 0;
          return o > 0 && (d = "PER_UNIT" === l ? Math.min(o * a, c) : Math.min(o, c)), {
            base: s(i),
            final: s(Math.max(0, c - d) / a)
          }
        }(t.quantity, S, t.percentage, t.fixed),
        e = !(!q || q.quantity !== t.quantity),
        r = ! function(t, n, e) {
          var r = d(t, n);
          return !(!r || !r.available) && (null === r.inventoryQuantity || void 0 === r.inventoryQuantity || r.inventoryQuantity >= e)
        }(h, q, t.quantity),
        a = function(t, n) {
          return 2 === t ? "Most Popular" : 4 === t ? "Most Savings" : 2 === n.length && t === n[n.length - 1].quantity ? "Most Popular" : ""
        }(t.quantity, x),
        u = n.final < n.base - .001,
        o = [t.quantity + "x Cove Sleep Eyemask", t.quantity + "x Travel Pouch"].map(function(t) {
          return "<span>" + i(t) + "</span>"
        }).join("");
      return '<button class="bs-tier' + (e ? " is-selected" : "") + '" type="button" data-nameless-qty-selector="' + i(g.id) + '" value="' + t.quantity + '" aria-pressed="' + (e ? "true" : "false") + '"' + (r ? " disabled" : "") + ">" + (a ? '<span class="bs-tier__badge">' + i(a) + "</span>" : "") + '<span class="bs-tier__main"><span class="bs-tier__body"><span class="bs-radio" aria-hidden="true"></span><span class="bs-tier__copy"><span class="bs-tier__title">' + i({
        1: "1x Single",
        2: "2x Partner",
        3: "3x Family",
        4: "4x Family Plus"
      } [t.quantity] || t.quantity + "x Bundle") + '</span><span class="bs-tier__desc">' + o + '</span></span></span><span class="bs-tier__prices"><span class="bs-tier__price"><strong>' + l(n.final, A) + "</strong><small>/ea</small></span>" + (u ? "<s>" + l(n.base, A) + "</s>" : "") + "</span></span></button>"
    }).join("") + "</div>" : "") + '<button class="bs-atc" type="button" data-nameless-atc="' + i(n.bundleId) + '"' + (N ? " disabled" : "") + ">Add To Cart</button></div>",
    function() {
      var t = e.closest("[data-nameless-block]") || e;

      function n(t) {
        t && !t.closest("[data-nameless-block]") && (t.style.setProperty("display", "none", "important"), t.setAttribute("aria-hidden", "true"))
      }

      function r() {
        var e = document.querySelector("product-form.product-form") || document.querySelector("product-form"),
          r = e && e.querySelector(".product-form__buttons") || document.querySelector(".product-form__buttons"),
          a = e && e.querySelector('form[action*="/cart/add"]') || document.querySelector('form[action*="/cart/add"]'),
          i = r && (r.querySelector('button[name="add"]') || r.querySelector(".product-form__submit")) || null,
          u = r || a || i;
        t && u && u.parentNode && t !== u && (t.parentNode !== u.parentNode || t.nextSibling !== u) && u.parentNode.insertBefore(t, u), r ? n(r) : i && n(i)
      }
      t && t.parentNode && (r(), "function" == typeof requestAnimationFrame && requestAnimationFrame(function() {
        r(), requestAnimationFrame(r)
      }), setTimeout(r, 0), setTimeout(r, 100))
    }()
});