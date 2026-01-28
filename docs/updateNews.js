import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 汎用ニュース取得関数
async function fetchNews(category, country = "jp", pageSize = 3) {
  const URL = `https://newsapi.org/v2/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}&apiKey=${OPENAI_API_KEY}`;
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
    if (fs.existsSync("./data/news.json")) {
      data = JSON.parse(fs.readFileSync("./data/news.json", "utf-8"));
    }

    // データ更新
    data.updatedAt = new Date().toISOString();
    data.categories = {
      AI: aiNews,
      Economy: economyNews
    };

    // ファイル保存
    fs.writeFileSync("./data/news.json", JSON.stringify(data, null, 2));

    console.log("✅ AI・経済ニュースを更新しました！");
  } catch (err) {
    console.error("❌ 取得エラー:", err.message);
  }
}

updateNews();
