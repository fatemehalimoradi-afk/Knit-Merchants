window.nameless.defineRenderer(function(t) {
  var e = t.snapshot,
    n = t.container,
    r = e.selectors || [],
    a = e.conditionSets || [];

  function i(t) {
    return String(null == t ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function u(t) {
    var e = Number(t);
    return Number.isFinite(e) ? e : null
  }

  function s(t) {
    return Math.round(100 * (Number(t) || 0)) / 100
  }

  function o(t) {
    if (!t) return null;
    var n = e.selections[t.id];
    return n && !Array.isArray(n) ? n : null
  }

  function l(t) {
    return t ? "productSingle" === t.kind ? t.product : "collectionSingle" === t.kind ? t.resolvedProduct : null : null
  }

  function c(t, e) {
    var n = t && t.variants ? t.variants : [];
    if (!n.length) return null;
    if (e)
      for (var r = 0; r < n.length; r++)
        if (n[r].id === e.variantId) return n[r];
    for (var a = 0; a < n.length; a++)
      if (n[a].available) return n[a];
    return n[0]
  }

  function m() {
    return e.totals.currencyCode || "USD"
  }

  function d(t, e, n) {
    var r = Number(t) || 0,
      a = n && n.noCents || Math.round(100 * r) % 100 == 0 ? 0 : 2;
    try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: e || m(),
        minimumFractionDigits: a,
        maximumFractionDigits: a
      }).format(r)
    } catch (e) {
      return "$" + r.toFixed(a)
    }
  }

  function p(t, e, n) {
    var r = e && e.image ? e.image : null;
    return r && r.url ? '<img class="' + n + ' kb-img" src="' + i(r.url) + '" alt="' + i(r.altText || t && t.title || "") + '">' : '<span class="' + n + ' kb-img kb-img--empty"></span>'
  }

  function f(t, e, n, r) {
    if (!t || !e || !e.variants || e.variants.length < 2) return "";
    var a = e.variants.map(function(t) {
      return '<option value="' + i(t.id) + '"' + (n && n.variantId === t.id ? " selected" : "") + (t.available ? "" : " disabled") + ">" + i(t.title) + (t.available ? "" : " - Sold out") + "</option>"
    }).join("");
    return '<select class="kb-variant' + (r ? " kb-variant--compact" : "") + '" data-nameless-variant-selector="' + i(t.id) + '">' + a + "</select>"
  }

  function y(t, e, n) {
    var r = c(t, e);
    return !(!r || !r.available) && (null === r.inventoryQuantity || r.inventoryQuantity >= n)
  }

  function b(t) {
    return (t && Array.isArray(t.satisfiesFor) ? t.satisfiesFor : []).map(function(t) {
      return t && t.selectorId
    }).filter(Boolean)
  }

  function g(t, e) {
    for (var n = t && Array.isArray(t.conditions) ? t.conditions : [], r = 0; r < n.length; r++) {
      var a = n[r];
      if (a && "quantity" === a.type && -1 !== b(a).indexOf(e)) return a
    }
    return null
  }

  function v(t) {
    var e = u(t && t.minimum),
      n = u(t && t.maximum);
    return {
      minimum: null === e ? 0 : e,
      maximum: null === n ? 1 / 0 : n
    }
  }

  function h(t) {
    if (!t) return null;
    var e = v(t);
    return Number.isFinite(e.maximum) && e.minimum === e.maximum ? e.minimum : null
  }

  function _(t, e) {
    if (!t) return !1;
    var n = v(t);
    return e >= n.minimum && e <= n.maximum
  }

  function q(t) {
    return t && t.rewardSet && Array.isArray(t.rewardSet.rewards) ? t.rewardSet.rewards : []
  }

  function k(t, e) {
    return (Array.isArray(t.appliesTo) ? t.appliesTo : []).some(function(t) {
      return t && t.selectorId === e
    })
  }

  function x(t, e) {
    for (var n = q(t), r = 0, a = 0; a < n.length; a++) {
      var i = n[a];
      i && "percentageDiscount" === i.type && k(i, e) && (r += Number(i.percentage) || 0)
    }
    return Math.min(r, 100)
  }

  function A(t, e) {
    for (var n = q(t), r = 0, a = "TOTAL", i = 0; i < n.length; i++) {
      var u = n[i];
      u && "fixedDiscount" === u.type && k(u, e) && (r += Number(u.amount) || 0, u.mode && (a = String(u.mode)))
    }
    return {
      amount: r,
      mode: a
    }
  }

  function S(t, e) {
    var n = A(t, e);
    return x(t, e) + "|" + n.amount + "|" + n.mode
  }

  function M(t) {
    return t >= 99.999
  }

  function N(t, e) {
    for (var n = {}, r = e, a = -1, i = 0; i < t.length; i++) {
      var u = t[i];
      if (null != u) {
        var s = String(u);
        n[s] = (n[s] || 0) + 1, n[s] > a && (r = u, a = n[s])
      }
    }
    return r
  }

  function O(t) {
    var e = {};
    return t.filter(function(t) {
      if (null == t) return !1;
      var n = String(t);
      return !e[n] && (e[n] = !0, !0)
    })
  }

  function T(t, e, n, r) {
    var a = Math.max(1, Number(t) || 1),
      i = Number(e) || 0,
      u = Number(n) || 0,
      o = r && Number(r.amount) > 0 ? Number(r.amount) : 0,
      l = r && r.mode ? String(r.mode) : "TOTAL",
      c = i * (1 - u / 100) * a,
      m = 0;
    return o > 0 && (m = "PER_UNIT" === l ? Math.min(o * a, c) : Math.min(o, c)), {
      base: s(i),
      final: s(Math.max(0, c - m) / a)
    }
  }

  function w(t) {
    return '<div class="kb-heading"><span class="kb-heading__rule"></span><span class="kb-heading__text">' + i(t) + '</span><span class="kb-heading__rule"></span></div>'
  }

  function F(t) {
    for (var e = n.querySelectorAll("input.kb-complete__qty-input[data-nameless-qty-selector]"), r = 0; r < e.length; r++)
      if (e[r].getAttribute("data-nameless-qty-selector") === t.id) {
        var a = u(e[r].value);
        if (null !== a && a >= 1) return Math.floor(a)
      } return null
  }
  var Q, P, C, L, I, E, B, D = (Q = r.filter(function(t) {
      return !!l(t)
    }).map(function(t) {
      for (var e = [], n = [], r = [], i = [], u = 0, s = 0; s < a.length; s++) {
        var o = g(a[s], t.id);
        if (o) {
          e.push(o);
          var l = h(o);
          null !== l && n.push(l);
          var c = v(o);
          r.push(c.minimum + ":" + (Number.isFinite(c.maximum) ? c.maximum : "*"))
        }
        var m = x(a[s], t.id),
          d = A(a[s], t.id);
        (m > 0 || d.amount > 0) && i.push(S(a[s], t.id)), M(m) && u++
      }
      return {
        selector: t,
        records: e,
        exactQuantities: O(n),
        ranges: r.filter(function(t, e, n) {
          return n.indexOf(t) === e
        }),
        discounts: O(i),
        fullRewardCount: u,
        allConditionsExact: e.length > 0 && e.every(function(t) {
          return null !== h(t)
        })
      }
    }), P = Q.filter(function(t) {
      return t.fullRewardCount > 0
    }).sort(function(t, e) {
      return e.fullRewardCount - t.fullRewardCount
    })[0] || null, C = Q.filter(function(t) {
      return !P || t.selector.id !== P.selector.id
    }).sort(function(t, e) {
      function n(t) {
        return (t.records.length === a.length ? 100 : 0) + (t.allConditionsExact ? 50 : 0) + 10 * t.exactQuantities.length
      }
      return n(e) - n(t)
    })[0] || null, L = Q.filter(function(t) {
      return !(P && t.selector.id === P.selector.id || C && t.selector.id === C.selector.id)
    }), I = L.filter(function(t) {
      return t.ranges.length > 1 || t.discounts.length > 1
    }).sort(function(t, e) {
      return 10 * e.ranges.length + e.discounts.length - (10 * t.ranges.length + t.discounts.length)
    })[0] || null, E = L.filter(function(t) {
      return !I || t.selector.id !== I.selector.id
    }), {
      primary: C ? C.selector : null,
      gift: P ? P.selector : null,
      volume: I ? I.selector : null,
      optional: E.map(function(t) {
        return t.selector
      })
    }),
    j = function(t, e) {
      if (!t) return [];
      for (var n = {}, r = 0; r < a.length; r++) {
        var i = a[r],
          s = h(g(i, t.id));
        if (!(null === s || s <= 0) && (n[s] || (n[s] = {
            quantity: s,
            percentages: [],
            fixedAmounts: [],
            fixedModes: [],
            giftQuantities: []
          }), n[s].percentages.push(x(i, t.id)), function() {
            var e = A(i, t.id);
            n[s].fixedAmounts.push(e.amount), n[s].fixedModes.push(e.mode)
          }(), e && M(x(i, e.id)))) {
          var o = h(g(i, e.id));
          if (null === o)
            for (var l = i.rewardSet && i.rewardSet.rewards ? i.rewardSet.rewards : [], c = 0; c < l.length; c++) {
              var m = l[c];
              if (m && Array.isArray(m.appliesTo) && m.appliesTo.some(function(t) {
                  return t && t.selectorId === e.id
                }) && null !== u(m.quantity)) {
                o = u(m.quantity);
                break
              }
            }
          null !== o && n[s].giftQuantities.push(o)
        }
      }
      return Object.keys(n).map(function(t) {
        var e = n[t],
          r = N(e.fixedAmounts, 0),
          a = N(e.fixedModes, "TOTAL");
        return {
          quantity: e.quantity,
          percentage: N(e.percentages, 0),
          fixed: {
            amount: Number(r) || 0,
            mode: a || "TOTAL"
          },
          giftQuantity: N(e.giftQuantities, 0)
        }
      }).sort(function(t, e) {
        return t.quantity - e.quantity
      })
    }(D.primary, D.gift),
    R = function(t) {
      if (!t) return [];
      for (var e = 0, n = 0; n < a.length; n++) {
        var r = g(a[n], t.id);
        if (r) {
          var i = v(r);
          Number.isFinite(i.maximum) ? e = Math.max(e, i.maximum) : Number.isFinite(i.minimum) && (e = Math.max(e, i.minimum))
        }
      }
      for (var u = [], s = 1; s <= e; s++) {
        for (var o = [], l = [], c = [], m = 0; m < a.length; m++)
          if (_(g(a[m], t.id), s)) {
            o.push(x(a[m], t.id));
            var d = A(a[m], t.id);
            l.push(d.amount), c.push(d.mode)
          } o.length && u.push({
          quantity: s,
          percentage: N(o, 0),
          fixed: {
            amount: Number(N(l, 0)) || 0,
            mode: N(c, "TOTAL") || "TOTAL"
          }
        })
      }
      return u
    }(D.volume);

  function U(t) {
    var e = o(D.primary),
      n = o(D.gift),
      r = l(D.primary),
      a = l(D.gift),
      u = c(r, e),
      s = c(a, n),
      p = u ? u.currencyCode : m(),
      f = T(t.quantity, u && Number(u.priceAmount) || 0, t.percentage, t.fixed),
      b = !(!e || e.quantity !== t.quantity || D.gift && (n ? n.quantity : 0) !== t.giftQuantity),
      g = !y(r, e, t.quantity) || t.giftQuantity > 0 && !y(a, n, t.giftQuantity),
      v = s ? (Number(s.priceAmount) || 0) * t.giftQuantity : 0;
    return '<button class="kb-tier' + (b ? " is-selected" : "") + (t.giftQuantity > 0 ? " kb-tier--gift" : "") + '" type="button" aria-pressed="' + (b ? "true" : "false") + '"' + (g ? " disabled" : "") + ">" + (2 === t.quantity || 4 === t.quantity ? '<span class="kb-float-badge">' + i(2 === t.quantity ? "BackOrder Sale | Most Popular" : "BackOrder Sale | Most Savings") + "</span>" : "") + '<input type="hidden" data-nameless-qty-selector="' + i(D.primary.id) + '" value="' + t.quantity + '">' + (D.gift ? '<input type="hidden" data-nameless-qty-selector="' + i(D.gift.id) + '" value="' + t.giftQuantity + '">' : "") + '<span class="kb-tier__main"><span class="kb-tier__body"><span class="kb-radio" aria-hidden="true"></span><span class="kb-tier__copy"><span class="kb-tier__title">' + i({
      1: "1x Single",
      2: "2x Partner",
      3: "3x Family",
      4: "4x Family Plus"
    } [t.quantity] || t.quantity + "x Bundle") + '</span><span class="kb-tier__desc">' + function(t) {
      return ({
        1: ["1x Original Memory Foam", "1x Original Pillowcase"],
        2: ["2x Original Memory Foam", "2x Original Pillowcases"],
        3: ["3x Original Memory Foam", "3x Original Pillowcases"],
        4: ["4x Original Memory Foam", "4x Original Pillowcases"]
      } [t] || [t + "x Original Memory Foam", t + " Original Pillowcases"]).map(function(t) {
        return "<span>" + i(t) + "</span>"
      }).join("")
    }(t.quantity) + '</span></span></span><span class="kb-tier__prices"><span class="kb-tier__discounted"><strong>' + d(f.final, p) + "</strong><small>/ea</small></span><s>" + d(f.base, p) + "</s></span></span>" + (t.giftQuantity > 0 ? '<span class="kb-gift-strip"><span class="kb-gift-strip__title">' + i(1 === t.giftQuantity ? "1 Extra Original Pillowcase" : t.giftQuantity + " Extra Original Pillowcases") + '</span><span class="kb-gift-strip__price"><s>' + d(v, s ? s.currencyCode : p) + "</s> <strong>Free</strong></span></span>" : "") + "</button>"
  }

  function H(t) {
    var e = o(D.volume),
      n = l(D.volume),
      r = c(n, e),
      a = r ? r.currencyCode : m(),
      u = r && Number(r.priceAmount) || 0,
      s = T(t.quantity, u, t.percentage, t.fixed),
      f = !!e && e.quantity === t.quantity,
      b = !y(n, e, t.quantity);
    return '<button class="kb-addon-card' + (f ? " is-selected" : "") + '" type="button" data-nameless-qty-selector="' + i(D.volume.id) + '" value="' + t.quantity + '" aria-pressed="' + (f ? "true" : "false") + '"' + (b ? " disabled" : "") + '><span class="kb-addon-card__top"><span class="kb-radio" aria-hidden="true"></span>' + p(n, r, "kb-addon-card__image") + '</span><span class="kb-addon-card__qty">' + t.quantity + 'x</span><strong class="kb-addon-card__price">' + d(s.final, a) + '/ea</strong><s class="kb-addon-card__compare">' + d(s.base, a) + "</s>" + (2 === t.quantity || 4 === t.quantity ? '<span class="kb-addon-badge">' + i(2 === t.quantity ? "Most Popular" : "Most Savings") + "</span>" : "") + "</button>"
  }
  n.innerHTML = '<div class="kb-widget">' + function() {
      if (!D.primary || !l(D.primary) || !j.length) return "";
      var t = o(D.primary),
        e = l(D.primary);
      return w("BackOrder Sale | Bundle & Save") + '<div class="kb-tier-list">' + j.map(U).join("") + f(D.primary, e, t, !1) + "</div>"
    }() + function() {
      if (!D.volume || !l(D.volume) || !R.length) return "";
      var t = o(D.volume),
        e = l(D.volume);
      return w("Extra Pillowcases") + '<div class="kb-addon-grid">' + R.map(H).join("") + "</div>" + f(D.volume, e, t, !1)
    }() + ((B = D.optional.filter(function(t) {
      return !!l(t)
    })).length ? w("Discounts Unlocked") + B.map(function(t) {
      var e = o(t),
        n = l(t),
        r = c(n, e),
        u = r ? r.currencyCode : m(),
        s = r && Number(r.priceAmount) || 0,
        y = !!e && e.quantity > 0,
        b = function(t) {
          if (!t) return 1;
          for (var e = [], n = 0; n < a.length; n++) {
            var r = v(g(a[n], t.id));
            Number.isFinite(r.maximum) && r.maximum >= 1 && e.push(r.maximum)
          }
          return Math.max(1, Math.floor(N(e, 1)))
        }(t),
        h = r && null !== r.inventoryQuantity ? Math.max(0, Math.floor(r.inventoryQuantity)) : b,
        q = Math.min(b, h),
        k = F(t),
        S = Math.max(1, Math.min(q || 1, y ? Math.floor(e.quantity) : k || 1)),
        M = function(t, e) {
          if (!t) return {
            percentage: 0,
            fixed: {
              amount: 0,
              mode: "TOTAL"
            }
          };
          for (var n = [], r = [], i = [], u = 0; u < a.length; u++)
            if (_(g(a[u], t.id), e)) {
              n.push(x(a[u], t.id));
              var s = A(a[u], t.id);
              r.push(s.amount), i.push(s.mode)
            } return {
            percentage: N(n, 0),
            fixed: {
              amount: Number(N(r, 0)) || 0,
              mode: N(i, "TOTAL") || "TOTAL"
            }
          }
        }(t, S),
        O = T(S, s, M.percentage, M.fixed),
        w = !r || !r.available || q < 1;
      return '<div class="kb-complete' + (y ? " is-selected" : "") + (n && n.variants && n.variants.length > 1 ? " has-variant" : "") + '"><label class="kb-complete__toggle"><input class="kb-complete__checkbox" type="checkbox" data-nameless-qty-selector="' + i(t.id) + '"' + (y ? " checked" : "") + (w ? " disabled" : "") + '><span class="kb-check" aria-hidden="true"></span>' + p(n, r, "kb-complete__image") + '<span class="kb-complete__copy"><span class="kb-complete__title"><span class="kb-complete__title-line">' + i("COVE Sleep") + '</span><span class="kb-complete__title-line">' + i("EyeMask") + '</span></span><span class="kb-complete__badge">Lowest Price</span></span></label>' + f(t, n, e, !0) + '<div class="kb-complete__qty" aria-label="Quantity"><input class="kb-complete__qty-input" type="number" min="1" max="' + q + '" step="1" value="' + S + '" tabindex="-1" aria-hidden="true" data-nameless-qty-selector="' + i(t.id) + '"><button class="kb-complete__qty-button" type="button" aria-label="Decrease quantity" data-nameless-qty-selector="' + i(t.id) + '" value="' + Math.max(1, S - 1) + '"' + (!y || w || S <= 1 ? " disabled" : "") + '>&minus;</button><span class="kb-complete__qty-value">' + S + '</span><button class="kb-complete__qty-button" type="button" aria-label="Increase quantity" data-nameless-qty-selector="' + i(t.id) + '" value="' + Math.min(q || 1, S + 1) + '"' + (!y || w || S >= q ? " disabled" : "") + '>+</button></div><span class="kb-complete__prices"><strong>' + d(O.final, u) + "/ea</strong><s>" + d(O.base, u) + "</s></span></div>"
    }).join("") : "") + '<button class="kb-atc" type="button" data-nameless-atc="' + i(e.bundleId) + '"' + (function() {
      for (var t = 0; t < r.length; t++) {
        var n = e.selections[r[t].id];
        if (Array.isArray(n)) {
          for (var a = 0; a < n.length; a++)
            if (n[a] && n[a].quantity > 0 && n[a].soldOut) return !0
        } else if (n && n.quantity > 0 && n.soldOut) return !0
      }
      return !1
    }() ? " disabled" : "") + ">Add To Cart</button></div>",
    function() {
      var t = n.closest("[data-nameless-block]") || n;

      function e(t) {
        t && !t.closest("[data-nameless-block]") && (t.style.setProperty("display", "none", "important"), t.setAttribute("aria-hidden", "true"), t.setAttribute("data-nameless-hidden-theme-atc", "true"))
      }

      function r() {
        var n = document.querySelector("product-form.product-form") || document.querySelector("product-form"),
          r = n && n.querySelector(".product-form__buttons") || document.querySelector(".product-form__buttons"),
          a = n && n.querySelector('form[action*="/cart/add"]') || document.querySelector('form[action*="/cart/add"]'),
          i = r && (r.querySelector('button[name="add"]') || r.querySelector(".product-form__submit") || r.querySelector('button[type="submit"]')) || document.querySelector('product-form button[name="add"], .product-form__submit, form[action*="/cart/add"] button[name="add"]'),
          u = r || a || i;
        if (t && u && u.parentNode && t !== u && (t.parentNode !== u.parentNode || t.nextSibling !== u) && u.parentNode.insertBefore(t, u), r) e(r);
        else {
          i && e(i);
          var s = a && a.querySelector(".shopify-payment-button") || document.querySelector('product-form .shopify-payment-button, [data-shopify="payment-button"]');
          s && e(s)
        }
      }
      t && t.parentNode && (r(), "function" == typeof requestAnimationFrame && requestAnimationFrame(function() {
        r(), requestAnimationFrame(r)
      }), setTimeout(r, 0), setTimeout(r, 100), setTimeout(r, 400))
    }()
});