window.nameless.defineRenderer(function(e) {
  var t = e.snapshot,
    n = e.container,
    a = t.selectors || [],
    r = t.conditionSets || [],
    i = t.meta || {},
    s = ["1 Kit (10 Fitas)", "2 Kits (20 Fitas)", "3 Kits (30 fitas)"],
    l = ["R$ 109,90", "R$ 97,45", "R$ 93,30"],
    u = ["", "R$ 109,90", "R$ 109,90"],
    o = ["", "Mais Vendido 🔥", "Melhor Oferta 🩵"],
    d = ["", "10% OFF + FRETE GRÁTIS", "15% OFF + FRETE GRÁTIS"];

  function c(e) {
    return String(null == e ? "" : e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function f(e) {
    var t = Number(e);
    return Number.isFinite(t) ? t : null
  }

  function v(e) {
    return Math.round(100 * (Number(e) || 0)) / 100
  }

  function p() {
    return t.totals && t.totals.currencyCode || "BRL"
  }

  function m(e, t) {
    var n = Number(e) || 0,
      a = t || p(),
      r = "BRL" === a ? "pt-BR" : void 0;
    try {
      return new Intl.NumberFormat(r, {
        style: "currency",
        currency: a,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(n)
    } catch (e) {
      return "R$ " + n.toFixed(2).replace(".", ",")
    }
  }

  function h(e) {
    return e ? "productSingle" === e.kind ? e.product : "collectionSingle" === e.kind ? e.resolvedProduct : e.product || null : null
  }

  function b(e, t) {
    var n = e && e.variants || [];
    if (!n.length) return null;
    if (t)
      for (var a = 0; a < n.length; a++)
        if (n[a].id === t.variantId) return n[a];
    for (var r = 0; r < n.length; r++)
      if (n[r].available) return n[r];
    return n[0]
  }

  function g(e) {
    return e && e.rewardSet && Array.isArray(e.rewardSet.rewards) ? e.rewardSet.rewards : []
  }

  function y(e, t) {
    return (Array.isArray(e.appliesTo) ? e.appliesTo : []).some(function(e) {
      return e && e.selectorId === t
    })
  }

  function _(e, t) {
    for (var n = (e && Array.isArray(e.conditions) ? e.conditions : []) || [], a = 0; a < n.length; a++) {
      var r = n[a];
      if (r && "quantity" === r.type && -1 !== (Array.isArray(r.satisfiesFor) ? r.satisfiesFor : []).map(function(e) {
          return e && e.selectorId
        }).filter(Boolean).indexOf(t)) return r
    }
    return null
  }

  function A(e) {
    var t = f(e && e.minimum),
      n = f(e && e.maximum);
    return null === t || null === n ? null : t === n ? t : null
  }

  function q(e, t) {
    var n, a = g(e),
      r = 0;
    for (n = 0; n < a.length; n++) {
      var i = a[n];
      i && "percentageDiscount" === i.type && y(i, t) && (r += Number(i.percentage) || 0)
    }
    return Math.min(r, 100)
  }

  function S(e, t) {
    var n, a = g(e),
      r = 0,
      i = "TOTAL";
    for (n = 0; n < a.length; n++) {
      var s = a[n];
      s && "fixedDiscount" === s.type && y(s, t) && (r += Number(s.amount) || 0, s.mode && (i = String(s.mode)))
    }
    return {
      amount: r,
      mode: i
    }
  }

  function w(e) {
    var t, n = Number(e) || 1;
    return n + " " + (1 === n ? "Kit" : 2 === n ? "Kits" : "kits") + " (" + n * ((t = f(i.unitsPerKit)) && t > 0 ? t : 14) + " " + (i.unitLabel || "Fitas") + ")"
  }
  var N = function() {
      var e, t = n.closest("[data-nameless-block]") || n,
        r = t && t.getAttribute("data-product-id") || "",
        i = r ? 0 === r.indexOf("gid://") ? r : "gid://shopify/Product/" + r : "",
        s = [];
      for (e = 0; e < a.length; e++) h(a[e]) && s.push(a[e]);
      if (!s.length) return null;
      if (i)
        for (e = 0; e < s.length; e++) {
          var l = h(s[e]);
          if (l && (l.id === i || String(l.id).endsWith("/" + r))) return s[e]
        }
      return s[0]
    }(),
    x = h(N),
    F = function(e) {
      if (!e) return null;
      var n = t.selections[e.id];
      return n && !Array.isArray(n) ? n : null
    }(N),
    R = b(x, F),
    T = R && Number(R.priceAmount) || 0,
    L = R && R.currencyCode || p(),
    M = function(e) {
      if (!e) return [];
      var t, n = {};
      for (t = 0; t < r.length; t++) {
        var a = r[t],
          i = A(_(a, e.id));
        null === i || i <= 0 || n[i] || (n[i] = {
          quantity: i,
          percentage: q(a, e.id),
          fixed: S(a, e.id)
        })
      }
      return Object.keys(n).map(function(e) {
        return n[e]
      }).sort(function(e, t) {
        return e.quantity - t.quantity
      })
    }(N),
    H = function(e) {
      var t = e && e.variants || [];
      if (t.length <= 1) return !1;
      for (var n = 0; n < t.length; n++)
        if (t[n].title && "Default Title" !== t[n].title) return !0;
      return !1
    }(x),
    O = F && "number" == typeof F.quantity ? F.quantity : 0,
    I = !!n.__feVariantsHidden;

  function V(e) {
    var t, a = x && x.variants || [],
      r = n.__feSlots[e] || "",
      s = '<option value="">' + c(i.variantPlaceholder || "Select variant") + "</option>";
    for (t = 0; t < a.length; t++) {
      var l = a[t];
      l && "Default Title" !== l.title && (s += '<option value="' + c(l.id) + '"' + (l.id === r ? " selected" : "") + (l.available ? "" : " disabled") + ">" + c(l.title) + "</option>")
    }
    return '<select class="fe-slot__select" data-fe-slot="' + e + '">' + s + "</select>"
  }

  function k(e) {
    if (!H || e < 1) return "";
    var t, n = "";
    for (t = 0; t < e; t++) n += '<div class="fe-slot"><span class="fe-slot__index">#' + (t + 1) + "</span>" + V(t) + "</div>";
    return '<div class="fe-variants' + (I ? " is-hidden" : "") + '" data-fe-variants><div class="fe-variants__head"><span class="fe-variants__title">' + c(i.variantsTitle || "Variants") + '</span><button class="fe-variants__toggle" type="button" data-fe-toggle>' + (I ? "Show" : "Hide") + '</button></div><div class="fe-variants__body"' + (I ? " hidden" : "") + ">" + n + "</div>" + function() {
      if (!N || !x || !H) return "";
      var e, t = x.variants || [],
        n = F && F.variantId || "",
        a = "";
      for (e = 0; e < t.length; e++) {
        var r = t[e];
        a += '<option value="' + c(r.id) + '"' + (r.id === n ? " selected" : "") + (r.available ? "" : " disabled") + ">" + c(r.title) + "</option>"
      }
      return '<select class="fe-variant-bridge" tabindex="-1" aria-hidden="true" data-nameless-variant-selector="' + c(N.id) + '">' + a + "</select>"
    }() + "</div>"
  }! function() {
    var e, t = n.__feSlots || [],
      a = [];
    for (e = 0; e < Math.max(O, 1); e++) a.push(t[e] || "");
    n.__feSlots = a
  }();
  var E = i.title || "⏳ Preço de Lançamento ⏳",
    D = function() {
      for (var e = 0; e < a.length; e++) {
        var n = t.selections[a[e].id];
        if (Array.isArray(n)) {
          for (var r = 0; r < n.length; r++)
            if (n[r] && n[r].quantity > 0 && n[r].soldOut) return !0
        } else if (n && n.quantity > 0 && n.soldOut) return !0
      }
      return !1
    }(),
    P = !!i.atcOverride,
    B = i.atcLabel || "ADICIONAR AO CARRINHO";
  n.innerHTML = '<div class="fe-widget">' + (N && x && M.length ? '<div class="fe-heading"><span class="fe-heading__rule" aria-hidden="true"></span><h2 class="fe-heading__title">' + c(E) + '</h2><span class="fe-heading__rule" aria-hidden="true"></span></div><div class="fe-tier-list">' + M.map(function(e, t) {
      return function(e, t) {
        var n, a = function(e, t, n, a) {
            var r = Math.max(1, Number(e) || 1),
              i = Number(t) || 0,
              s = Number(n) || 0,
              l = a && Number(a.amount) > 0 ? Number(a.amount) : 0,
              u = a && a.mode ? String(a.mode) : "TOTAL",
              o = i * (1 - s / 100) * r,
              d = 0;
            return l > 0 && (d = "PER_UNIT" === u ? Math.min(l * r, o) : Math.min(l, o)), {
              base: v(i),
              final: v(Math.max(0, o - d) / r),
              baseTotal: v(i * r),
              finalTotal: v(Math.max(0, o - d))
            }
          }(e.quantity, T, e.percentage, e.fixed),
          r = !(!F || F.quantity !== e.quantity),
          i = ! function(e, t, n) {
            var a = b(e, t);
            return !(!a || !a.available) && (null === a.inventoryQuantity || void 0 === a.inventoryQuantity || a.inventoryQuantity >= n)
          }(x, F, e.quantity),
          f = d[t] || "",
          p = o[t] || "",
          h = !(!u[t] || !u[t].length),
          g = "fe-tier-" + c(N.id) + "-" + e.quantity;
        return '<div class="fe-tier' + (r ? " is-selected" : "") + (p ? " has-ribbon" : "") + '">' + (p ? '<div class="fe-ribbon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" preserveAspectRatio="none"><path d="M8 0L0 8H8V0Z" fill="var(--rbr__fill-badge)"></path><path d="M8 0L0 8H8V0Z" fill="black" opacity="0.2"></path></svg><span class="fe-ribbon__label">' + c(p) + '</span><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" preserveAspectRatio="none"><path d="M0 0L8 8H0V0Z" fill="var(--rbr__fill-badge)"></path><path d="M0 0L8 8H0V0Z" fill="black" opacity="0.2"></path></svg></div>' : "") + '<button class="fe-tier__main" type="button" data-nameless-qty-selector="' + c(N.id) + '" value="' + e.quantity + '" aria-pressed="' + (r ? "true" : "false") + '"' + (i ? " disabled" : "") + '><span class="fe-radio" aria-hidden="true"><input type="radio" id="' + g + '" tabindex="-1" readonly' + (r ? " checked" : "") + '></span><span class="fe-tier__copy"><span class="fe-tier__title">' + c(null != s[t] ? s[t] : w(e.quantity)) + "</span>" + (f ? '<span class="fe-tier__badge">' + c(f) + "</span>" : "") + '</span><span class="fe-tier__prices"><span class="fe-tier__price">' + c(null != l[t] ? l[t] : m(a.final, L)) + '<span class="fe-tier__each">/un.</span></span>' + (h ? '<span class="fe-tier__compare">' + c(u[t] || m(a.base, L)) + "</span>" : "") + "</span></button>" + (r && (n = k(e.quantity)) ? '<div class="fe-divider" aria-hidden="true"></div>' + n : "") + "</div>"
      }(e, t)
    }).join("") + "</div>" : "") + (P ? "" : '<button class="fe-atc" type="button" data-nameless-atc="' + c(t.bundleId) + '"' + (D ? " disabled" : "") + ">" + c(B) + "</button>") + "</div>",
    function() {
      var e = n.querySelector(".fe-widget");
      if (e) {
        var t = e.querySelector("[data-fe-toggle]");
        t && t.addEventListener("click", function(a) {
          a.preventDefault(), a.stopPropagation(), n.__feVariantsHidden = !n.__feVariantsHidden;
          var r = e.querySelector("[data-fe-variants]"),
            i = r && r.querySelector(".fe-variants__body");
          r && i && (n.__feVariantsHidden ? r.classList.add("is-hidden") : r.classList.remove("is-hidden"), n.__feVariantsHidden ? i.setAttribute("hidden", "") : i.removeAttribute("hidden"), t.textContent = n.__feVariantsHidden ? "Show" : "Hide")
        }), e.addEventListener("change", function(t) {
          var a = t.target;
          if (a && a.getAttribute && a.hasAttribute("data-fe-slot")) {
            var r = Number(a.getAttribute("data-fe-slot"));
            Number.isFinite(r) && (n.__feSlots[r] = a.value, function(t) {
              var a = e.querySelector(".fe-variant-bridge");
              if (a) {
                var r = n.__feSlots[t];
                r && a.value !== r && (a.value = r, a.dispatchEvent(new Event("change", {
                  bubbles: !0
                })))
              }
            }(r))
          }
        })
      }
    }(),
    function() {
      var e = n.closest("[data-nameless-block]") || n;

      function t() {
        var t = document.querySelector("product-buy-buttons-element");
        t && t.parentNode && (e && e !== t && (e.parentNode !== t.parentNode || e.nextSibling !== t) && t.parentNode.insertBefore(e, t), P || function(e) {
          e && !e.closest("[data-nameless-block]") && (e.style.setProperty("display", "none", "important"), e.setAttribute("aria-hidden", "true"), e.setAttribute("data-nameless-hidden-theme-atc", "true"))
        }(t))
      }
      e && e.parentNode && (t(), "function" == typeof requestAnimationFrame && requestAnimationFrame(function() {
        t(), requestAnimationFrame(t)
      }), setTimeout(t, 0), setTimeout(t, 100), setTimeout(t, 400))
    }()
});