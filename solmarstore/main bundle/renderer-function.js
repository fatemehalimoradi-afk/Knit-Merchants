window.nameless.defineRenderer(function(t) {
  var e = t.snapshot || {},
    r = t.container,
    n = e.selectors || [],
    a = e.conditionSets || [],
    i = e.meta || {},
    l = e.selections || {};
  if (r) {
    var s, o = function() {
        var t, e = [];
        for (t = 0; t < a.length; t++) {
          var r, n = a[t],
            i = z(n),
            l = 0;
          for (r = 0; r < i.length; r++) l += L(n, i[r].id);
          !i.length || l <= 0 || e.push({
            cs: n,
            index: t,
            selectors: i,
            quantity: l,
            percentage: O(n, i[0].id),
            fixed: P(n, i[0].id)
          })
        }
        return e.sort(function(t, e) {
          return t.quantity - e.quantity
        })
      }(),
      u = 0;
    for (s = 0; s < o.length; s++)
      if (U(o[s].cs)) {
        u = s;
        break
      } if (!o.length || !U(o[u] && o[u].cs))
      for (u = 0, s = 0; s < o.length; s++) R(o[s].cs) && (u = s);
    var c = o[u] || null,
      d = x(),
      f = !!(c && R(c.cs) && e.totals),
      v = e.totals || {},
      b = "",
      p = "",
      m = i.title || "",
      g = !1;
    if (c && c.selectors[0]) {
      var h = F(c.selectors[0]),
        y = C(h, M(c.selectors[0]));
      b = h && h.title || "", p = y && Number(y.priceAmount) > 0 ? w(y.priceAmount, y.currencyCode || d) : ""
    }
    for (s = 0; s < n.length; s++) {
      var _ = l[n[s].id];
      if (_ && !Array.isArray(_) && _.quantity > 0 && _.soldOut) {
        g = !0;
        break
      }
    }
    var A, S = '<div class="nb-bundle">';
    for (b && (S += '<div class="nb-bundle__product"><div class="nb-bundle__product-title">' + q(b) + "</div>" + (p ? '<div class="nb-bundle__product-price">' + q(p) + "</div>" : "") + "</div>"), m && (S += '<h3 class="nb-bundle__title">' + q(m) + "</h3>"), i.subtitle && (S += '<p class="nb-bundle__subtitle">' + q(i.subtitle) + "</p>"), S += '<div class="nb-tiers">', s = 0; s < o.length; s++) S += V(o[s], s);
    S += "</div>", i.atcOverride || (S += '<button class="nb-atc" type="button" data-nameless-atc="' + q(e.bundleId) + '"' + (g ? " disabled" : "") + ">Add to cart</button>"), S += "</div>", r.innerHTML = S;
    try {
      (A = r.querySelector(".nb-bundle")) && "1" !== A.getAttribute("data-nb-sync") && (A.setAttribute("data-nb-sync", "1"), A.addEventListener("change", function(t) {
        var e = t.target;
        if (e && e.getAttribute && e.hasAttribute("data-nb-option")) {
          var r = e.getAttribute("data-nb-slot");
          if (r) {
            var a = A.querySelector('[data-nb-slot-row="' + r + '"]'),
              i = A.querySelector('[data-nb-bridge="' + r + '"]');
            if (a && i) {
              var l, s = a.querySelectorAll("[data-nb-option]"),
                o = [];
              for (l = 0; l < s.length; l++) o.push(s[l].value);
              var u = r.split("-").slice(0, -1).join("-"),
                c = i.getAttribute("data-nameless-variant-selector");
              c && (u = c);
              var d = null;
              for (l = 0; l < n.length; l++)
                if (n[l].id === u) {
                  d = n[l];
                  break
                } var f = function(t, e) {
                var r, n = t && t.variants || [],
                  a = e.join(" / ");
                for (r = 0; r < n.length; r++)
                  if ((n[r].title || "") === a) return n[r];
                for (r = 0; r < n.length; r++) {
                  var i, l = E(n[r]),
                    s = !0;
                  for (i = 0; i < e.length; i++)
                    if (l[i] !== e[i]) {
                      s = !1;
                      break
                    } if (s) return n[r]
                }
                return null
              }(F(d), o);
              f && (i.value = f.id, i.hasAttribute("data-nameless-variant-selector") && i.dispatchEvent(new Event("change", {
                bubbles: !0
              })))
            }
          }
        }
      }))
    } catch (t) {}
    try {
      ! function() {
        var t = r.closest && r.closest("[data-nameless-block]") || r;

        function e() {
          try {
            var e = document.querySelector(".main-product__details-wrapper[data-product-details]") || document.querySelector("[data-product-details]") || document.querySelector(".main-product__details-wrapper") || document.querySelector(".main-product__details");
            if (!e || !t || t === e) return;
            if (t.contains && t.contains(e)) return;
            var r = e.querySelector(".main-product__actions");
            if (r && r.parentNode && !t.contains(r)) {
              if (t.parentNode === r.parentNode && t.nextSibling === r) return;
              return void r.parentNode.insertBefore(t, r)
            }
            var n = e.querySelector("product-selector.main-product__selector") || e.querySelector("product-selector") || e.querySelector(".main-product__selector");
            if (n && n.parentNode && !t.contains(n)) {
              if (t.parentNode === n.parentNode && t.previousSibling === n) return;
              return void n.parentNode.insertBefore(t, n.nextSibling)
            }
            t.parentNode !== e && e.appendChild(t)
          } catch (t) {}
        }
        t && t.parentNode && document && "function" == typeof document.querySelector && (t.classList && t.classList.add("nb-mount"), e(), "function" == typeof requestAnimationFrame && requestAnimationFrame(function() {
          e(), requestAnimationFrame(e)
        }), setTimeout(e, 0), setTimeout(e, 100), setTimeout(e, 400), setTimeout(e, 1e3))
      }()
    } catch (t) {}
  }

  function q(t) {
    return String(null == t ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function N(t) {
    var e = Number(t);
    return "number" == typeof e && isFinite(e) ? e : null
  }

  function T(t) {
    return Math.round(100 * (Number(t) || 0)) / 100
  }

  function x() {
    if (e.totals && e.totals.currencyCode) return e.totals.currencyCode;
    for (var t = 0; t < n.length; t++) {
      var r = F(n[t]);
      if (r && r.variants && r.variants[0] && r.variants[0].currencyCode) return r.variants[0].currencyCode
    }
    return "GBP"
  }

  function w(t, e) {
    var r = Number(t) || 0,
      n = e || x();
    try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: n,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(r)
    } catch (t) {
      return n + " " + r.toFixed(2)
    }
  }

  function F(t) {
    return t ? "productSingle" === t.kind ? t.product : "collectionSingle" === t.kind ? t.resolvedProduct : null : null
  }

  function M(t) {
    if (!t) return null;
    var e = l[t.id];
    return e && !Array.isArray(e) ? e : null
  }

  function k(t) {
    var e = l[t.id];
    if (!e) return 0;
    if (Array.isArray(e)) {
      var r, n = 0;
      for (r = 0; r < e.length; r++) e[r] && "number" == typeof e[r].quantity && (n += e[r].quantity);
      return n
    }
    return "number" == typeof e.quantity ? e.quantity : 0
  }

  function C(t, e) {
    var r = t && t.variants || [];
    if (!r.length) return null;
    if (e)
      for (var n = 0; n < r.length; n++)
        if (r[n].id === e.variantId) return r[n];
    for (var a = 0; a < r.length; a++)
      if (r[a].available) return r[a];
    return r[0]
  }

  function D(t) {
    return t && t.rewardSet && Array.isArray(t.rewardSet.rewards) ? t.rewardSet.rewards : []
  }

  function I(t, e) {
    for (var r = Array.isArray(t.appliesTo) ? t.appliesTo : [], n = 0; n < r.length; n++)
      if (r[n] && r[n].selectorId === e) return !0;
    return !1
  }

  function L(t, e) {
    var r = function(t, e) {
      for (var r = (t && Array.isArray(t.conditions) ? t.conditions : []) || [], n = 0; n < r.length; n++) {
        var a = r[n];
        if (a && "quantity" === a.type)
          for (var i = Array.isArray(a.satisfiesFor) ? a.satisfiesFor : [], l = 0; l < i.length; l++)
            if (i[l] && i[l].selectorId === e) return a
      }
      return null
    }(t, e);
    if (!r) return 0;
    var n = N(r.minimum);
    return N(r.maximum), null !== n && n > 0 ? n : 0
  }

  function O(t, e) {
    var r, n = D(t),
      a = 0;
    for (r = 0; r < n.length; r++) {
      var i = n[r];
      i && "percentageDiscount" === i.type && I(i, e) && (a += Number(i.percentage) || 0)
    }
    return Math.min(a, 100)
  }

  function P(t, e) {
    var r, n = D(t),
      a = 0,
      i = "TOTAL";
    for (r = 0; r < n.length; r++) {
      var l = n[r];
      l && "fixedDiscount" === l.type && I(l, e) && (a += Number(l.amount) || 0, l.mode && (i = String(l.mode)))
    }
    return {
      amount: a,
      mode: i
    }
  }

  function B(t) {
    var e, r, n = t && t.variants || [],
      a = [];
    for (e = 0; e < n.length; e++) {
      var l = n[e].title || "";
      if (l && "Default Title" !== l) {
        var s = l.split(/\s*\/\s*/);
        for (r = 0; r < s.length; r++) a[r] || (a[r] = []), -1 === a[r].indexOf(s[r]) && a[r].push(s[r])
      }
    }
    if (!a.length) return [];
    var o = function(t) {
        var e, r = Array.isArray(i.optionNames) ? i.optionNames : null,
          n = ["Size", "Color", "Option"],
          a = [];
        for (e = 0; e < t; e++) a.push(r && r[e] || n[e] || "Option " + (e + 1));
        return a
      }(a.length),
      u = [];
    for (e = 0; e < a.length; e++) a[e].length <= 1 && 1 === a.length || u.push({
      name: o[e],
      values: a[e]
    });
    return u
  }

  function E(t) {
    return t && t.title && "Default Title" !== t.title ? String(t.title).split(/\s*\/\s*/) : []
  }

  function j(t) {
    if (!t || "quantity" !== t.type) return !1;
    var e = N(t.minimum),
      r = N(t.maximum),
      a = null !== e,
      i = null !== r;
    if (!a && !i) return !1;
    if (a && i && e > r) return !1;
    for (var l = i && !a, s = Array.isArray(t.satisfiesFor) ? t.satisfiesFor : [], o = 0; o < s.length; o++) {
      var u = s[o] && s[o].selectorId;
      if (!u) return !1;
      var c, d = null;
      for (c = 0; c < n.length; c++)
        if (n[c].id === u) {
          d = n[c];
          break
        } var f = d ? k(d) : 0;
      if (f <= 0) {
        if (!l) return !1
      } else {
        if (a && f < e) return !1;
        if (i && f > r) return !1
      }
    }
    return !0
  }

  function R(t) {
    var e = (t && Array.isArray(t.conditions) ? t.conditions : []) || [];
    if (!e.length) return !1;
    for (var r = 0; r < e.length; r++)
      if (!j(e[r])) return !1;
    return !0
  }

  function z(t) {
    var e, r = [];
    for (e = 0; e < n.length; e++) {
      var a = n[e];
      F(a) && L(t, a.id) > 0 && r.push(a)
    }
    return r
  }

  function G(t) {
    var e = C(F(t), M(t));
    return e && Number(e.priceAmount) || 0
  }

  function H(t, e, r) {
    var n = F(t),
      a = M(t);
    return n ? '<div class="nb-var" data-nb-slot-row="' + q(t.id) + "-" + e + '"><span class="nb-var__num">#' + (e + 1) + '</span><div class="nb-var__options">' + function(t, e, r, n, a) {
      var i, l, s = B(e),
        o = C(e, r),
        u = E(o),
        c = "",
        d = t.id + "-" + n,
        f = e.variants || [],
        v = o && o.id || "",
        b = "";
      for (l = 0; l < f.length; l++) {
        var p = f[l];
        b += '<option value="' + q(p.id) + '"' + (p.id === v ? " selected" : "") + (p.available ? "" : " disabled") + ">" + q(p.title) + "</option>"
      }
      if (c += a ? '<select class="nb-var__bridge" hidden tabindex="-1" aria-hidden="true" data-nameless-variant-selector="' + q(t.id) + '" data-nb-bridge="' + q(d) + '">' + b + "</select>" : '<select class="nb-var__bridge" hidden tabindex="-1" aria-hidden="true" data-nb-bridge="' + q(d) + '">' + b + "</select>", s.length >= 2) {
        for (i = 0; i < s.length; i++) {
          var m = s[i],
            g = u[i] || m.values[0] || "",
            h = "";
          for (y = 0; y < m.values.length; y++) h += '<option value="' + q(m.values[y]) + '"' + (m.values[y] === g ? " selected" : "") + ">" + q(m.values[y]) + "</option>";
          c += '<select class="nb-var__select" data-nb-option data-nb-axis="' + i + '" data-nb-slot="' + q(d) + '" aria-label="' + q(m.name) + '">' + h + "</select>"
        }
        return c
      }
      var y, _ = "";
      for (y = 0; y < f.length; y++) {
        var A = f[y],
          S = "Default Title" === A.title ? e.title : A.title;
        _ += '<option value="' + q(A.id) + '"' + (A.id === v ? " selected" : "") + (A.available ? "" : " disabled") + ">" + q(S) + (A.available ? "" : " (sold out)") + "</option>"
      }
      return c + (a ? '<select class="nb-var__select" data-nameless-variant-selector="' + q(t.id) + '">' + _ + "</select>" : '<select class="nb-var__select">' + _ + "</select>")
    }(t, n, a, e, !1 !== r) + "</div></div>" : ""
  }

  function U(t) {
    if (!t) return !1;
    var e;
    for (e = 0; e < n.length; e++)
      if (k(n[e]) !== L(t, n[e].id)) return !1;
    return !0
  }

  function V(t, e) {
    var r = function(t) {
        if (!t.length) return 0;
        var e, r = 0;
        for (e = 0; e < t.length; e++) r += G(t[e]);
        return r / t.length
      }(t.selectors),
      a = function(t, e, r, n) {
        var a = Math.max(1, Number(t) || 1),
          i = Number(e) || 0,
          l = Number(r) || 0,
          s = n && Number(n.amount) > 0 ? Number(n.amount) : 0,
          o = n && n.mode ? String(n.mode) : "TOTAL",
          u = i * (1 - l / 100) * a,
          c = 0;
        s > 0 && (c = "PER_UNIT" === o ? Math.min(s * a, u) : Math.min(s, u));
        var d = Math.max(0, u - c);
        return {
          baseTotal: T(i * a),
          finalTotal: T(d)
        }
      }(t.quantity, r, t.percentage, t.fixed),
      l = e === u,
      s = 0;
    t.percentage > 0 ? s = Math.round(t.percentage) : a.finalTotal < a.baseTotal - .001 && (s = Math.round((a.baseTotal - a.finalTotal) / a.baseTotal * 100));
    var o, c = s > 0 ? "Save " + s + "%" : i.basePriceLabel || "Standard Price",
      b = s > 0 ? "nb-tier__badge" : "nb-tier__badge is-neutral",
      p = a.finalTotal < a.baseTotal - .001,
      m = l && f && "number" == typeof v.subtotal ? v.subtotal : a.finalTotal,
      g = l && f && "number" == typeof v.baseSubtotal ? v.baseSubtotal : a.baseTotal,
      h = "";
    if (l) {
      for (h += '<div class="nb-variants"><div class="nb-variants__head">Variants</div><div class="nb-variants__list">', o = 0; o < t.selectors.length; o++) h += H(t.selectors[o], o, !0);
      h += "</div></div>"
    }
    return '<div class="nb-tier' + (l ? " is-selected" : "") + '"><button class="nb-tier__main" type="button" aria-pressed="' + (l ? "true" : "false") + '"><span class="nb-tier__radio" aria-hidden="true"></span><span class="nb-tier__copy"><span class="nb-tier__title">' + q((i.tierPrefix || "Buy") + " " + t.quantity) + '</span><span class="' + b + '">' + q(c) + '</span></span><span class="nb-tier__prices"><span class="nb-tier__price">' + q(w(m, d)) + "</span>" + (p || l && g > m + .001 ? '<span class="nb-tier__compare">' + q(w(g, d)) + "</span>" : "") + "</span>" + function(t) {
      var e, r = "";
      for (e = 0; e < n.length; e++) r += '<input type="hidden" data-nameless-qty-selector="' + q(n[e].id) + '" value="' + q(L(t, n[e].id)) + '">';
      return r
    }(t.cs) + "</button>" + h + "</div>"
  }
});