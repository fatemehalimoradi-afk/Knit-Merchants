window.nameless.defineRenderer(function(e) {
  var t = e.snapshot || {},
    r = e.container,
    n = t.selectors || [],
    a = t.conditionSets || [],
    i = t.meta || {};
  if (r) {
    r.closest("[data-nameless-block]");
    var l, u, o, s = (o = document.querySelector("[data-nameless-app-embed][data-product-id]") || document.querySelector("[data-nameless-block][data-product-id]") || r && r.closest("[data-product-id]") || null) ? I(o.getAttribute("data-product-id")) : "",
      d = function() {
        var e, t = [];
        for (e = 0; e < n.length; e++)(E(n[e], s) || F(n[e]) || n[e].product) && t.push(n[e]);
        if (!t.length) return n[0] || null;
        if (s) {
          for (e = 0; e < t.length; e++) {
            var r = E(t[e], s);
            if (r && P(r.id, s)) return t[e]
          }
          for (e = 0; e < t.length; e++)
            if (F(t[e])) return t[e]
        }
        return t[0]
      }(),
      c = E(d, s) || (d ? {
        id: (u = s) ? "gid://shopify/Product/" + u : "gid://shopify/Product/preview",
        title: "Preview",
        variants: [{
          id: "gid://shopify/ProductVariant/preview",
          title: "Default Title",
          available: !0,
          priceAmount: Number(i.previewPrice) || 24.95,
          currencyCode: L()
        }]
      } : null),
      f = d && F(d) && c ? ' data-nameless-product-id="' + k(c.id) + '"' : "",
      p = function(e, r) {
        if (!e) return null;
        var n = t.selections && t.selections[e.id];
        if (!n) return null;
        if (Array.isArray(n)) {
          if (!r) return null;
          for (var a = 0; a < n.length; a++)
            if (n[a] && P(n[a].productId, r.id)) return n[a];
          return null
        }
        return n.productId && r && !P(n.productId, r.id) ? null : n
      }(d, c),
      v = O(c, p),
      m = v && Number(v.priceAmount) || 0,
      b = v && v.currencyCode || L(),
      y = function(e) {
        if (!e) return [];
        var t, r = {};
        for (t = 0; t < a.length; t++) {
          var n = a[t],
            i = R(n, e.id);
          if (i) {
            var l = B(i.minimum),
              u = B(i.maximum);
            if (!(null === l || l <= 0)) {
              var o = null === u || u > l,
                s = o ? "open:" + l : "exact:" + l;
              r[s] || (r[s] = {
                quantity: l,
                min: l,
                max: o ? u : l,
                open: o,
                percentage: H(n, e.id),
                fixed: Q(n, e.id)
              })
            }
          }
        }
        for (var d = Object.keys(r).map(function(e) {
            return r[e]
          }).sort(function(e, t) {
            return e.min - t.min
          }), c = 0; c < d.length; c++) c === d.length - 1 ? (d[c].open = !0, d[c].max = null) : (d[c].open = !1, d[c].max = d[c].min, d[c].quantity = d[c].min);
        return d
      }(d),
      h = p && "number" == typeof p.quantity ? p.quantity : 0,
      g = i.heading || "Buy more, Save more",
      w = null;
    for (l = 0; l < y.length; l++)
      if (j(y[l], h, y, l)) {
        w = y[l];
        break
      }! w && y.length && (w = h > 0 ? y[y.length - 1] : y[0]);
    var _ = w && h > 0 ? h : w ? w.min : 1,
      q = w ? Z(_, m, w.percentage, w.fixed) : null,
      x = w && q ? function(e, t) {
        return e.percentage > 0 ? Math.round(e.percentage) : t.final < t.base - .001 ? Math.round((t.base - t.final) / t.base * 100) : 0
      }(w, q) : 0,
      Y = !!(w && y.length && w === y[y.length - 1] && h >= w.min),
      T = U(c) || !!(p && p.soldOut),
      S = T ? k(i.soldOutLabel || "Sold out") : Y ? "Buy " + k(_) + (x > 0 ? ' | save <span class="money">' + k(x) + "%</span>" : "") : k(i.atcLabel || "Add to cart"),
      N = i.buyNowLabel || "Buy it now",
      A = !T && !0 === i.showBuyNow;
    r.innerHTML = '<div class="rw-widget">' + (d && c && y.length ? '<div class="rw-heading"><div class="rw-heading__title"><span>' + k(g) + '</span></div><div class="rw-heading__rule" aria-hidden="true"></div></div>' + (T ? '<div class="rw-soldout" role="status"><span>' + k(i.soldOutMessage || "The product is sold out") + "</span></div>" : "") + '<div class="rw-tier-list">' + y.map(function(e, t) {
        return function(e, t) {
          var r = t === y.length - 1,
            n = Z(j(e, h, y, t) && h > 0 ? h : e.min, m, e.percentage, e.fixed),
            a = !T && (j(e, h, y, t) || h <= 0 && 0 === t),
            u = function(e, t, r, n) {
              var a = i.tierBadges || i.badges || null,
                l = e.min;
              if (a) {
                if (null != a[l]) return String(a[l]);
                if (null != a[String(l)]) return String(a[String(l)]);
                if (null != a[r]) return String(a[r])
              }
              return n < 2 ? "" : 1 === r ? i.midTierBadge || "SAVE 10%" : r === n - 1 ? i.lastTierBadge || "SAVE 25% + FREE SHIPPING" : ""
            }(e, 0, t, y.length),
            o = function(e, t) {
              return t < 2 ? "" : e === t - 1 ? i.popularLabel || "Most Popular" : ""
            }(t, y.length),
            s = n.finalTotal < n.baseTotal - .001,
            v = a && r && h >= e.min ? h : e.min,
            g = a && r;
          return '<div class="rw-tier' + (a ? " is-selected" : "") + (o ? " has-ribbon" : "") + '">' + (o ? '<div class="rw-ribbon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M8 0L0 8H8V0Z" fill="var(--rbr__fill-badge)"></path><path d="M8 0L0 8H8V0Z" fill="black" opacity="0.2"></path></svg><span class="rw-ribbon__label">' + k(o) + '</span><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M0 0L8 8H0V0Z" fill="var(--rbr__fill-badge)"></path><path d="M0 0L8 8H0V0Z" fill="black" opacity="0.2"></path></svg></div>' : "") + '<button class="rw-tier__main' + (a ? " is-selected" : "") + '" type="button" data-nameless-qty-selector="' + k(d.id) + '"' + f + ' value="' + v + '" aria-pressed="' + (a ? "true" : "false") + '"><span class="rw-radio" aria-hidden="true"></span><span class="rw-tier__copy' + (r ? " rw-tier__copy--stack" : "") + '"><span>' + k(function(e, t, r) {
            var n = Number(e) || 1;
            if (i.tierTitles && i.tierTitles[n]) return String(i.tierTitles[n]);
            var a = B(i.unitsPerKit);
            (null === a || a <= 0) && (a = 3);
            var l = i.unitLabel || "balls",
              u = i.kitLabel || "tube",
              o = i.kitLabelPlural || "tubes",
              s = n * a,
              d = 1 === n ? u : o;
            return t === r - 1 && r >= 2 ? s + " " + (i.lastTierBoxLabel || "ball box") + " (" + n + " " + o + ")" : s + " " + l + " (" + n + " " + d + ")"
          }(e.min, t, y.length)) + "</span>" + (u ? '<span class="rw-tier__badge"><span>' + k(u) + "</span></span>" : "") + '</span><span class="rw-tier__prices">' + (s ? '<span class="rw-visually-hidden">Sale price</span>' : "") + '<span class="rw-tier__price money">' + k(M(n.finalTotal, b)) + "</span>" + (s ? '<span class="rw-visually-hidden">Regular price</span><span class="rw-tier__compare money">' + k(M(n.baseTotal, b)) + "</span>" : "") + "</span></button>" + (g ? '<div class="rw-divider" aria-hidden="true"></div>' + function(e) {
            var t = e.min,
              r = h >= t ? h : t,
              n = Math.max(t, r - 1),
              a = r + 1,
              l = r <= t;
            return '<div class="rw-qty" data-rw-qty><div class="rw-qty__title"><span>' + k(i.qtyLabel || "Quantity") + '</span></div><div class="rw-qty__controls"><button class="rw-qty__btn' + (l ? " is-disabled" : "") + '" type="button" data-nameless-qty-selector="' + k(d.id) + '"' + f + ' value="' + k(n) + '" aria-label="Decrease quantity"' + (l ? " disabled" : "") + '>-</button><div class="rw-qty__value" aria-live="polite">' + k(r) + '</div><button class="rw-qty__btn" type="button" data-nameless-qty-selector="' + k(d.id) + '"' + f + ' value="' + k(a) + '" aria-label="Increase quantity">+</button></div></div>'
          }(e) : "") + "</div>"
        }(e, t)
      }).join("") + "</div>" + function() {
        if (!d || !c) return "";
        var e, t = c.variants || [],
          r = p && p.variantId || "",
          n = "";
        if (!t.length) return "";
        for (e = 0; e < t.length; e++) {
          var a = t[e];
          n += '<option value="' + k(a.id) + '"' + (a.id === r ? " selected" : "") + (a.available ? "" : " disabled") + ">" + k(a.title) + "</option>"
        }
        return '<select class="rw-variant-bridge" tabindex="-1" aria-hidden="true" data-nameless-variant-selector="' + k(d.id) + '"' + f + ">" + n + "</select>"
      }() + '<div class="rw-actions"><button class="rw-atc' + (T ? " is-soldout" : "") + '" type="button" data-nameless-atc="' + k(t.bundleId) + '"' + (T ? " disabled" : "") + "><span>" + S + "</span></button>" + (A ? '<button class="rw-buynow" type="button" data-rw-buynow' + (T ? " disabled" : "") + ">" + k(N) + "</button>" : "") + "</div>" : "") + "</div>",
      function() {
        var e = r.querySelector(".rw-widget");
        if (e) {
          var t = e.querySelector("[data-rw-buynow]");
          t && t.addEventListener("click", function(n) {
            if (n.preventDefault(), n.stopPropagation(), !t.disabled) {
              var a = e.querySelector("[data-nameless-atc]");
              if (a && !a.disabled) {
                r.__rwBuyNow = !0, a.click();
                var i = 0,
                  l = setInterval(function() {
                    i += 1, (-1 !== (a.textContent || "").toLowerCase().indexOf("added") || i > 50) && (clearInterval(l), r.__rwBuyNow && (r.__rwBuyNow = !1, window.location.href = "/checkout"))
                  }, 100)
              }
            }
          });
          if (!T && h <= 0 && !r.__rwDefaultTier) {
            var a = e.querySelector(".rw-tier__main");
            a && !a.disabled && (r.__rwDefaultTier = !0, a.click())
          }
          var n = e.querySelector("[data-nameless-atc]");
          n && n.addEventListener("click", function() {
            if (!r.__rwBuyNow) var e = 0,
              t = setInterval(function() {
                e += 1;
                var a = -1 !== (n.textContent || "").toLowerCase().indexOf("added");
                (a || e > 50) && (clearInterval(t), a && !r.__rwBuyNow && function() {
                  document.documentElement.dispatchEvent(new CustomEvent("cart:refresh", {
                    bubbles: !0
                  }));
                  var e = document.querySelector('a[href*="/cart"]');
                  setTimeout(function() {
                    e && e.click()
                  }, 100)
                }())
              }, 100)
          })
        }
      }(),
      function() {
        var e = r.closest("[data-nameless-block]") || r;

        function t() {
          var t, r = document.querySelector("form .product-add-to-cart-container");
          r && r.parentNode && (e && e !== r && (e.parentNode !== r.parentNode || e.nextSibling !== r) && r.parentNode.insertBefore(e, r), (t = r) && !t.closest("[data-nameless-block]") && (t.style.setProperty("display", "none", "important"), t.setAttribute("aria-hidden", "true"), t.setAttribute("data-nameless-hidden-theme-atc", "true")))
        }
        e && e.parentNode && (t(), "function" == typeof requestAnimationFrame && requestAnimationFrame(function() {
          t(), requestAnimationFrame(t)
        }), setTimeout(t, 0), setTimeout(t, 100), setTimeout(t, 400))
      }()
  }

  function k(e) {
    return String(null == e ? "" : e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function B(e) {
    var t = Number(e);
    return Number.isFinite(t) ? t : null
  }

  function C(e) {
    return Math.round(100 * (Number(e) || 0)) / 100
  }

  function L() {
    return t.totals && t.totals.currencyCode || "EUR"
  }

  function M(e, t) {
    var r = Number(e) || 0,
      n = t || L();
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: n,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(r)
    } catch (e) {
      return "£" + r.toFixed(2)
    }
  }

  function I(e) {
    var t = String(e || ""),
      r = t.match(/(\d+)$/);
    return r ? r[1] : t
  }

  function P(e, t) {
    return !(!e || !t) && (e === t || I(e) === I(t) || String(e).endsWith("/" + I(t)) || String(t).endsWith("/" + I(e)))
  }

  function F(e) {
    if (!e) return !1;
    if ("collectionMulti" === e.kind) return !0;
    if ("collectionSingle" === e.kind) return !0;
    if (e.collection) return !0;
    var t = String(e.type || e.itemType || "").toLowerCase();
    return -1 !== t.indexOf("collection") || -1 !== t.indexOf("multi")
  }

  function E(e, t) {
    if (!e) return null;
    if ("productSingle" === e.kind) return e.product || null;
    if (F(e)) {
      var r = function(e, t) {
        var r = e || [],
          n = I(t);
        if (!r.length) return null;
        if (n)
          for (var a = 0; a < r.length; a++)
            if (r[a] && P(r[a].id, n)) return r[a];
        for (var i = 0; i < r.length; i++) {
          var l = O(r[i], null);
          if (l && l.available) return r[i]
        }
        return r[0]
      }(function(e) {
        if (!e) return [];
        var t = e.collection;
        return t && t.products && t.products.length ? t.products : t && t.references && t.references.nodes && t.references.nodes.length ? t.references.nodes : e.products && e.products.length ? e.products : e.resolvedProduct ? [e.resolvedProduct] : e.product ? [e.product] : []
      }(e), t);
      return r || e.resolvedProduct || e.product || null
    }
    return e.product || e.resolvedProduct || null
  }

  function U(e) {
    if (!e) return !1;
    if (!1 === e.available) return !0;
    var t = e.variants || [];
    if (!t.length) return !1;
    for (var r = 0; r < t.length; r++)
      if (t[r] && t[r].available) return !1;
    return !0
  }

  function O(e, t) {
    var r = e && e.variants || [];
    if (!r.length) return null;
    if (t)
      for (var n = 0; n < r.length; n++)
        if (r[n].id === t.variantId) return r[n];
    for (var a = 0; a < r.length; a++)
      if (r[a].available) return r[a];
    return r[0]
  }

  function D(e) {
    return e && e.rewardSet && Array.isArray(e.rewardSet.rewards) ? e.rewardSet.rewards : []
  }

  function V(e, t) {
    var r = Array.isArray(e.appliesTo) ? e.appliesTo : [];
    return !r.length || r.some(function(e) {
      return e && e.selectorId === t
    })
  }

  function R(e, t) {
    var r, n = (e && Array.isArray(e.conditions) ? e.conditions : []) || [],
      a = null;
    for (r = 0; r < n.length; r++) {
      var i = n[r];
      if (i && "quantity" === i.type) {
        a || (a = i);
        var l = (Array.isArray(i.satisfiesFor) ? i.satisfiesFor : []).map(function(e) {
          return e && e.selectorId
        }).filter(Boolean);
        if (!l.length || -1 !== l.indexOf(t)) return i
      }
    }
    return a
  }

  function H(e, t) {
    var r, n = D(e),
      a = 0;
    for (r = 0; r < n.length; r++) {
      var i = n[r];
      i && "percentageDiscount" === i.type && V(i, t) && (a += Number(i.percentage) || 0)
    }
    return Math.min(a, 100)
  }

  function Q(e, t) {
    var r, n = D(e),
      a = 0,
      i = "TOTAL";
    for (r = 0; r < n.length; r++) {
      var l = n[r];
      l && "fixedDiscount" === l.type && V(l, t) && (a += Number(l.amount) || 0, l.mode && (i = String(l.mode)))
    }
    return {
      amount: a,
      mode: i
    }
  }

  function Z(e, t, r, n) {
    var a = Math.max(1, Number(e) || 1),
      i = Number(t) || 0,
      l = Number(r) || 0,
      u = n && Number(n.amount) > 0 ? Number(n.amount) : 0,
      o = n && n.mode ? String(n.mode) : "TOTAL",
      s = i * (1 - l / 100) * a,
      d = 0;
    return u > 0 && (d = "PER_UNIT" === o ? Math.min(u * a, s) : Math.min(u, s)), {
      base: C(i),
      final: C(Math.max(0, s - d) / a),
      baseTotal: C(i * a),
      finalTotal: C(Math.max(0, s - d))
    }
  }

  function j(e, t, r, n) {
    if (!(t > 0)) return !1;
    if (!e.open) return t === e.quantity;
    var a = r[n + 1];
    return a ? t >= e.min && t < a.min : t >= e.min
  }
});
