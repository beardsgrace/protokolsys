/* Shared Phase 1 conversion tracking. No coupon values or personal data sent. */
(function () {
  "use strict";
  if (window.pxConversionsInitialized) return;
  window.pxConversionsInitialized = true;
  var hosts = {
    "ionpeptide.com":"ion", "swisschems.is":"swisschems",
    "petratidescience.com":"petratide", "petratide.com":"petratide",
    "peptipura.net":"peptipura", "ramppeptides.com":"ramp",
    "thekrakenpep.com":"kraken", "axonpeptide.com":"axon"
  };
  var offers = {ion:"referral",swisschems:"coupon",petratide:"coupon",peptipura:"none",ramp:"coupon",kraken:"coupon",axon:"coupon"};
  function pageType() {
    var p = location.pathname;
    return p === "/" || p === "/index.html" ? "homepage" :
      p.indexOf("/blog/") === 0 ? "article" :
      p.indexOf("trust-index") !== -1 ? "trust_index" : "vendor_profile";
  }
  function track(name, node, vendor) {
    if (typeof window.gtag !== "function") return;
    var context = node.closest("[data-px-vendor]");
    vendor = vendor || (context && context.dataset.pxVendor) || "all";
    window.gtag("event", name, {
      vendor: vendor,
      placement: node.dataset.pxPlacement || (context && context.dataset.pxPlacement) || "vendor_profile",
      page_type: pageType(),
      offer_type: node.dataset.pxOffer || (context && context.dataset.pxOffer) || offers[vendor] || "none"
    });
  }
  function fallbackCopy(text) {
    var active = document.activeElement;
    var selection = window.getSelection();
    var ranges = [];
    if (selection) for (var i=0;i<selection.rangeCount;i++) ranges.push(selection.getRangeAt(i).cloneRange());
    var input = document.createElement("textarea");
    input.value = text;
    input.readOnly = true;
    input.style.cssText = "position:fixed;left:-9999px;top:0;font-size:16px";
    document.body.appendChild(input);
    try {
      input.select();
      return document.execCommand("copy") === true;
    } catch (_) { return false; }
    finally {
      input.remove();
      if (active && active.focus) active.focus({preventScroll:true});
      if (selection) { selection.removeAllRanges(); ranges.forEach(function(r){selection.addRange(r);}); }
    }
  }
  async function copy(button) {
    if (button.disabled) return;
    button.disabled = true;
    var status = button.closest(".px-offer").querySelector(".px-copy-status");
    var success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(button.dataset.pxCopy); success = true; }
        catch (_) { success = fallbackCopy(button.dataset.pxCopy); }
      } else success = fallbackCopy(button.dataset.pxCopy);
      status.textContent = success ? "Code copied!" : "Unable to copy. Select and copy the code above.";
      if (success) track("discount_copy", button);
    } finally { button.disabled = false; }
  }
  document.addEventListener("click", function(event) {
    var button = event.target.closest("button[data-px-copy]");
    if (button) { copy(button); return; }
    var link = event.target.closest("a[href]");
    if (!link) return;
    if (link.dataset.pxEvent) { track(link.dataset.pxEvent, link); return; }
    var url;
    try { url = new URL(link.href); } catch (_) { return; }
    var vendor = hosts[url.hostname.replace(/^www\./,"")];
    if (vendor) track("affiliate_click", link, vendor);
  });
}());
