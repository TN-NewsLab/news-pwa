let currentCategory = "ニュース";

async function loadNews() {
  const container = document.getElementById("news-container");
  container.innerHTML = "<p>読み込み中...</p>";

  try {
    const res = await fetch(`./data/summary_v2.json`);

    const rawData = await res.json();

    container.innerHTML = ""; // 初期化

    // ----------------------------------------
    // 今の summary_v2.json は「配列」なので、そのまま受け取る
    // ----------------------------------------
    const articles = Array.isArray(rawData) ? rawData : [];

    // ----------------------------------------
    // 1件ずつカードを作って追加
    //   → script_v2.js 本来の createNewsCard をそのまま活かす
    // ----------------------------------------
    const section = document.createElement("section");
    section.innerHTML = `<h1 class="section-title">${currentCategory}</h1>`;

    articles.forEach(a => {
      // publishedAt / url / category がないので安全に埋める
      const safeArticle = {
        title: a.title || "No title",
        summary: a.summary || "",
        source: a.source || "unknown",
        tag: convertCategoryName(a.category) || "その他",
        url: a.url || a.link || "#",      // 追加した。重要！
        publishedAt: a.publishedAt || ""  // RSSに公開日時があればその値を使う
      };

      section.appendChild(createNewsCard(safeArticle));
    });

    container.appendChild(section);

    // ----------------------------------------
    // タグフィルタを有効化
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

  // タグを決める（tag → category → "その他" の順に採用）
  const tag = article.tag || "その他";

  // フィルタ用に data-tag 属性を付与
  card.dataset.tag = tag;

  card.innerHTML = `
    <h2 class="news-title">${article.title}</h2>
    <p class="news-summary">${article.summary}</p>
    <p class="news-meta">
      <span class="news-tag">${tag}</span>
      <span>${article.source}</span> / <span>${formatDate(article.publishedAt)}</span>
    </p>
    <a class="news-link" href="${article.url}" target="_blank">元記事を読む ↗</a>
  `;

  // ここで生成した .news-tag を取得
  const tagElement = card.querySelector(".news-tag");

  // タグ名に応じてクラスを付与
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

      // セクションタイトル（青いバー）
      const titleEl = document.querySelector(".section-title");
      if (titleEl) {
        titleEl.textContent =
          selectedTag === "all" ? "ニュース" : selectedTag;
      }

      // カードの表示・非表示を切り替え
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
// カテゴリ正規関数化
// ------------------------------------------------------
function convertCategoryName(raw) {
  const key = (raw ?? "").toString().trim();
  if (!key) return "その他";

  // もう 3カテゴリに寄せる（厳密に）
  if (key === "AI") return "AI";
  if (key === "経済") return "経済";
  if (key === "その他") return "その他";

  // 念のため：英語が来た時の救済（将来用）
  const lower = key.toLowerCase();
  if (lower === "ai") return "AI";
  if (["economy", "business", "finance", "market"].includes(lower)) return "経済";

  return "その他";
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

