window.nameless.defineRenderer(function(e) {
  var t = e.snapshot || {},
    r = e.container,
    n = t.selectors || [],
    a = t.conditionSets || [],
    i = t.meta || {};
  if (r) {
    for (var l = document.querySelector("[data-nameless-app-embed][data-product-id]") || document.querySelector("[data-nameless-block][data-product-id]") || r && r.closest("[data-product-id]") || null, u = l ? P(l.getAttribute("data-product-id")) : "", o = function(e, t) {
        for (var r = [], n = 0; n < e.length; n++)(E(e[n], t) || O(e[n]) || e[n].product) && r.push(e[n]);
        if (!r.length) return e[0] || null;
        if (t) {
          for (var a = 0; a < r.length; a++) {
            var i = E(r[a], t);
            if (i && F(i.id, t)) return r[a]
          }
          for (var l = 0; l < r.length; l++)
            if (O(r[l])) return r[l]
        }
        return r[0]
      }(n, u), s = E(o, u) || (o ? {
        id: u ? "gid://shopify/Product/" + u : "gid://shopify/Product/preview",
        title: "Preview",
        variants: [{
          id: "gid://shopify/ProductVariant/preview",
          title: "Default Title",
          available: !0,
          priceAmount: Number(i.previewPrice) || 24.95,
          currencyCode: L()
        }]
      } : null), d = o && O(o) && s ? ' data-nameless-product-id="' + k(s.id) + '"' : "", c = function(e, r) {
        if (!e) return null;
        var n = t.selections && t.selections[e.id];
        if (!n) return null;
        if (Array.isArray(n)) {
          if (!r) return null;
          for (var a = 0; a < n.length; a++)
            if (n[a] && F(n[a].productId, r.id)) return n[a];
          return null
        }
        return n.productId && r && !F(n.productId, r.id) ? null : n
      }(o, s), f = R(s, c), p = f && Number(f.priceAmount) || 0, v = f && f.currencyCode || L(), m = function(e) {
        if (!e) return [];
        for (var t = {}, r = 0; r < a.length; r++) {
          var n = a[r],
            i = V(n, e.id);
          if (i) {
            var l = C(i.minimum),
              u = C(i.maximum);
            if (!(null === l || l <= 0)) {
              var o = null === u || u > l,
                s = o ? "open:" + l : "exact:" + l;
              t[s] || (t[s] = {
                quantity: l,
                min: l,
                max: o ? u : l,
                open: o,
                percentage: Q(n, e.id),
                fixed: Z(n, e.id)
              })
            }
          }
        }
        for (var d = Object.keys(t).map(function(e) {
            return t[e]
          }).sort(function(e, t) {
            return e.min - t.min
          }), c = 0; c < d.length; c++) c === d.length - 1 ? (d[c].open = !0, d[c].max = null) : (d[c].open = !1, d[c].max = d[c].min, d[c].quantity = d[c].min);
        return d
      }(o), b = c && "number" == typeof c.quantity ? c.quantity : 0, y = i.title || "Buy more, save more", g = null, h = 0; h < m.length; h++)
      if (B(m[h], b, m, h)) {
        g = m[h];
        break
      }! g && m.length && (g = m[m.length - 1]);
    var w = g && b > 0 ? b : g ? g.min : 1,
      _ = g ? j(w, p, g.percentage, g.fixed) : null,
      S = g && _ ? function(e, t) {
        return e.percentage > 0 ? Math.round(e.percentage) : t.final < t.base - .001 ? Math.round((t.base - t.final) / t.base * 100) : 0
      }(g, _) : 0,
      x = i.atcLabel ? k(i.atcLabel) : "Buy " + k(w) + (S > 0 ? ' | save <span class="money">' + k(S) + "%</span>" : ""),
      q = i.buyNowLabel || "Buy it now",
      N = !1 !== i.allowSoldOut,
      T = !N && !!(c && c.soldOut && b > 0),
      A = !0 !== i.hideBuyNow;
    r.innerHTML = '<div class="rw-widget">' + (o && s && m.length ? '<div class="rw-heading"><div class="rw-heading__title"><span>' + k(y) + '</span></div><div class="rw-heading__rule" aria-hidden="true"></div></div><div class="rw-tier-list">' + m.map(function(e, t) {
        return function(e, t) {
          var r, n, a, l, u = t === m.length - 1,
            f = j(B(e, b, m, t) && b > 0 ? b : e.min, p, e.percentage, e.fixed),
            y = B(e, b, m, t),
            g = !(N || (r = s, n = c, a = e.min, l = R(r, n), l && l.available && (null === l.inventoryQuantity || void 0 === l.inventoryQuantity || l.inventoryQuantity >= a))),
            h = function(e, t) {
              var r = i.tierBadges || i.badges || null;
              if (r) {
                if (null != r[e.min]) return String(r[e.min]);
                if (null != r[String(e.min)]) return String(r[String(e.min)])
              }
              var n = null != i.badgeSuffix ? i.badgeSuffix : " + FREE SHIPPING";
              if (e.percentage > 0) return "Save " + Math.round(e.percentage) + "%" + n;
              var a = t.baseTotal - t.finalTotal;
              return a > .005 ? "Save " + M(a, v) + n : ""
            }(e, j(e.min, p, e.percentage, e.fixed)),
            w = function(e, t) {
              return t < 2 ? "" : e === t - 1 ? i.lastRibbon || "Best Value" : 1 === e ? i.midRibbon || "Best Seller" : ""
            }(t, m.length),
            _ = f.finalTotal < f.baseTotal - .001,
            S = y && u && b >= e.min ? b : e.min,
            x = y && u,
            q = "rw-tier-" + k(o.id) + "-" + e.min;
          return '<div class="rw-tier' + (y ? " is-selected" : "") + (w ? " has-ribbon" : "") + '">' + (w ? '<div class="rw-ribbon" aria-hidden="true"><svg class="rw-ribbon__arch" xmlns="http://www.w3.org/2000/svg" width="8" height="22" viewBox="0 0 8 22" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M8 0V22H8C3.5 22 0 16.5 0 11C0 5.5 3.5 0 8 0Z" fill="var(--rbr__fill-badge)"></path><path d="M8 0V22H8C3.5 22 0 16.5 0 11C0 5.5 3.5 0 8 0Z" fill="black" opacity="0.18"></path></svg><span class="rw-ribbon__label">' + k(w) + '</span><svg class="rw-ribbon__arch" xmlns="http://www.w3.org/2000/svg" width="8" height="22" viewBox="0 0 8 22" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0V22H0C4.5 22 8 16.5 8 11C8 5.5 4.5 0 0 0Z" fill="var(--rbr__fill-badge)"></path><path d="M0 0V22H0C4.5 22 8 16.5 8 11C8 5.5 4.5 0 0 0Z" fill="black" opacity="0.18"></path></svg></div>' : "") + '<button class="rw-tier__main" type="button" data-nameless-qty-selector="' + k(o.id) + '"' + d + ' value="' + S + '" aria-pressed="' + (y ? "true" : "false") + '"' + (g ? " disabled" : "") + '><span class="rw-radio" aria-hidden="true"><input type="radio" id="' + q + '" tabindex="-1" readonly' + (y ? " checked" : "") + (y ? ' style="cursor: not-allowed"' : "") + '></span><span class="rw-tier__copy"><span>' + k(function(e, t, r) {
            var n = Number(e.min) || 1;
            if (i.tierTitles && null != i.tierTitles[n]) return String(i.tierTitles[n]);
            var a = C(i.unitsPerKit);
            (null === a || a <= 0) && (a = 4);
            var l = i.unitLabel || "balls",
              u = i.kitLabel || "tube",
              o = i.kitLabelPlural || "tubes",
              s = n * a;
            return t === r - 1 && r >= 2 ? "Buy an " + n + " " + (i.lastTierKitLabel || "tube box") + " (" + s + " " + l + ")" : "Buy " + n + " " + (1 === n ? u : o) + " (" + s + " " + l + ")"
          }(e, t, m.length)) + "</span>" + (h ? '<span class="rw-tier__badge"><span>' + k(h) + "</span></span>" : "") + '</span><span class="rw-tier__prices">' + (_ ? '<span class="rw-visually-hidden">Sale price</span>' : "") + '<span class="rw-tier__price money">' + k(M(f.finalTotal, v)) + "</span>" + (_ ? '<span class="rw-visually-hidden">Regular price</span><span class="rw-tier__compare money">' + k(M(f.baseTotal, v)) + "</span>" : "") + "</span></button>" + (x ? '<div class="rw-divider" aria-hidden="true"></div>' + function(e) {
            var t = e.min,
              r = b >= t ? b : t,
              n = Math.max(t, r - 1),
              a = r + 1,
              l = r <= t;
            return '<div class="rw-qty" data-rw-qty><div class="rw-qty__title"><span>' + k(i.qtyLabel || "Quantity") + '</span></div><div class="rw-qty__controls"><button class="rw-qty__btn' + (l ? " is-disabled" : "") + '" type="button" data-nameless-qty-selector="' + k(o.id) + '"' + d + ' value="' + k(n) + '" aria-label="Decrease quantity"' + (l ? " disabled" : "") + '>-</button><div class="rw-qty__value" aria-live="polite">' + k(r) + '</div><button class="rw-qty__btn" type="button" data-nameless-qty-selector="' + k(o.id) + '"' + d + ' value="' + k(a) + '" aria-label="Increase quantity">+</button></div></div>'
          }(e) : "") + "</div>"
        }(e, t)
      }).join("") + "</div>" + function() {
        if (!o || !s) return "";
        var e = s.variants || [];
        if (!e.length) return "";
        for (var t = c && c.variantId || "", r = "", n = 0; n < e.length; n++) {
          var a = e[n];
          r += '<option value="' + k(a.id) + '"' + (a.id === t ? " selected" : "") + (a.available ? "" : " disabled") + ">" + k(a.title) + "</option>"
        }
        return '<select class="rw-variant-bridge" tabindex="-1" aria-hidden="true" data-nameless-variant-selector="' + k(o.id) + '"' + d + ">" + r + "</select>"
      }() + '<div class="rw-actions"><button class="rw-atc" type="button" data-nameless-atc="' + k(t.bundleId) + '"' + (T ? " disabled" : "") + "><span>" + x + "</span></button>" + (A ? '<button class="rw-buynow" type="button" data-rw-buynow' + (T ? " disabled" : "") + ">" + k(q) + "</button>" : "") + "</div>" : "") + "</div>",
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
          var t = document.querySelector("form .product-add-to-cart-container");
          t && t.parentNode && (e === t || e.parentNode === t.parentNode && e.nextSibling === t || t.parentNode.insertBefore(e, t), t.closest("[data-nameless-block]") || (t.style.setProperty("display", "none", "important"), t.setAttribute("aria-hidden", "true"), t.setAttribute("data-nameless-hidden-theme-atc", "true")))
        }
        e && e.parentNode && (t(), "function" == typeof requestAnimationFrame && requestAnimationFrame(function() {
          t(), requestAnimationFrame(t)
        }), setTimeout(t, 0), setTimeout(t, 100), setTimeout(t, 400))
      }()
  }

  function B(e, t, r, n) {
    if (!(t > 0)) return !1;
    if (!e.open) return t === e.quantity;
    var a = r[n + 1];
    return a ? t >= e.min && t < a.min : t >= e.min
  }

  function k(e) {
    return String(null == e ? "" : e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function C(e) {
    var t = Number(e);
    return Number.isFinite(t) ? t : null
  }

  function I(e) {
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

  function P(e) {
    var t = String(e || ""),
      r = t.match(/(\d+)$/);
    return r ? r[1] : t
  }

  function F(e, t) {
    return !(!e || !t) && (e === t || P(e) === P(t) || String(e).endsWith("/" + P(t)) || String(t).endsWith("/" + P(e)))
  }

  function O(e) {
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
    if (O(e)) {
      var r = function(e, t) {
        var r = e || [],
          n = P(t);
        if (!r.length) return null;
        if (n)
          for (var a = 0; a < r.length; a++)
            if (r[a] && F(r[a].id, n)) return r[a];
        for (var i = 0; i < r.length; i++) {
          var l = R(r[i], null);
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

  function R(e, t) {
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

  function H(e, t) {
    var r = Array.isArray(e.appliesTo) ? e.appliesTo : [];
    return !r.length || r.some(function(e) {
      return e && e.selectorId === t
    })
  }

  function V(e, t) {
    for (var r = (e && Array.isArray(e.conditions) ? e.conditions : []) || [], n = null, a = 0; a < r.length; a++) {
      var i = r[a];
      if (i && "quantity" === i.type) {
        n || (n = i);
        var l = (Array.isArray(i.satisfiesFor) ? i.satisfiesFor : []).map(function(e) {
          return e && e.selectorId
        }).filter(Boolean);
        if (!l.length || -1 !== l.indexOf(t)) return i
      }
    }
    return n
  }

  function Q(e, t) {
    for (var r = D(e), n = 0, a = 0; a < r.length; a++) {
      var i = r[a];
      i && "percentageDiscount" === i.type && H(i, t) && (n += Number(i.percentage) || 0)
    }
    return Math.min(n, 100)
  }

  function Z(e, t) {
    for (var r = D(e), n = 0, a = "TOTAL", i = 0; i < r.length; i++) {
      var l = r[i];
      l && "fixedDiscount" === l.type && H(l, t) && (n += Number(l.amount) || 0, l.mode && (a = String(l.mode)))
    }
    return {
      amount: n,
      mode: a
    }
  }

  function j(e, t, r, n) {
    var a = Math.max(1, Number(e) || 1),
      i = Number(t) || 0,
      l = Number(r) || 0,
      u = n && Number(n.amount) > 0 ? Number(n.amount) : 0,
      o = n && n.mode ? String(n.mode) : "TOTAL",
      s = i * (1 - l / 100) * a,
      d = 0;
    u > 0 && (d = "PER_UNIT" === o ? Math.min(u * a, s) : Math.min(u, s));
    var c = Math.max(0, s - d);
    return {
      base: I(i),
      final: I(c / a),
      baseTotal: I(i * a),
      finalTotal: I(c)
    }
  }
});
