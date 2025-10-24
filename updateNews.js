import axios from "axios";
import fs from "fs";

const API_KEY = "2ff7e068b52f45f69a03034c801a2a6f"; // ←前回と同じキーでOK

// 汎用ニュース取得関数
async function fetchNews(category, country = "jp", pageSize = 3) {
  const URL = `https://newsapi.org/v2/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}&apiKey=${API_KEY}`;
  const res = await axios.get(URL);
  return res.data.articles.map(a => ({
    title: a.title,
    summary: a.description || "（要約なし）",
    url: a.url,
  }));
}

async function updateNews() {
  try {
    console.log("🔄 ニュースを取得中…");

    // AIカテゴリ
    const aiNews = await fetchNews("technology");

    // 経済カテゴリ
    const economyNews = await fetchNews("business");

    // 既存データを読み込み（なければ空）
    let data = {};
    if (fs.existsSync("./news.json")) {
      data = JSON.parse(fs.readFileSync("./news.json", "utf-8"));
    }

    // データ更新
    data.AI = aiNews;
    data.経済 = economyNews;

    // ファイル保存
    fs.writeFileSync("./news.json", JSON.stringify(data, null, 2));

    console.log("✅ AI・経済ニュースを更新しました！");
  } catch (err) {
    console.error("❌ 取得エラー:", err.message);
  }
}

updateNews();
