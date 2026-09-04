/**
 * PROTOKOL X Vendor Event Notice System
 *
 * The event registry below is the source of truth. The UI is injected at runtime
 * only when the current vendor has an active, in-range, non-dismissed event.
 *
 * Integration:
 *   <link rel="stylesheet" href="/css/vendor-events.css">
 *   <script src="/js/vendor-events.js" defer></script>
 *
 * Preferred vendor marker:
 *   <body data-vendor="ion">
 *
 * URL detection is used as a fallback for existing vendor pages.
 */
(function vendorEventSystem(global, document) {
  "use strict";

  var SUPPORTED_VENDORS = [
    "ion",
    "axon",
    "ramp",
    "swisschems",
    "peptipura",
    "petratide",
    "kraken"
  ];

  /**
   * Add future events here. Dates use local calendar days and are inclusive.
   *
   * Optional fields:
   * - emphasizedLines: zero-based line indexes that receive a gold highlight.
   */
  var VENDOR_EVENTS = [
    {
      vendor: "ion",
      eventId: "ion-labor-day-2026-09-03",
      active: true,
      theme: "ion-labor-day",
      storageScope: "session",
      oncePerSession: true,
      title: "ION LABOR DAY SALE",
      label: "September 4–7",
      description: "Ends September 7 at 11:59 PM ET",
      lines: [],
      startDateTime: "2026-09-03T00:00:00-04:00",
      endDateTime: "2026-09-07T23:59:59.999-04:00",
      ctaText: "SHOP ION & SAVE",
      ctaUrl: "https://ionpeptide.com/?ref=mikeyb7189"
    },
    {
      vendor: "axon",
      eventId: "axon-july-sale-2026-07-02",
      active: true,
      theme: "axon-gold",
      storageScope: "session",
      paths: ["/axon", "/axon/"],
      title: "AXON Sale Event",
      label: "Current Vendor Event",
      description: "July 2, 12:00 AM EST \u2013 July 7, 11:59 PM EST",
      lines: [
        "Orders up to $200 \u2014 30% Off (10% sitewide + 20% AXONMB)",
        "Orders over $200 \u2014 35% Off (15% sitewide + 20% AXONMB)"
      ],
      emphasizedLines: [0, 1],
      startDateTime: "2026-07-02T00:00:00-05:00",
      endDateTime: "2026-07-07T23:59:00-05:00"
    },
    {
      vendor: "ramp",
      eventId: "ramp-labor-day-2026-09-03",
      active: true,
      theme: "ramp-labor-day",
      storageScope: "session",
      oncePerSession: true,
      dismissOnBackdrop: true,
      paths: ["/vendors/ramp-peptides-vendor-profile.html"],
      title: "RAMP LABOR DAY SALE",
      label: "Protokol X",
      description: "Ends Monday at 12:00 PM MST.",
      lines: [],
      startDateTime: "2026-09-03T00:00:00-07:00",
      endDateTime: "2026-09-07T11:59:59.999-07:00",
      ctaText: "SHOP THE RAMP SALE",
      ctaSelector: 'a[data-ga-event="vendor_click_ramp"]'
    },
    {
      vendor: "kraken",
      eventId: "kraken-july-sale-2026-07-01",
      active: true,
      paths: ["/vendors/kraken-pep-vendor-profile.html"],
      title: "Kraken Pep Sale",
      label: "Current Vendor Event",
      description: "Live now \u2013 July 6, midnight",
      lines: [
        "25% Off Sitewide + 10% krakenmb"
      ],
      emphasizedLines: [0],
      startDateTime: "2026-07-01T00:00:00-07:00",
      endDateTime: "2026-07-06T00:00:00-07:00",
      ctaText: "View Kraken",
      ctaUrl: "/vendors/kraken-pep-vendor-profile.html"
    },
    {
      vendor: "petratide",
      eventId: "petratide-july-sale-2026-07-01",
      active: true,
      paths: ["/vendors/petratide-science-vendor-profile.html"],
      title: "Petratide Science Sale",
      label: "Current Vendor Event",
      description: "Live now \u2013 July 5, 11:59 PM CST",
      lines: [
        "BW + GHK-Cu Bundle \u2014 $19.95",
        "Bundle is free with any $200+ order",
        "Maximum Savings \u2014 35% Off",
        "Industry-record stack: 10-15% off sitewide + 10% off with code mikeyb7189",
        "8-15% off with bulk pricing",
        "$30 Off any $350+ order, applied automatically at checkout"
      ],
      emphasizedLines: [2, 3, 5],
      startDateTime: "2026-07-01T00:00:00-06:00",
      endDateTime: "2026-07-05T23:59:00-06:00",
      ctaText: "View Petratide",
      ctaUrl: "/vendors/petratide-science-vendor-profile.html"
    }
  ];

  var expirationTimer = null;
  var rampBackground = [];
  var STORAGE_PREFIX = "px_vendor_event_";
  var state = {
    vendor: null,
    activeEvents: [],
    currentEvent: null,
    root: null,
    overlay: null,
    modal: null,
    badge: null,
    previouslyFocused: null,
    initialized: false
  };

  function normalizeVendor(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function detectVendorFromPath(pathname) {
    var path = String(pathname || "").toLowerCase();
    var segments = path.split("/").filter(Boolean);
    var filename = segments.length ? segments[segments.length - 1] : "";
    var filenameBase = filename.replace(/\.html?$/, "");

    var aliases = {
      ion: ["ion", "ion-peptide-discount"],
      axon: ["axon", "axon-vendor-profile"],
      ramp: ["ramp", "ramp-peptides-vendor-profile"],
      swisschems: ["swisschems", "swisschems-vendor-profile"],
      peptipura: ["peptipura", "peptipura-vendor-profile"],
      petratide: ["petratide", "petratide-science-vendor-profile"],
      kraken: ["kraken", "kraken-pep-vendor-profile"]
    };

    for (var vendorIndex = 0; vendorIndex < SUPPORTED_VENDORS.length; vendorIndex += 1) {
      var vendor = SUPPORTED_VENDORS[vendorIndex];
      var vendorAliases = aliases[vendor];

      if (segments.indexOf(vendor) !== -1 || vendorAliases.indexOf(filenameBase) !== -1) {
        return vendor;
      }
    }

    return null;
  }

  function detectVendor() {
    var bodyVendor = document.body
      ? normalizeVendor(document.body.getAttribute("data-vendor"))
      : "";

    if (SUPPORTED_VENDORS.indexOf(bodyVendor) !== -1) {
      return bodyVendor;
    }

    return detectVendorFromPath(global.location && global.location.pathname);
  }

  function parseCalendarDate(value, endOfDay) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      return null;
    }

    var parts = value.split("-").map(Number);
    var date = new Date(
      parts[0],
      parts[1] - 1,
      parts[2],
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isEventInDateRange(event, now) {
    if (event.startDateTime || event.endDateTime) {
      var startDateTime = new Date(event.startDateTime);
      var endDateTime = new Date(event.endDateTime);

      if (
        Number.isNaN(startDateTime.getTime()) ||
        Number.isNaN(endDateTime.getTime()) ||
        startDateTime.getTime() > endDateTime.getTime()
      ) {
        return false;
      }

      return (
        now.getTime() >= startDateTime.getTime() &&
        now.getTime() <= endDateTime.getTime()
      );
    }

    var start = parseCalendarDate(event.startDate, false);
    var end = parseCalendarDate(event.endDate, true);

    if (!start || !end || start.getTime() > end.getTime()) {
      return false;
    }

    return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
  }

  function storageKey(eventId, property) {
    return STORAGE_PREFIX + property + "_" + eventId;
  }

  function getStorage(event) {
    return event.storageScope === "session"
      ? global.sessionStorage
      : global.localStorage;
  }

  function readStorage(event, property) {
    try {
      return getStorage(event).getItem(storageKey(event.eventId, property)) === "true";
    } catch (error) {
      return false;
    }
  }

  function writeStorage(event, property, value) {
    try {
      getStorage(event).setItem(
        storageKey(event.eventId, property),
        String(Boolean(value))
      );
    } catch (error) {
      // Storage can be unavailable in private browsing or restricted embeds.
    }
  }

  function isDismissed(event) {
    return readStorage(event, "dismissed");
  }

  function isMinimized(event) {
    return readStorage(event, "minimized");
  }

  function getActiveEvents(vendor, now) {
    return VENDOR_EVENTS.filter(function filterEvent(event) {
      return (
        normalizeVendor(event.vendor) === vendor &&
        event.active === true &&
        doesEventMatchPath(event) &&
        isEventInDateRange(event, now) &&
        !isDismissed(event) &&
        !(event.oncePerSession && readStorage(event, "seen"))
      );
    });
  }

  function normalizePath(pathname) {
    var path = String(pathname || "").toLowerCase();
    return path && path.charAt(path.length - 1) !== "/" ? path + "/" : path;
  }

  function doesEventMatchPath(event) {
    if (!Array.isArray(event.paths) || event.paths.length === 0) {
      return true;
    }

    var currentPath = normalizePath(global.location && global.location.pathname);
    return event.paths.some(function matchAllowedPath(allowedPath) {
      return currentPath === normalizePath(allowedPath);
    });
  }

  function track(action, event) {
    var payload = {
      event_category: "Vendor Event Notice",
      event_label: event.eventId,
      vendor: event.vendor,
      event_id: event.eventId
    };

    try {
      if (typeof global.gtag === "function") {
        global.gtag("event", "vendor_event_" + action, payload);
        return;
      }

      if (Array.isArray(global.dataLayer)) {
        global.dataLayer.push({
          event: "vendor_event_" + action,
          vendor_event: payload
        });
      }
    } catch (error) {
      // Analytics must never interfere with page behavior.
    }
  }

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (typeof text === "string") {
      element.textContent = text;
    }
    return element;
  }

  function getFocusableElements() {
    if (!state.modal) {
      return [];
    }

    return Array.prototype.slice.call(
      state.modal.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function visible(element) {
      return element.getClientRects().length > 0;
    });
  }

  function handleModalKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      minimizeCurrentEvent();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    var focusable = getFocusableElements();
    if (!focusable.length) {
      event.preventDefault();
      state.modal.focus();
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setPageLocked(locked) {
    document.documentElement.classList.toggle("px-event-open", locked);
  }

  function updateBadge() {
    if (!state.badge) {
      return;
    }

    var remaining = getActiveEvents(state.vendor, new Date());
    state.activeEvents = remaining;
    state.badge.hidden = remaining.length === 0;

    var count = state.badge.querySelector("[data-px-event-count]");
    if (count) {
      count.textContent = String(remaining.length);
      count.hidden = remaining.length < 2;
    }
  }

  function hideModal(options) {
    var settings = options || {};

    if (!state.overlay || !state.modal) {
      return;
    }

    if (state.currentEvent && state.currentEvent.theme === "ramp-labor-day") {
      global.clearTimeout(expirationTimer);
      rampBackground.forEach(function restoreBackground(entry) { entry.element.inert = entry.inert; });
      rampBackground = [];
    }
    state.overlay.classList.remove("is-visible");
    state.overlay.setAttribute("aria-hidden", "true");
    setPageLocked(false);

    if (settings.showBadge) {
      updateBadge();
      state.badge.hidden = false;
    }

    if (settings.restoreFocus && state.previouslyFocused) {
      state.previouslyFocused.focus();
    }
  }

  function renderEvent(event) {
    var label = state.modal.querySelector("[data-px-event-label]");
    var title = state.modal.querySelector("[data-px-event-title]");
    var description = state.modal.querySelector("[data-px-event-description]");
    var list = state.modal.querySelector("[data-px-event-lines]");
    var cta = state.modal.querySelector("[data-px-event-cta]");

    state.root.setAttribute("data-px-event-theme", event.theme || "default");
    label.textContent = event.label;
    title.textContent = event.title;
    description.textContent = event.description;
    list.replaceChildren();

    var previousPromotion = state.modal.querySelector(".px-ion-promotion, .px-ramp-promotion");
    if (previousPromotion) previousPromotion.remove();
    if (event.theme === "ion-labor-day") {
      var promotion = createElement("div", "px-ion-promotion");
      promotion.innerHTML = '<div class="px-ion-logo" role="img" aria-label="ION Peptide"><img src="/assets/vendors/ion-banner.png" alt=""></div>' +
        '<div class="px-ion-main"><strong>20% OFF</strong><span>SITEWIDE</span></div>' +
        '<div class="px-ion-stack"><p>Stack your savings:</p><p>• Code <strong>MIKEYB7189</strong> <span>— Extra 17% Off</span></p><p>• ACH Payment — Extra 5% Off</p></div>' +
        '<div class="px-ion-total"><span>SAVE </span><strong>UP TO 42%</strong><span> SITEWIDE</span></div>' +
        '<p class="px-ion-select">Select items up to 72% off</p>' +
        '<p class="px-ion-shipping"><strong>FREE SHIPPING</strong> on orders over $250</p>' +
        '<p class="px-ion-prize">Spend $250 or more for a chance to be one of 20 winners receiving $250 in ION store credit.</p>';
      state.modal.insertBefore(promotion, description);
      cta.rel = "noopener sponsored";
    } else {
      cta.removeAttribute("rel");
    }

    event.lines.forEach(function addLine(line, index) {
      var item = createElement("li", "px-event-line", line);
      if ((event.emphasizedLines || []).indexOf(index) !== -1) {
        item.classList.add("is-emphasized");
      }
      list.appendChild(item);
    });

    if (event.theme === "ramp-labor-day") {
      var rampPromotion = createElement("div", "px-ramp-promotion");
      rampPromotion.innerHTML = '<div class="px-ramp-logo" role="img" aria-label="RAMP"><img src="/assets/vendors/ramp-banner.png" alt=""></div>' +
        '<div class="px-ramp-offer"><strong>25% OFF</strong><span>SITEWIDE</span></div>' +
        '<div class="px-ramp-ticket"><p>Stack with Golden Ticket Code</p><strong>MIKEYB7189</strong><p>for up to <b>35% total savings.</b></p></div>' +
        '<p class="px-ramp-exclusion">Excludes R10.</p>';
      rampPromotion.id = "px-ramp-details";
      state.modal.insertBefore(rampPromotion, description);
      state.modal.setAttribute("aria-describedby", "px-ramp-details px-event-description");
    }
    // Read the existing page CTA so its destination stays the source of truth.
    var sourceCta = event.ctaSelector ? document.querySelector(event.ctaSelector) : null;
    var ctaUrl = sourceCta ? sourceCta.getAttribute("href") : event.ctaUrl;
    if (sourceCta) {
      ["target", "rel", "data-ga-event", "data-ga-vendor"].forEach(function copyCtaAttribute(name) {
        if (sourceCta.hasAttribute(name)) cta.setAttribute(name, sourceCta.getAttribute(name));
      });
    }
    if (event.ctaText && ctaUrl) {
      cta.hidden = false;
      cta.textContent = event.ctaText;
      cta.href = ctaUrl;
      cta.setAttribute("data-event-id", event.eventId);
    } else {
      cta.hidden = true;
      cta.removeAttribute("href");
      cta.removeAttribute("data-event-id");
    }
  }

  function showEvent(event, trigger) {
    if (!event || !state.overlay || !state.modal) {
      return;
    }

    state.currentEvent = event;
    state.previouslyFocused = trigger || document.activeElement;
    renderEvent(event);
    if (event.theme === "ramp-labor-day") {
      if (state.previouslyFocused === document.body) {
        state.previouslyFocused = document.querySelector(event.ctaSelector);
      }
      rampBackground = Array.prototype.filter.call(document.body.children, function background(element) {
        return element !== state.root && element.tagName !== "SCRIPT" && element.tagName !== "STYLE";
      }).map(function disableBackground(element) {
        var entry = { element: element, inert: element.inert };
        element.inert = true;
        return entry;
      });
    }
    if (event.oncePerSession) writeStorage(event, "seen", true);
    writeStorage(event, "minimized", false);
    state.badge.hidden = true;
    state.overlay.setAttribute("aria-hidden", "false");
    setPageLocked(true);

    global.requestAnimationFrame(function revealModal() {
      state.overlay.classList.add("is-visible");
      var focusTarget = state.modal.querySelector(event.oncePerSession ? "[data-px-event-close]" : "[data-px-event-minimize]");
      if (focusTarget) {
        focusTarget.focus();
      }
    });

    if (event.oncePerSession && event.endDateTime) {
      global.clearTimeout(expirationTimer);
      expirationTimer = global.setTimeout(function expirePromotion() {
        hideModal({ showBadge: false, restoreFocus: true });
        state.badge.hidden = true;
      }, Math.max(0, new Date(event.endDateTime).getTime() - Date.now() + 1));
    }
    track("shown", event);
  }

  function minimizeCurrentEvent() {
    if (!state.currentEvent) {
      return;
    }

    if (state.currentEvent.oncePerSession) {
      dismissCurrentEvent();
      return;
    }
    writeStorage(state.currentEvent, "minimized", true);
    track("minimized", state.currentEvent);
    hideModal({ showBadge: true, restoreFocus: true });
  }

  function dismissCurrentEvent() {
    if (!state.currentEvent) {
      return;
    }

    var dismissedEvent = state.currentEvent;
    writeStorage(dismissedEvent, "dismissed", true);
    writeStorage(dismissedEvent, "minimized", false);
    track("dismissed", dismissedEvent);
    hideModal({ showBadge: false, restoreFocus: true });

    var remaining = getActiveEvents(state.vendor, new Date());
    state.activeEvents = remaining;
    state.currentEvent = remaining[0] || null;

    if (state.currentEvent) {
      showEvent(state.currentEvent, state.previouslyFocused);
    } else {
      updateBadge();
    }
  }

  function buildInterface() {
    var root = createElement("div", "px-event-system");
    root.setAttribute("data-px-event-system", "");

    var overlay = createElement("div", "px-event-overlay");
    overlay.setAttribute("aria-hidden", "true");

    var modal = createElement("section", "px-event-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "px-event-title");
    modal.setAttribute("aria-describedby", "px-event-description");
    modal.setAttribute("tabindex", "-1");

    var topLine = createElement("div", "px-event-topline");
    var label = createElement("span", "px-event-label");
    label.setAttribute("data-px-event-label", "");
    var affiliate = createElement("span", "px-event-affiliate", "AD / Affiliate Notice");
    topLine.append(label, affiliate);

    var title = createElement("h2", "px-event-title");
    title.id = "px-event-title";
    title.setAttribute("data-px-event-title", "");

    var description = createElement("p", "px-event-description");
    description.id = "px-event-description";
    description.setAttribute("data-px-event-description", "");

    var list = createElement("ul", "px-event-lines");
    list.setAttribute("data-px-event-lines", "");

    var actions = createElement("div", "px-event-actions");
    var cta = createElement("a", "px-event-cta");
    cta.setAttribute("data-px-event-cta", "");
    var minimize = createElement("button", "px-event-button px-event-minimize", "Minimize");
    minimize.type = "button";
    minimize.setAttribute("data-px-event-minimize", "");
    minimize.setAttribute("aria-label", "Minimize vendor event notice");
    var close = createElement("button", "px-event-button px-event-close", "Close");
    close.type = "button";
    close.setAttribute("data-px-event-close", "");
    close.setAttribute("aria-label", "Dismiss vendor event notice");
    actions.append(cta, minimize, close);

    modal.append(topLine, title, description, list, actions);
    overlay.appendChild(modal);

    var badge = createElement("button", "px-event-badge");
    badge.type = "button";
    badge.hidden = true;
    badge.setAttribute("data-px-event-badge", "");
    badge.setAttribute("aria-label", "Open vendor event notice");
    badge.append(
      createElement("span", "px-event-badge-dot"),
      createElement("span", "px-event-badge-text", "Vendor Event")
    );
    var badgeCount = createElement("span", "px-event-badge-count", "1");
    badgeCount.setAttribute("data-px-event-count", "");
    badgeCount.hidden = true;
    badge.appendChild(badgeCount);

    root.append(overlay, badge);
    document.body.appendChild(root);

    state.root = root;
    state.overlay = overlay;
    state.modal = modal;
    state.badge = badge;

    overlay.addEventListener("click", function dismissBackdrop(clickEvent) {
      if (clickEvent.target === overlay && state.currentEvent && state.currentEvent.dismissOnBackdrop) {
        dismissCurrentEvent();
      }
    });
    modal.addEventListener("keydown", handleModalKeydown);
    minimize.addEventListener("click", minimizeCurrentEvent);
    close.addEventListener("click", dismissCurrentEvent);
    badge.addEventListener("click", function reopenEvent() {
      var nextEvent = getActiveEvents(state.vendor, new Date())[0];
      if (nextEvent) {
        showEvent(nextEvent, badge);
      }
    });
    cta.addEventListener("click", function trackCta() {
      if (state.currentEvent) {
        track("cta_clicked", state.currentEvent);
      }
    });
  }

  function initialize(options) {
    if (state.initialized || !document.body) {
      return false;
    }

    state.vendor = normalizeVendor(options && options.vendor) || detectVendor();

    if (SUPPORTED_VENDORS.indexOf(state.vendor) === -1) {
      return false;
    }

    state.activeEvents = getActiveEvents(
      state.vendor,
      options && options.now instanceof Date ? options.now : new Date()
    );

    if (!state.activeEvents.length) {
      return false;
    }

    state.initialized = true;
    buildInterface();
    state.currentEvent = state.activeEvents[0];

    if (isMinimized(state.currentEvent)) {
      updateBadge();
      state.badge.hidden = false;
    } else {
      showEvent(state.currentEvent);
    }

    return true;
  }

  function refresh(options) {
    if (state.currentEvent && state.currentEvent.theme === "ramp-labor-day") hideModal({ restoreFocus: true });
    global.clearTimeout(expirationTimer);
    if (state.root) {
      state.root.remove();
    }

    setPageLocked(false);
    state = {
      vendor: null,
      activeEvents: [],
      currentEvent: null,
      root: null,
      overlay: null,
      modal: null,
      badge: null,
      previouslyFocused: null,
      initialized: false
    };

    return initialize(options);
  }

  global.ProtocolXVendorEvents = {
    events: VENDOR_EVENTS,
    supportedVendors: SUPPORTED_VENDORS.slice(),
    detectVendor: detectVendor,
    getActiveEvents: function publicGetActiveEvents(vendor, now) {
      return getActiveEvents(normalizeVendor(vendor), now || new Date());
    },
    initialize: initialize,
    refresh: refresh
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function onReady() {
      initialize();
    }, { once: true });
  } else {
    initialize();
  }
})(window, document);
