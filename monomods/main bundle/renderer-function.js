window.nameless.defineRenderer(function(e) {
  var t = '[id*="product-form-main-"]',
    r = e && e.container;
  if (r) {
    var n = e && e.snapshot,
      i = n && n.selectors || [],
      a = n && n.conditionSets || [],
      o = function() {
        var e = "__namelessCartDrawerBridge",
          t = "X-Nameless-Internal";
        if ("undefined" == typeof window) return null;
        if (window[e]) return window[e];
        var r = 0,
          n = 0;

        function i() {
          var e = Date.now();
          if (!(e - r < 400)) {
            r = e;
            try {
              document.documentElement.dispatchEvent(new CustomEvent("cart:refresh", {
                bubbles: !0
              }))
            } catch (e) {}
            try {
              (t = document.querySelector('a[href="/cart"]') || document.querySelector('a[href^="/cart?"]') || document.querySelector('a[href$="/cart"]')) && t.click()
            } catch (e) {}
            var t
          }
        }

        function a(e) {
          return e > 0 && Date.now() - e < 4e3
        }

        function o(e) {
          return !(!e || "function" != typeof e.getAttribute) && -1 !== String(e.getAttribute("action") || "").indexOf("/cart/add")
        }
        document.documentElement.addEventListener("submit", function(e) {
          e.__namelessReachedHtml = !0
        }, !0), window.addEventListener("submit", function(e) {
          o(e.target) && setTimeout(function() {
            e.defaultPrevented && !e.__namelessReachedHtml && (n = Date.now())
          }, 0)
        }, !0);
        var u = window.fetch;
        "function" == typeof u && (window.fetch = function(e, r) {
          var o = "string" == typeof e ? e : e && e.url || "",
            c = "POST" === (r && r.method || e && e.method || "GET").toUpperCase() && function(e) {
              return /\/cart\/add(\.js)?($|\?)/.test(String(e || "").split("#")[0])
            }(o),
            l = c && function(e, r) {
              var n = r && r.headers || e && e.headers;
              if (!n) return !1;
              try {
                if ("function" == typeof n.get) return "1" === n.get(t);
                if (Array.isArray(n)) {
                  for (var i = 0; i < n.length; i++)
                    if (n[i] && String(n[i][0]).toLowerCase() === t.toLowerCase()) return "1" === n[i][1];
                  return !1
                }
                for (var a in n)
                  if (a.toLowerCase() === t.toLowerCase()) return "1" === n[a]
              } catch (e) {}
              return !1
            }(e, r),
            d = u.apply(this, arguments);
          return c && d && "function" == typeof d.then ? d.then(function(e) {
            return e && e.ok ? (i(), l && a(n) ? (n = 0, new Promise(function() {})) : e) : e
          }) : d
        });
        var c = {
          getSectionsToRender: function() {
            return []
          },
          setActiveElement: function() {},
          renderContents: function() {
            i()
          },
          open: function() {
            i()
          },
          querySelector: function() {
            return null
          },
          classList: {
            contains: function() {
              return !1
            },
            add: function() {},
            remove: function() {}
          }
        };

        function l() {
          for (var e = document.querySelectorAll("product-form"), t = 0; t < e.length; t++) e[t].cart || (e[t].cart = c)
        }
        if (window.HTMLFormElement && window.HTMLFormElement.prototype) {
          var d = window.HTMLFormElement.prototype.submit;
          window.HTMLFormElement.prototype.submit = function() {
            if (!a(r) || !o(this)) return d.apply(this, arguments);
            console.warn("[nameless] blocked a native cart-add submit right after an add")
          }
        }
        return window.addEventListener("beforeunload", function() {
          a(r) && console.warn("[nameless] the page is navigating right after a cart add. A theme script is doing it with a hardcoded cart URL (e.g. window.location = '/cart'), which cannot be intercepted from the bundle asset — remove it in the theme.")
        }), window[e] = {
          adoptProductForms: l,
          refreshAndOpen: i
        }, l(), window[e]
      }();
    if (o && o.adoptProductForms(), function() {
        var e = r.closest("[data-nameless-block]") || r,
          n = function(e) {
            for (var r = document.querySelectorAll(t), n = null, i = 0; i < r.length; i++) {
              var a = r[i];
              if (a.parentNode && a !== e && !e.contains(a)) {
                if (-1 !== ("function" == typeof a.getAttribute && a.getAttribute("action") || "").indexOf("/cart/add")) return a;
                if (a.querySelector && a.querySelector('form[action*="/cart/add"]')) return a;
                !n && a.closest && a.closest('form[action*="/cart/add"]') && (n = a)
              }
            }
            return n
          }(e);
        if (!n || !n.parentNode) return;
        if (n === e || e.contains(n)) return;
        if (e.parentNode === n.parentNode && e.nextSibling === n) return;
        try {
          n.parentNode.insertBefore(e, n)
        } catch (e) {}
      }(), n && i.length) {
      for (var u = "", c = function() {
          for (var e = [], t = 0; t < i.length; t++) {
            var r = f(i[t]);
            r && e.push({
              selector: i[t],
              product: r
            })
          }
          if (!e.length) return [];

          function n(t) {
            for (var r = [], n = 0; n < e.length; n++) t(e[n]) && r.push(e[n].selector);
            return r
          }
          var a = n(function(e) {
            return y(function(t) {
              return function(e, t) {
                var r = function(e, t) {
                  for (var r = e && Array.isArray(e.conditions) ? e.conditions : [], n = 0; n < r.length; n++) {
                    var i = r[n];
                    if (i && "quantity" === i.type && v(i.satisfiesFor, t)) return i
                  }
                  return null
                }(e, t);
                if (!r) return !1;
                var n = "number" == typeof r.minimum ? r.minimum : 0,
                  i = "number" == typeof r.maximum ? r.maximum : null;
                return 0 === n && (1 === i || null === i)
              }(t, e.selector.id)
            })
          });
          if (a.length) return a;
          var o = n(function(e) {
            return y(function(t) {
              return p(t, e.selector.id) >= 99.999
            })
          });
          if (o.length) return o;
          var u = n(function(e) {
            return !h(e.product) && g(e.selector.id) > 0
          });
          if (u.length) return u;
          var c = n(function(e) {
            return !h(e.product)
          });
          return c.length ? c : e.map(function(e) {
            return e.selector
          })
        }(), l = 0; l < c.length; l++) u += w(c[l]);
      r.innerHTML = u ? '<div class="bxgy-widget"><p class="bxgy-title">' + d("Choose a matching bracelet") + '</p><div class="bxgy-list">' + u + "</div></div>" : ""
    } else r.innerHTML = ""
  }

  function d(e) {
    return String(null == e ? "" : e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  function s(e, t) {
    if ("number" != typeof e) return "";
    var r = Math.round(100 * e) % 100 == 0 ? 0 : 2;
    if (t) try {
      return new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: t,
        minimumFractionDigits: r,
        maximumFractionDigits: r
      }).format(e)
    } catch (e) {}
    return "$" + e.toFixed(r)
  }

  function f(e) {
    return e ? "productSingle" === e.kind ? e.product || null : "collectionSingle" === e.kind ? e.resolvedProduct ? e.resolvedProduct : (e.collection && Array.isArray(e.collection.products) ? e.collection.products : [])[0] || null : e.product || null : null
  }

  function m(e, t) {
    var r = e && e.variants || [];
    if (!r.length) return null;
    if (t && t.variantId)
      for (var n = 0; n < r.length; n++)
        if (r[n].id === t.variantId) return r[n];
    for (var i = 0; i < r.length; i++)
      if (r[i].available) return r[i];
    return r[0]
  }

  function v(e, t) {
    return (Array.isArray(e) ? e : []).some(function(e) {
      return e && e.selectorId === t
    })
  }

  function p(e, t) {
    for (var r = e && e.rewardSet && Array.isArray(e.rewardSet.rewards) ? e.rewardSet.rewards : [], n = 0, i = 0; i < r.length; i++) {
      var a = r[i];
      a && "percentageDiscount" === a.type && v(a.appliesTo, t) && (n += Number(a.percentage) || 0)
    }
    return Math.min(n, 100)
  }

  function g(e) {
    for (var t = 0, r = 0; r < a.length; r++) t = Math.max(t, p(a[r], e));
    return t
  }

  function y(e) {
    for (var t = 0; t < a.length; t++)
      if (e(a[t])) return !0;
    return !1
  }

  function h(e) {
    if (!e || !e.id) return !1;
    var t = function() {
      var e = r.closest("[data-nameless-block]") || r,
        t = e && e.getAttribute("data-product-id") || "";
      if (!t) {
        var n = document.querySelector("product-form[data-product-id]") || document.querySelector('[name="product-id"]') || document.querySelector('form[action*="/cart/add"] [name="product-id"]');
        t = n && (n.getAttribute("data-product-id") || (null != n.value ? String(n.value) : "")) || ""
      }
      return t ? 0 === t.indexOf("gid://") ? t : "gid://shopify/Product/" + t : ""
    }();
    if (!t) return !1;
    var n = t.replace(/^.*\//, "");
    return e.id === t || String(e.id).endsWith("/" + n)
  }

  function b(e, t) {
    var r = m(f(e), t),
      a = r && r.currencyCode || function() {
        if (n.totals && n.totals.currencyCode) return n.totals.currencyCode;
        for (var e = 0; e < i.length; e++) {
          var t = f(i[e]),
            r = t && t.variants;
          if (r && r.length && r[0].currencyCode) return r[0].currencyCode
        }
        return "USD"
      }(),
      o = r && "number" == typeof r.priceAmount ? r.priceAmount : 0,
      u = t && "number" == typeof t.basePrice && t.basePrice > 0 ? t.basePrice : o,
      c = g(e.id),
      l = Math.max(0, Math.round(u * (1 - c / 100) * 100) / 100);
    return {
      base: u,
      final: t && "number" == typeof t.finalPrice && t.finalPrice >= 0 && t.finalPrice < l ? t.finalPrice : l,
      currency: a
    }
  }

  function w(e) {
    var t = f(e);
    if (!t) return "";
    var r = function(e) {
        if (!e) return null;
        var t = n.selections && n.selections[e.id];
        return t && !Array.isArray(t) ? t : null
      }(e),
      i = function(e) {
        if (!e) return 0;
        if (e.length) {
          for (var t = 0, r = 0; r < e.length; r++) e[r] && "number" == typeof e[r].quantity && (t += e[r].quantity);
          return t
        }
        return "number" == typeof e.quantity ? e.quantity : 0
      }(r) > 0,
      a = !(!r || !r.soldOut),
      o = m(t, r),
      u = o && o.image ? o.image : null,
      c = b(e, r),
      l = "bxgy-addon-" + e.id,
      v = function(e, t) {
        var r = f(e);
        if (!r || ! function(e) {
            var t = e && e.variants || [];
            if (t.length <= 1) return !1;
            for (var r = 0; r < t.length; r++)
              if (t[r].title && "Default Title" !== t[r].title) return !0;
            return !1
          }(r)) return "";
        var n = r.variants || [],
          i = t && t.variantId ? t.variantId : "";
        !i && n.length && (i = n[0].id);
        for (var a = "", o = 0; o < n.length; o++) {
          var u = n[o],
            c = u.title;
          u.available || (c += " — Sold out"), a += '<option value="' + d(u.id) + '"' + (u.id === i ? " selected" : "") + (u.available ? "" : " disabled") + ">" + d(c) + "</option>"
        }
        return '<select class="bxgy-select" data-nameless-variant-selector="' + d(e.id) + '" aria-label="Variant">' + a + "</select>"
      }(e, r),
      p = u ? '<img class="bxgy-row__image" src="' + d(u.url) + '" alt="' + d(u.altText || t.title) + '">' : '<span class="bxgy-row__mark" aria-hidden="true">' + d((t.title || "A").charAt(0)) + "</span>";
    return '<div class="bxgy-row' + (i ? " is-selected" : "") + (a ? " is-sold-out" : "") + '"><label class="bxgy-row__toggle" for="' + d(l) + '"><input id="' + d(l) + '" class="bxgy-checkbox" type="checkbox"' + (i ? " checked" : "") + (a ? " disabled" : "") + ' data-nameless-qty-selector="' + d(e.id) + '"><span class="bxgy-checkbox__box" aria-hidden="true"></span></label><input class="bxgy-qty" type="number" hidden tabindex="-1" aria-hidden="true" min="1" max="1" value="1" data-nameless-qty-selector="' + d(e.id) + '"><div class="bxgy-row__media">' + p + '</div><div class="bxgy-row__body"><div class="bxgy-row__topline"><span class="bxgy-row__title">' + d(t.title) + "</span></div>" + function(e) {
      var t = e.final <= .001,
        r = e.base > e.final + .001;
      return '<div class="bxgy-price">' + (t ? '<span class="bxgy-price__final">Free</span>' : '<span class="bxgy-price__final">' + d(s(e.final, e.currency)) + "</span>") + (r ? '<s class="bxgy-price__compare">' + d(s(e.base, e.currency)) + "</s>" : "") + "</div>"
    }(c) + (a ? '<div class="bxgy-row__badge">Sold out</div>' : "") + "</div>" + (v ? '<div class="bxgy-row__variant">' + v + "</div>" : "") + "</div>"
  }
});