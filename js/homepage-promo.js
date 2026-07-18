(function homepagePromo(global, document) {
  "use strict";

  var PROMO = {
    id: "homepage-freedom-research-2026-09-18",
    paths: ["/", "/index.html"],
    imageSrc: "/assets/promos/lexi-freedom.png",
    imageAlt: "PROTOKOL X Independence Day sales notice: check vendor pages for current sales information.",
    startDateTime: "2026-07-01T00:00:00-07:00",
    endDateTime: "2026-09-18T23:59:59-07:00"
  };

  function normalizePath(pathname) {
    var path = String(pathname || "/").toLowerCase();
    return path && path.charAt(path.length - 1) !== "/" ? path + "/" : path;
  }

  function isAllowedPath() {
    var currentPath = normalizePath(global.location && global.location.pathname);
    return PROMO.paths.some(function matchPath(path) {
      return currentPath === normalizePath(path);
    });
  }

  function parseDate(value) {
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isInWindow(now) {
    var start = parseDate(PROMO.startDateTime);
    var end = parseDate(PROMO.endDateTime);

    if (!start || !end || start.getTime() > end.getTime()) {
      return false;
    }

    return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
  }

  function storageKey() {
    return "px_home_promo_dismissed_" + PROMO.id;
  }

  function isDismissed() {
    try {
      return global.sessionStorage.getItem(storageKey()) === "true";
    } catch (error) {
      return false;
    }
  }

  function dismiss() {
    try {
      global.sessionStorage.setItem(storageKey(), "true");
    } catch (error) {
      // Storage can be unavailable in private browsing.
    }

    var root = document.querySelector("[data-px-home-promo]");
    if (root) {
      root.classList.remove("is-visible");
      root.setAttribute("aria-hidden", "true");
    }
    document.documentElement.classList.remove("px-home-promo-open");
  }

  function buildPromo() {
    var root = document.createElement("div");
    root.className = "px-home-promo";
    root.setAttribute("data-px-home-promo", "");
    root.setAttribute("aria-hidden", "true");

    var panel = document.createElement("section");
    panel.className = "px-home-promo-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "PROTOKOL X Independence Day sales notice");
    panel.setAttribute("tabindex", "-1");

    var close = document.createElement("button");
    close.className = "px-home-promo-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close promotion");
    close.textContent = "x";

    var image = document.createElement("img");
    image.className = "px-home-promo-image";
    image.src = PROMO.imageSrc;
    image.alt = PROMO.imageAlt;
    image.decoding = "async";

    panel.append(close, image);
    root.appendChild(panel);
    document.body.appendChild(root);

    close.addEventListener("click", dismiss);
    root.addEventListener("click", function closeOnBackdrop(event) {
      if (event.target === root) {
        dismiss();
      }
    });
    document.addEventListener("keydown", function closeOnEscape(event) {
      if (event.key === "Escape") {
        dismiss();
      }
    });

    global.requestAnimationFrame(function revealPromo() {
      document.documentElement.classList.add("px-home-promo-open");
      root.setAttribute("aria-hidden", "false");
      root.classList.add("is-visible");
      close.focus();
    });
  }

  function initialize(options) {
    var now = options && options.now instanceof Date ? options.now : new Date();

    if (!document.body || !isAllowedPath() || !isInWindow(now) || isDismissed()) {
      return false;
    }

    buildPromo();
    return true;
  }

  global.ProtocolXHomepagePromo = {
    config: PROMO,
    initialize: initialize,
    isInWindow: isInWindow
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function onReady() {
      initialize();
    }, { once: true });
  } else {
    initialize();
  }
})(window, document);
