// Universal Clicky loader — AdRestore first-party tracking

(function () {
  "use strict";

  // CONFIG
  const SITE_ID = "101492693";
  const BEACON_PREFIX = "/5d68871ccab069b594";
  const HANDOFF_MS = 120;

  const INTERNAL_REDIRECT_PATHS = [
    /^\/join(?:\/|$)/,
    /^\/go(?:\/|$)/,
    /^\/out(?:\/|$)/,
  ];

  // Live online behaviour
  window.clicky_custom = window.clicky_custom || {};
  clicky_custom.ping_disable = 0;
  clicky_custom.ping_interval = 15;

  // Force Clicky URLs to first-party
  function rewriteToFirstParty(src) {
    if (typeof src !== "string") return src;

    src = src.replace(/^(?:https?:)?\/\/in\.getclicky\.com/, BEACON_PREFIX);

    if (/^(?:\/)?in\.php(\?|$)/.test(src)) {
      src = BEACON_PREFIX + "/" + src.replace(/^\//, "");
    }

    return src;
  }

  // Patch inject
  (function patchInject() {
    let patched = false;

    function tryPatch() {
      try {
        if (
          window.clicky &&
          typeof window.clicky.inject === "function" &&
          !patched
        ) {
          const orig = window.clicky.inject;

          window.clicky.inject = function (src, type) {
            return orig.call(this, rewriteToFirstParty(src), type);
          };

          patched = true;
        }
      } catch (_) {}
    }

    tryPatch();

    const iv = setInterval(() => {
      if (patched) clearInterval(iv);
      else tryPatch();
    }, 100);
  })();

  // Load first-party script
  (function loadClicky() {
    const s = document.createElement("script");
    s.async = true;
    s.dataset.id = SITE_ID;
    s.src = "/80b256985d8766a301.js";
    document.head.appendChild(s);
  })();

  // Queue system
  const Q = [];

  function clog(url, title, type) {
    if (window.clicky && window.clicky.log) {
      try {
        window.clicky.log(url, title, type);
      } catch (_) {}
      return true;
    }

    Q.push([url, title, type]);
    return false;
  }

  const qiv = setInterval(() => {
    if (window.clicky && window.clicky.log) {
      clearInterval(qiv);

      while (Q.length) {
        const e = Q.shift();
        try {
          window.clicky.log(e[0], e[1], e[2]);
        } catch (_) {}
      }
    }
  }, 100);

  // Capture gclid
  (function gclidCapture() {
    window.clicky_custom = window.clicky_custom || {};
    window.clicky_custom.custom_data = window.clicky_custom.custom_data || {};

    const urlMatch = location.search.match(/[?&]gclid=([^&]+)/);

    if (urlMatch) {
      const gclid = decodeURIComponent(urlMatch[1]);
      localStorage.setItem("gclid", gclid);
    }

    const stored = localStorage.getItem("gclid");

    if (stored) {
      window.clicky_custom.custom_data.gclid = stored;
    }
  })();

  // Outbound logging
  (function outbound() {
    function isExternal(a) {
      try {
        return a.hostname && a.hostname !== location.hostname;
      } catch {
        return false;
      }
    }

    function isInternalRedirect(a) {
      try {
        return INTERNAL_REDIRECT_PATHS.some((rx) => rx.test(a.pathname || ""));
      } catch {
        return false;
      }
    }

    function sameTab(a, ev) {
      if (a.target && a.target.toLowerCase() === "_blank") return false;
      if (ev && (ev.ctrlKey || ev.shiftKey || ev.metaKey || ev.button === 1))
        return false;
      return true;
    }

    function clean(url) {
      return url
        .replace(/(\?|&)_gl=[^&]*/g, "")
        .replace(/(\?|&)(subid|sub_id)=[^&]*/g, "")
        .replace(/[?&]$/, "");
    }

    document.addEventListener(
      "click",
      function (ev) {
        const a =
          ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;

        if (!a) return;

        const treatAsOutbound = isExternal(a) || isInternalRedirect(a);

        if (!treatAsOutbound) return;

        const title =
          (a.textContent || a.title || a.href).trim() || "Outbound Link";

        const hrefForLog = clean(a.href);

        if (sameTab(a, ev)) {
          ev.preventDefault();

          clog(hrefForLog, title, "outbound");

          let navigated = false;

          const go = () => {
            if (!navigated) {
              navigated = true;
              location.href = a.href;
            }
          };

          const tid = setTimeout(go, HANDOFF_MS);

          const onHide = () => {
            clearTimeout(tid);
            go();
          };

          document.addEventListener("visibilitychange", onHide, { once: true });

          return;
        }

        clog(hrefForLog, title, "outbound");
      },
      true,
    );
  })();
})();
