# Phase 1 affiliate conversion review

Date: November 13, 2026. Base commit: 0d4d0e72bd5ccaac225690b66f73e723bf53f997.
Review branch: phase1/affiliate-conversion-optimization.
Status: draft for review; no deployment or merge performed.

## Changes

- Preserve existing dark background, cyan/amber palette, fonts, six value-ranked cards, AXON feature strip, and all original outbound URLs.
- Add five code-copy controls: AXON, SwissChems, Petratide, Ramp, Kraken. Codes come from repository profile/intelligence text, not user memories or inferred referral parameters.
- Keep ION as referral activation because its profile explicitly says it uses a referral path rather than a typed coupon. Peptipura has no documented offer; retain Visit Vendor without inventing one.
- Show source-listed savings with checkout qualification. Current vendor acceptance is not independently verified.
- Expose AXON profile and vendor actions as visible text below its artwork, including on mobile. Preserve original artwork links.
- Add View Profile & Savings to all seven Trust Index rows without changing editorial scores, tiers, assessments, or rank order.
- Correct Ramp/Kraken displayed COA weighting from 10% to 20% using the page's explicit shared methodology and legend; all displayed row weights now total 100%. No score recalculation.
- Add neutral methodology links to three verification articles only: how-to-read-peptide-coa, understanding-peptide-testing-beyond-coa, grey-market-blind-trust. Research compound articles receive no new promotions.
- Add shared conversion script and scoped responsive styles. No CMS, backend, build dependency, or framework.
- Load the existing GA4 property G-GHVBPQ6KQ4 on relevant pages where it was absent, preserving every existing initialization and legacy event.

## Actual vendor data sources

There is no central authoritative vendor registry. Homepage names, tiers, value ranks and affiliate URLs are inline in index.html; trust ranks, scores, tiers and weights are inline in trust-index.html. Savings and typed codes are in vendor profiles/intelligence briefs. js/vendor-events.js contains dated promotions, not a reliable evergreen offer registry. AXON's current profile is mostly artwork, so embedded image text is not treated as a machine-readable source.

| Vendor | Displayed typed code | Savings text | Code/offer evidence | Preserved homepage affiliate URL |
|---|---|---|---|---|
| ION Peptide | None published as a stable typed offer | 17% referral savings; confirm at checkout. | vendors/ion-peptide-discount.html | https://ionpeptide.com/?ref=mikeyb7189 |
| SwissChems | SWISSMB | 10% referral savings when available. | vendors/swisschems-intelligence-brief.html | https://swisschems.is/ref/6720/ |
| Petratide Science | mikeyb7189 | 10% referral savings when available. | vendors/petratide-science-intelligence-brief.html | https://petratidescience.com/?ref=mikeyb7189 |
| Peptipura | None published as a stable typed offer | See profile for current vendor details. | vendors/peptipura-vendor-profile.html | https://peptipura.net |
| Ramp Peptides | mikeyb7189 | 10% savings when available; confirm at checkout. | vendors/ramp-peptides-intelligence-brief-v2.html | https://ramppeptides.com/?ref=mikeyb7189 |
| The Kraken Pep | krakenmb | 10% code savings when accepted at checkout. | vendors/kraken-pep-vendor-profile.html | https://thekrakenpep.com/?coupon=krakenmb |
| AXON | AXONMB | 20% code savings; confirm at checkout. | vendors/axon-peptide-intelligence-brief-v2.html | https://www.axonpeptide.com/?sca_ref=11311207.TWZhDavjKf |

Each existing profile link is preserved. The added AXON Trust Index action points to /vendors/axon.html, the current homepage profile; the existing legacy /vendors/axon-vendor-profile.html link remains available.

| Vendor | Homepage presentation | Trust Index tier / score | Profile evidence |
|---|---|---|---|
| ION | Value rank 1, Tier 1 | Tier 1 / 8.8 | vendors/ion-peptide-discount.html: Tier 1, 8.8 |
| SwissChems | Value rank 2, Tier 1 | Tier 1 / 9.3 | vendors/swisschems-vendor-profile.html: Tier 1, 9.3 |
| Petratide Science | Value rank 3, Tier 2 | Petratide, Tier 1 / 8.2 | vendors/petratide-science-vendor-profile.html: Tier 2, 8.2; intelligence brief: Tier 1, 8.2 |
| Peptipura | Value rank 4, Tier 2 | Tier 2 / 8.1 | vendors/peptipura-vendor-profile.html: Tier 2, 8.1 |
| Ramp | Value rank 5, Tier 2 | Tier 2 / 7.6 | vendors/ramp-peptides-vendor-profile.html: Tier 2, 7.6 |
| Kraken | Value rank 6, Tier 3 | Tier 3 / 6.2 | vendors/kraken-pep-vendor-profile.html: Tier 3, 6.2 |
| AXON | Separate featured strip; no value rank | Tier 1 / 8.6 | legacy axon-vendor-profile.html: Tier 1, 8.8; intelligence brief: Tier 1, 8.6 |

## Manual verification required

1. Petratide: homepage/profile use Petratide Science and petratidescience.com; Trust Index uses Petratide and petratide.com. Tier 2 in homepage/profile conflicts with Tier 1 in Index/intelligence brief. Neither domain nor tier is replaced. Confirm canonical brand, active affiliate destination, and intended tier.
2. AXON: legacy profile score 8.8 conflicts with Index/intelligence score 8.6. Current homepage and Index navigate different profile variants. No score changed. Decide canonical profile/redirect strategy after review; do not remove decoder functionality in axon.html.
3. ION: profile explicitly describes referral-only use; intelligence brief and expired event content describe typed mikeyb7189. Retain referral activation pending confirmation.
4. SwissChems and Petratide: profiles emphasize referral savings while intelligence briefs additionally publish SWISSMB and mikeyb7189 respectively. Copy controls expose those already-published codes; existing referral URLs remain intact. Confirm simultaneous code/referral behavior and checkout acceptance.
5. Ramp: profile emphasizes referral savings and ACH; intelligence brief publishes mikeyb7189. Copy uses the published code while preserving referral URL. Confirm code acceptance and any stacking restrictions.
6. Kraken: profile uses lowercase krakenmb; intelligence brief uses uppercase KRAKENMB. Preserve the profile/URL casing.
7. Scoring scale leaves 6.0–6.4 unclassified and does not clearly classify 8.9–9.0 fractional values. Do not invent thresholds. Kraken 6.2 is labeled Developing in its intelligence brief but falls outside the Index's Developing band (6.5–7.4). Resolve editorial scale separately.
8. Homepage structured ItemList and metadata mention six vendors while AXON appears in a separate feature. Do not assign AXON a value rank without an editorial decision.
9. Expired sale registries are not used to promise current sale/stacking values. No vendor claim or medical/dosing recommendation added.

## Analytics

Events: affiliate_click, discount_copy, trust_to_profile, article_to_trust.
Parameters: vendor (stable slug), placement, page_type, offer_type.
No coupon values, referral parameters, link URLs, or personal information in these new payloads.
- One delegated click listener with a global initialization guard.
- One affiliate_click per vendor-domain anchor activation, including dynamically injected event CTAs.
- discount_copy only after Clipboard API success or a true execCommand fallback result.
- Button disabled while pending to suppress overlapping copies; retry remains available.
- Live-region success/error text; fallback restores focus and text selection.
- Existing vendor_click_* and vendor_event_* events are preserved and are distinct from the new event names.
- Documentation domains such as axonverified.com are excluded from affiliate_click.
- New event collection is scoped to the homepage, Trust Index, vendor detail variants, and three verification articles.
- GA4 Enhanced Measurement may still generate its separate automatic click event. Use affiliate_click alone for the custom conversion metric; do not sum it with legacy click metrics.
- Live delivery/DebugView has not been verified. GA4 custom dimensions and reports require property-side setup after review.

## Validation performed

- PASS: node --check js/affiliate-conversions.js.
- PASS: node scripts/test-affiliate-conversions.cjs.
- Tests exercise all five copy controls, Clipboard API success, denied API with successful fallback, insecure-context fallback, complete failure, no success event on failure, focus cleanup, rapid-click suppression, repeated script initialization, all four event names, vendor hostname matching, excluded documentation links, absent GA, and payload privacy.
- PASS: original external anchor destinations retained in every changed HTML page (exact string membership comparison). Added AXON text CTA uses the existing sca_ref URL unchanged.
- PASS: new internal profile/article links and shared asset paths resolve against the repository tree.
- PASS: all seven Trust Index score strings remain 9.3, 8.8, 8.6, 8.2, 8.1, 7.6, 6.2 in the same order; all weight rows total 100.
- PASS: one custom script include and one GA4 config in each instrumented HTML file.
- PASS: no prior code uses the four new event names, preventing collisions with repository event handlers.
- PASS: calculator.html, tools/nutrition-calculator/index.html, pillars/index.html, tracker.html, and existing tool scripts remain unchanged.
- PASS: plain static HTML/CSS/JS with root-relative resources retains existing custom-domain GitHub Pages compatibility; no build step added.
- Source review: changes add interface/offer/navigation text only, with no medical or dosing claims; existing disclosures remain intact.

## Remaining validation limitations

Browser preview connection failed. Visual and real-browser interaction checks at **375px, 390px and 430px are NOT completed**. Responsive rules stack Trust Index rows, use two-column attributes on narrow screens, set touch targets to at least 44px, and allow code wrapping, but rendered overflow/appearance must be checked before merge. Native clipboard behavior, live analytics delivery, and calculator/tracker runtime smoke tests remain unverified; unchanged source is not a runtime pass. Source was retrieved through the GitHub connector because local git clone networking failed. Binary artwork was not downloaded into the local text-source mirror; GitHub commits preserve the complete original tree including every image.

## Phase 2

1. Complete browser checks and GA4 DebugView verification before merge.
2. Resolve the editorial conflicts above and establish an approved vendor data registry with evidence/review dates.
3. Use affiliate_click by vendor/placement and successful discount_copy to establish a baseline; prioritize changes from observed behavior.
4. Add reviewed offer-expiration metadata and automate consistency checks once canonical values are approved.
5. Review structured metadata and canonical profile navigation after AXON placement and Petratide decisions.

## Files changed

- index.html
- trust-index.html
- blog/how-to-read-peptide-coa.html
- blog/understanding-peptide-testing-beyond-coa.html
- blog/grey-market-blind-trust.html
- js/affiliate-conversions.js
- css/affiliate-conversions.css
- vendors/axon-peptide-intelligence-brief-v2.html
- vendors/axon-vendor-profile.html
- vendors/axon.html
- vendors/ion-peptide-discount.html
- vendors/ion-peptide-intelligence-brief-v2.html
- vendors/kraken-pep-intelligence-brief-v2.html
- vendors/kraken-pep-vendor-profile.html
- vendors/peptipura-intelligence-brief.html
- vendors/peptipura-vendor-profile.html
- vendors/petratide-science-intelligence-brief.html
- vendors/petratide-science-vendor-profile.html
- vendors/ramp-peptides-intelligence-brief-v2.html
- vendors/ramp-peptides-vendor-profile.html
- vendors/swisschems-intelligence-brief.html
- vendors/swisschems-vendor-profile.html
- ion-peptide-discount.html
- scripts/test-affiliate-conversions.cjs
- docs/phase1-affiliate-conversion-review.md
