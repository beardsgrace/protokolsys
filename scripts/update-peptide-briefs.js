const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTFILE = path.join(ROOT, 'data', 'peptide-briefs.json');
const QUERY = [
  'peptide[Title]',
  'peptides[Title]',
  'GLP-1[Title]',
  'tirzepatide[Title]',
  'retatrutide[Title]',
  'semaglutide[Title]'
].join(' OR ');
const TOPIC_PATTERN = /\b(peptide|peptides|glp-1|tirzepatide|retatrutide|semaglutide)\b/i;

function todayLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles'
  });
}

function cleanTitle(title) {
  return String(title || '')
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .trim();
}

function todayForPubMed(date = new Date()) {
  return date.toISOString().slice(0, 10).replaceAll('-', '/');
}

function firstYear(value) {
  const match = String(value || '').match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PROTOKOLX/1.0 (peptide research briefs)' }
  });
  if (!response.ok) {
    throw new Error(`PubMed request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  const searchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  searchUrl.searchParams.set('db', 'pubmed');
  searchUrl.searchParams.set('term', QUERY);
  searchUrl.searchParams.set('retmode', 'json');
  searchUrl.searchParams.set('sort', 'pub date');
  searchUrl.searchParams.set('datetype', 'pdat');
  searchUrl.searchParams.set('maxdate', todayForPubMed());
  searchUrl.searchParams.set('retmax', '25');

  const search = await getJson(searchUrl);
  const ids = search?.esearchresult?.idlist || [];
  if (!ids.length) {
    throw new Error('PubMed returned no article IDs.');
  }

  const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
  summaryUrl.searchParams.set('db', 'pubmed');
  summaryUrl.searchParams.set('id', ids.join(','));
  summaryUrl.searchParams.set('retmode', 'json');

  const summary = await getJson(summaryUrl);
  const items = ids
    .map((id) => summary?.result?.[id])
    .filter(Boolean)
    .map((item) => ({
      pmid: String(item.uid),
      title: cleanTitle(item.title),
      source: item.fulljournalname || item.source || 'PubMed',
      date: item.pubdate || '',
      url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`
    }))
    .filter((item) => item.title && item.url && TOPIC_PATTERN.test(item.title))
    .filter((item) => {
      const year = firstYear(item.date);
      return !year || year <= new Date().getUTCFullYear();
    })
    .slice(0, 3);

  if (!items.length) {
    throw new Error('PubMed summaries did not include usable articles.');
  }

  await fs.mkdir(path.dirname(OUTFILE), { recursive: true });
  await fs.writeFile(OUTFILE, `${JSON.stringify({
    updatedAt: new Date().toISOString(),
    updatedLabel: `Updated ${todayLabel()}`,
    source: 'PubMed',
    query: QUERY,
    items
  }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
