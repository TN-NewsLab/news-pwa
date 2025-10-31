import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";

const FEEDS = [
  { name: "Reuters Top", url: "https://feeds.reuters.com/reuters/topNews" },
  { name: "Bloomberg Tech", url: "https://feeds.bloomberg.com/technology/news.rss" },
  { name: "NHK", url: "https://www3.nhk.or.jp/rss/news/cat0.xml" }
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
  fs.writeFileSync("data/news.json", JSON.stringify(payload, null, 2));
  console.log("✅ data/news.json updated!");
}

main();
