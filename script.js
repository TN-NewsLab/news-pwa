async function loadNews() {
  const container = document.getElementById("news-container");
  container.innerHTML = "<p>読み込み中...</p>";

  try {
    const res = await fetch("data/summary_v2.json", { cache: "no-store" });

    const rawData = await res.json();

    container.innerHTML = ""; // 初期化

    // ----------------------------------------
    // ① 今の summary.json は「配列」なので、そのまま受け取る
    // ----------------------------------------
    const articles = Array.isArray(rawData) ? rawData : [];

    // ----------------------------------------
    // ② 1件ずつカードを作って追加
    //     → script.js 本来の createNewsCard をそのまま活かす
    // ----------------------------------------
    const section = document.createElement("section");
    section.innerHTML = `<h1 class="section-title">ニュース</h1>`;

    articles.forEach(a => {
      // publishedAt / url / category がないので安全に埋める
      const safeArticle = {
        title: a.title || "No title",
        summary: a.summary || "",
        source: a.source || "unknown",
        tag: "その他",                // デフォルトタグ
        // url: a.url || "#",            // URL が無いので # に
        url: a.url || a.link || "#",  // ← 追加した！重要！
        publishedAt: a.timestamp || ""// placeholder の timestamp を使用
      };

      section.appendChild(createNewsCard(safeArticle));
    });

    container.appendChild(section);

    // ----------------------------------------
    // ③ タグフィルタを有効化
    // ----------------------------------------
    setupTagFilter();

  } catch (error) {
    console.error("ニュース取得エラー:", error);
    container.innerHTML = "<p>ニュースを読み込めませんでした。</p>";
  }
}

// ------------------------------------------------------
// ニュースカード生成（タイトル → 要約）
// ------------------------------------------------------
function createNewsCard(article) {
  const card = document.createElement("div");
  card.className = "news-card";

  // 🔹 タグを決める（tag → category → "その他" の順に採用）
  const tag = article.tag || article.category || "その他";

  // 🔹 フィルタ用に data-tag 属性を付与
  card.dataset.tag = tag;

  card.innerHTML = `
    <h2 class="news-title">${article.title}</h2>
    <p class="news-summary">${article.summary}</p>
    <p class="news-meta">
      <span class="news-tag">${tag}</span>
      <span>${article.source}</span> / <span>${formatDate(article.publishedAt)}</span>
    </p>
    <a class="news-link" href="${article.url}" target="_blank">続きを読む ↗</a>
  `;

  // 💡 ここで生成した .news-tag を取得
  const tagElement = card.querySelector(".news-tag");

  // 💡 タグ名に応じてクラスを付与
  const tagClass =
      tag === "AI" ? "tag-ai" :
      tag === "経済" ? "tag-economy" :
      tag === "その他" ? "tag-other" :
      "tag-all";

  tagElement.classList.add(tagClass);

  return card;
}

function setupTagFilter() {
  const buttons = document.querySelectorAll(".tag-button");
  const cards = document.querySelectorAll(".news-card");

  if (!buttons.length || !cards.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTag = button.dataset.tag; // "all" or "AI" etc.

      // アクティブな見た目を更新
      buttons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");

      // カードの表示/非表示を切り替え
      cards.forEach((card) => {
        const cardTag = card.dataset.tag || "その他";

        if (selectedTag === "all" || cardTag === selectedTag) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// ------------------------------------------------------
// カテゴリ名の日本語化
// ------------------------------------------------------
function convertCategoryName(key) {
  const map = {
    "AI": "AIニュース",
    "Economy": "経済ニュース",
    "Politics": "政治ニュース"
  };
  return map[key] || key;
}

// ------------------------------------------------------
// 日付フォーマット
// ------------------------------------------------------
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ja-JP");
  } catch {
    return iso;
  }
}

// 読み込み開始
loadNews();

