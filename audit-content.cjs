const cheerio = require("cheerio");

const BASE_URL = "https://certblueprint.com";
const START_URLS = [BASE_URL];

const seen = new Set();
const results = [];

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function wordCount(text) {
  return cleanText(text).split(/\s+/).filter(Boolean).length;
}

async function crawl(url) {
  if (seen.has(url) || !url.startsWith(BASE_URL)) return;
  seen.add(url);

  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer").remove();

    const title = $("title").text().trim();
    const description = $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1").first().text().trim();
    const h2s = $("h2").length;
    const links = new Set();

    $("a[href]").each((_, a) => {
      const href = $(a).attr("href");
      if (!href) return;
      const next = new URL(href, BASE_URL).href.split("#")[0];
      if (next.startsWith(BASE_URL)) links.add(next);
    });

    const text = cleanText($("body").text());
    const words = wordCount(text);

    results.push({
      url,
      words,
      title: title || "MISSING",
      description: description || "MISSING",
      h1: h1 || "MISSING",
      h2_count: h2s,
      internal_links_found: links.size,
      thin_risk:
        words < 300 ? "HIGH" :
        words < 700 ? "MEDIUM" :
        "LOW"
    });

    for (const link of links) {
      await crawl(link);
    }
  } catch (err) {
    results.push({ url, error: err.message });
  }
}

(async () => {
  for (const url of START_URLS) await crawl(url);

  results.sort((a, b) => (a.words || 0) - (b.words || 0));

  console.table(results);

  console.log("\nLIKELY THIN / LOW VALUE PAGES:");
  console.log(results.filter(r => r.words < 700));
})();