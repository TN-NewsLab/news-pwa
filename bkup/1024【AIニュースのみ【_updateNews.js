// updateNews.js
import axios from "axios";
import fs from "fs";

// NewsAPI（https://newsapi.org/）から取得する設定
const API_KEY = "2ff7e068b52f45f69a03034c801a2a6f"; // ←あとで取得したキーを入れる
const URL = `https://newsapi.org/v2/top-headlines?category=technology&country=jp&pageSize=3&apiKey=${API_KEY}`;

async function updateNews() {
  try {
    const res = await axios.get(URL);
    const articles = res.data.articles.map(a => ({
      title: a.title,
      summary: a.description || "（要約なし）",
      url: a.url,
    }));

    // news.jsonを読み込み（なければ空で作成）
    let data = {};
    if (fs.existsSync("./news.json")) {
      data = JSON.parse(fs.readFileSync("./news.json", "utf-8"));
    }

    data.AI = articles; // ← AIカテゴリを更新

    fs.writeFileSync("./news.json", JSON.stringify(data, null, 2));
    console.log("✅ AIニュースを更新しました！");
  } catch (err) {
    console.error("❌ 取得エラー:", err.message);
  }
}

updateNews();
