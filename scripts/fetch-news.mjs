import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";

const FEEDS = [
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "BBC Technology", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" }
];

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchFeed({ name, url }) {
  const res = await fetch(url);
  const text = await res.text();
  const xml = parser.parse(text);

  const items = xml.rss?.channel?.item || xml.feed?.entry || [];
  return items.slice(0, 3).map(it => ({
    source: name,
    title: it.title,
    url: it.link?.["@_href"] || it.link || "",
    summary: it.description || "(要約準備中)"
  }));
}

async function main() {
  const results = [];
  for (const feed of FEEDS) {
    const data = await fetchFeed(feed);
    results.push(...data);
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    top: results
  };

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("docs/data/news.json", JSON.stringify(payload, null, 2));
  console.log("✅ docs/data/news.json updated!");
}

main();
