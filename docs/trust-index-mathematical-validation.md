# PROTOKOL X — Vendor Trust Index Mathematical Validation

**Date:** 2026-11-13
**Branch:** `phase1/affiliate-conversion-optimization` (Phase 1 affiliate conversion optimization)
**Status:** Audit complete. No scores, rankings, or tiers changed. Editorial decisions below require approval before any correction is published.
**Method:** Category scores were extracted from each vendor's intelligence brief matrix on `main`, weights were confirmed to sum to 100%, and totals were recomputed with exact integer math (round half-up to one decimal for display). No values were invented; missing data is labeled as missing.

## 1. Official scoring formula (implemented)

Eight editorial categories, scored 0–10:

| Evaluation Category | Weight |
|---|---:|
| Public COA Availability | 20% |
| Third-Party Testing Depth | 20% |
| Batch Verification | 15% |
| Catalog Consistency | 10% |
| Consumer Accessibility | 10% |
| Fulfillment & Support | 10% |
| Transparency Practices | 10% |
| Operational Reliability | 5% |
| **TOTAL** | **100%** |

**Trust Score = Σ(Category Score × Category Weight)**, full precision during calculation, rounded half-up to one decimal place for display. Maximum 10.0.

The formula is implemented in `scripts/validate-trust-index.cjs` and the authoritative data lives in `data/vendor-trust.json`.

## 2. Validation table

| Vendor | Published Score | Calculated Score | Difference | Status |
|---|---|---|---|---|
| SwissChems | 9.3 | 8.8 | −0.5 | FAIL |
| ION Peptide | 8.8 | 9.1 | +0.3 | FAIL |
| AXON | 8.6 (Index/brief) / 8.8 (profiles) | 9.0 | +0.4 / +0.2 | FAIL |
| Petratide Science | 8.2 | 8.1 | −0.1 | FAIL |
| Peptipura | 8.1 | 8.3 | +0.2 | FAIL |
| Ramp Peptides | 7.6 | 7.2 | −0.4 | FAIL |
| The Kraken Pep | 6.2 | 6.2 | 0.0 | PASS |

All seven vendors have complete category-level data in their intelligence briefs (eight categories each, weights summing to exactly 100%). Every brief renders its matrix twice with identical values in both copies (verified); the duplication is presentational, not a second assessment.

**Only The Kraken Pep's published total reproduces from its category scores.** The other six published totals cannot be reproduced from the briefs' own factor scores under the official formula.

If recalculated scores became the published scores, the ranking order would change: ION 9.1 (#1), AXON 9.0 (#2), SwissChems 8.8 (#3), Peptipura 8.3 (#4), Petratide 8.1 (#5), Ramp 7.2 (#6), Kraken 6.2 (#7). **No such change has been made.** See editorial decision #1.

## 3. Mathematical errors found

1. **Six published totals do not reproduce from their category scores** (table above). The largest gaps are SwissChems (−0.5), AXON (+0.4 vs the Index total), and Ramp (−0.4). Either the category scores or the published totals are stale; the audit cannot determine which from the repository alone.
2. **AXON has two different published totals**: 8.6 on the Trust Index and in the intelligence brief, 8.8 on both profile pages (`vendors/axon.html`, `vendors/axon-vendor-profile.html`). Neither value reproduces from the brief's factor scores (9.0).
3. **Ramp and Kraken Trust Index rows on `main`** display category weights summing to 90% (COA shown at 10% instead of 20%). See §4 — this is presentation-only; the briefs calculate with 20%.

## 4. Presentation-only inconsistencies

1. **Ramp / Kraken COA weight display (10% vs 20%)**: presentation error only. Both vendors' brief matrices use the standard 20% COA weight, and the recomputed totals in §2 already use 20%. The Phase 1 branch already corrects the displayed weight to 20% (PR #1); merging that PR fixes `main`. No score change follows from this correction.
2. **Duplicated factor matrix in every brief**: each intelligence brief contains the 8-factor matrix twice (same values, different row order). Both copies agree in all seven briefs, so no calculation is affected. Consolidation is optional cleanup, not a correction.
3. **Petratide naming/domain on the Trust Index**: the Index row reads "Petratide" and links to `https://petratide.com`, which is an unrelated technology company. The vendor's actual domain is `petratidescience.com` (live; matches all affiliate links, the vendor profile, and the brief). Correcting the name and link is a factual fix, not a scoring change. Held with the other corrections pending approval — see editorial decision #3.

## 5. Missing source data

1. **No documented tier rule.** Nothing in the repository states whether Tier 1/2/3 designations follow numerical thresholds or independent editorial criteria. Evidence is mixed (see §6, decision #2).
2. **No documented rounding rule** prior to this audit. This report adopts round half-up to one decimal; no published total changes under any standard rounding rule except where noted in §2.
3. **No centralized data source** prior to this audit. `data/` previously contained only `peptide-briefs.json`. `data/vendor-trust.json` is now the single authoritative structure; it records only values extracted from the repository.
4. **No per-vendor evidence/re-evaluation log** beyond brief date ("June 2026") and revision numbers recorded in the JSON.

No category-level scores were missing for any vendor. No values in `data/vendor-trust.json` were fabricated.

## 6. Tier classifications

Published classification scale (from the Trust Index legend):

- 9.0–10.0: Exceptional
- 7.5–8.9: Strong
- 6.5–7.4: Developing
- Below 6.0: Early Stage

**Gap confirmed: 6.0–6.4 is unclassified.** The Kraken Pep (6.2) falls in the gap; its brief labels it "Developing", which contradicts the published band (6.5–7.4).

**Recommendation (requires approval):** extend Developing to 6.0–7.4, giving a complete, non-overlapping scale: 9.0–10.0 Exceptional, 7.5–8.9 Strong, 6.0–7.4 Developing, below 6.0 Early Stage. This keeps the Kraken "Developing" label valid. Alternative: add a separate 6.0–6.4 band (e.g. "Emerging"). **No boundary has been redefined.**

**Tier 1/2/3 vs score bands:** the Trust Index pattern is consistent with a numerical rule (Tier 1 ≥ 8.2, Tier 2 7.5–8.1, Tier 3 < 7.5), which would make Petratide (8.2) Tier 1. But the homepage and the Petratide vendor profile label it Tier 2 with an explicit editorial rationale (strong emerging vendor; "not yet Tier 1" on long-term maturity). Score classifications and editorial tiers must not be assumed interchangeable. See editorial decision #2.

## 7. Corrected files

**None in this commit.** All corrections are held pending the editorial decisions below, per the task instruction to stop and request approval for ambiguous changes affecting published scores, rankings, or tiers. The only files added here are the data source, the validation script, and this report.

## 8. Automated validation test results

`node scripts/validate-trust-index.cjs` — run 2026-11-13 against the repository content:

- Weights sum check: PASS (100% in all seven brief matrices).
- Category validity: PASS (all 56 scores within 0–10, one decimal).
- Published-vs-calculated: **FAIL — 6 of 7 vendors** (see §2).
- Cross-page consistency: **FAIL — AXON** (8.6 vs 8.8 across pages).
- Trust Index row weights: FAIL on `main` for Ramp/Kraken (90%); corrected on this branch by PR #1.
- **Exit code: 1** (confirmed mathematical errors present). The script will exit 0 once the editorial decisions below are resolved and the data is corrected. It reports incomplete records as warnings and never manufactures scores.

## 9. Editorial decisions requiring approval

1. **Which is authoritative — category scores or published totals?** If category scores win, six published totals (and ranks 1–5) change to the recalculated values. If published totals win, the category scores need editorial re-scoring to reproduce them; the auditor will not invent factor scores.
2. **Petratide tier rule.** Tier 1 (numerical threshold reading, matching the Trust Index and brief) or Tier 2 (editorial maturity reading, matching the homepage and profile)? The answer also determines whether tiers are threshold-based or editorial going forward.
3. **Petratide name/domain correction** on the Trust Index row ("Petratide" → "Petratide Science", `petratide.com` → `petratidescience.com`). Evidence is conclusive; bundled here for a single approval.
4. **Classification scale gap** (6.0–6.4): adopt the recommended complete scale or an alternative.
5. **AXON canonical profile**: the Trust Index links to the legacy `vendors/axon-vendor-profile.html`; the homepage strip links to the current `vendors/axon.html` (which hosts the name decoder). Recommend the Index link to `axon.html`; the legacy page stays live with a corrected score.

Nothing in this report merges or deploys without approval.
