#!/usr/bin/env node
/**
 * PROTOKOL X Vendor Trust Index — mathematical validation.
 *
 * Reads data/vendor-trust.json (the single authoritative data source) and
 * the published HTML pages, then:
 *   1. Confirms all category weights sum to 1.00.
 *   2. Rejects invalid category scores (non-numeric, out of 0-10 range,
 *      or finer than one decimal place).
 *   3. Detects missing categories.
 *   4. Recalculates totals from authoritative data (exact integer math,
 *      round half-up to one decimal for display).
 *   5. Checks published totals (JSON record + HTML pages) against
 *      calculated totals.
 *   6. Detects inconsistent vendor scores across pages.
 *   7. Reports incomplete or unverifiable records as warnings.
 *
 * Exit code 1 for confirmed mathematical errors. Missing source data
 * produces a warning / INCOMPLETE status, never a silent pass, and the
 * script never manufactures scores.
 *
 * Usage: node scripts/validate-trust-index.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'vendor-trust.json');
const INDEX_PATH = path.join(ROOT, 'trust-index.html');

// Display names used on the Trust Index rows (may differ from JSON names).
const INDEX_NAMES = {
  swisschems: 'SwissChems',
  ion: 'ION Peptide',
  axon: 'AXON',
  petratide: 'Petratide',
  peptipura: 'Peptipura',
  ramp: 'Ramp',
  kraken: 'The Kraken Pep',
};

const errors = [];
const warnings = [];

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`Cannot read ${path.relative(ROOT, p)}: ${e.message}`);
    return null;
  }
}

/** Exact weighted total in thousandths, using integer math. */
function weightedTotalThousandths(scores, weights) {
  let sum = 0;
  for (const key of Object.keys(weights)) {
    const score = scores[key];
    const w = weights[key];
    const tenths = Math.round(score * 10);
    const hundredths = Math.round(w * 100);
    sum += tenths * hundredths;
  }
  return sum; // total = sum / 1000
}

/** Round thousandths to one decimal place, half-up. Returns tenths. */
function roundToTenths(thousandths) {
  return Math.floor((thousandths + 50) / 100);
}

function parseIndexRows(html) {
  const rows = {};
  const re = /<article class="vendor-row (t\d)">([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const body = m[2];
    const name = /<h2 class="vendor-name">([^<]+)<\/h2>/.exec(body);
    const tier = /<div class="tier-badge">(Tier \d)<\/div>/.exec(body);
    const score = /<div class="score">\s*([\d.]+)/.exec(body);
    const weights = {};
    const wRe = /data-code="(\w+)">[^<]*<span class="weight">([\d.]+)%<\/span>/g;
    let w;
    while ((w = wRe.exec(body)) !== null) weights[w[1]] = Number(w[2]);
    if (name) {
      rows[name[1].trim()] = {
        rowClass: m[1],
        tier: tier ? tier[1] : null,
        score: score ? Number(score[1]) : null,
        weights,
      };
    }
  }
  return rows;
}

function extractTotals(html) {
  const out = [];
  const patterns = [
    /<div class="total-score-num">\s*([\d.]+)\s*<\/div>/g,
    /<div class="score"><strong>\s*([\d.]+)\s*<\/strong>/g,
    /<div class="metric">\s*([\d.]+)\s*\/ 10<\/div>/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) out.push(Number(m[1]));
  }
  return out;
}

function main() {
  const data = loadJson(DATA_PATH);
  if (!data) return report();

  // 1. Weights sum to 1.00 (integer hundredths).
  const weightKeys = Object.keys(data.weights || {});
  const weightSum = weightKeys.reduce(
    (s, k) => s + Math.round(data.weights[k] * 100), 0);
  if (weightSum !== 100) {
    fail(`Official weights sum to ${weightSum / 100}, expected 1.00.`);
  }
  if (weightKeys.length !== 8) {
    fail(`Expected 8 official weight categories, found ${weightKeys.length}.`);
  }

  // Index rows (cross-page check source).
  let indexRows = null;
  if (fs.existsSync(INDEX_PATH)) {
    indexRows = parseIndexRows(fs.readFileSync(INDEX_PATH, 'utf8'));
  } else {
    warn('trust-index.html not found; skipping Trust Index cross-check.');
  }

  for (const vendor of data.vendors || []) {
    const label = `${vendor.display_name} (${vendor.id})`;
    const scores = vendor.category_scores || {};

    // 2-3. Category completeness + validity.
    const missing = weightKeys.filter((k) => scores[k] == null);
    if (missing.length > 0) {
      warn(`${label}: INCOMPLETE — missing category scores: ` +
        `${missing.join(', ')}. Total is UNVERIFIABLE.`);
      continue;
    }
    let valid = true;
    for (const k of weightKeys) {
      const s = scores[k];
      if (typeof s !== 'number' || Number.isNaN(s) || s < 0 || s > 10) {
        fail(`${label}: invalid category score ${k}=${s} (must be 0-10).`);
        valid = false;
      } else if (Math.abs(s * 10 - Math.round(s * 10)) > 1e-9) {
        fail(`${label}: category score ${k}=${s} is finer than one decimal.`);
        valid = false;
      }
    }
    if (!valid) continue;

    // 4. Recalculate.
    const thousandths = weightedTotalThousandths(scores, data.weights);
    const calcTenths = roundToTenths(thousandths);
    const calc = calcTenths / 10;
    const calcStr = calc.toFixed(1);

    // 5. JSON-recorded published totals vs calculated.
    const published = [];
    const pub = vendor.published_totals || {};
    if (pub.trust_index != null) published.push(['trust_index', pub.trust_index]);
    if (pub.brief != null) published.push(['brief', pub.brief]);
    for (const p of pub.profiles || []) published.push(['profile', p]);
    for (const [src, value] of published) {
      if (Math.abs(value - calc) > 1e-9) {
        fail(`${label}: published total (${src}) ${value} does not match ` +
          `recalculated total ${calcStr}.`);
      }
    }
    // 6. Cross-page score consistency (JSON record).
    const distinct = [...new Set(published.map(([, v]) => v))];
    if (distinct.length > 1) {
      fail(`${label}: inconsistent published totals across pages: ` +
        `${distinct.join(', ')}.`);
    }
    if (vendor.tier_conflict) {
      warn(`${label}: tier labels differ across pages: ` +
        `${JSON.stringify(vendor.tier)}. Editorial decision required.`);
    }

    // Cross-page checks against the HTML files themselves.
    if (indexRows) {
      const row = indexRows[INDEX_NAMES[vendor.id]];
      if (!row) {
        warn(`${label}: no Trust Index row found for ` +
          `"${INDEX_NAMES[vendor.id]}".`);
      } else {
        if (row.score != null && Math.abs(row.score - calc) > 1e-9) {
          fail(`${label}: Trust Index row score ${row.score} does not ` +
            `match recalculated total ${calcStr}.`);
        }
        const rowWeightSum = Object.values(row.weights)
          .reduce((s, v) => s + v, 0);
        if (Object.keys(row.weights).length !== 8 || rowWeightSum !== 100) {
          fail(`${label}: Trust Index row weights sum to ${rowWeightSum}% ` +
            `over ${Object.keys(row.weights).length} categories ` +
            `(expected 100% over 8).`);
        }
      }
    }
    for (const rel of vendor.evidence || []) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) {
        warn(`${label}: evidence file missing: ${rel}.`);
        continue;
      }
      const html = fs.readFileSync(abs, 'utf8');
      for (const value of extractTotals(html)) {
        if (Math.abs(value - calc) > 1e-9) {
          fail(`${label}: published total ${value} in ${rel} does not ` +
            `match recalculated total ${calcStr}.`);
        }
      }
    }
  }

  return report();
}

function report() {
  console.log('PROTOKOL X Trust Index validation');
  console.log(`Errors: ${errors.length}  Warnings: ${warnings.length}`);
  for (const e of errors) console.log(`  ERROR: ${e}`);
  for (const w of warnings) console.log(`  WARNING: ${w}`);
  if (errors.length > 0) {
    console.log('RESULT: FAIL — confirmed mathematical errors present.');
    return 1;
  }
  if (warnings.length > 0) {
    console.log('RESULT: PASS WITH WARNINGS — see incomplete/unverified ' +
      'records above.');
    return 0;
  }
  console.log('RESULT: PASS');
  return 0;
}

process.exit(main());
