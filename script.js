async function loadNews() {
  const container = document.getElementById("news-container");
  container.innerHTML = "<p>読み込み中...</p>";

  try {
    const res = await fetch("data/summary.json", { cache: "no-store" });
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
        url: a.url || "#",            // URL が無いので # に
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
