async function loadNews() {
  const response = await fetch("news.json");
  const data = await response.json();

  renderSection("AI", data.AI);
  renderSection("BIZ", data.BIZ); // 経済ニュースも読み込む
}

function renderSection(sectionId, articles) {
  const container = document.getElementById(`${sectionId.toLowerCase()}-list`);
  container.innerHTML = "";

  if (!articles) return;

  articles.forEach(article => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="tag">${article.tag}</div>
      <h3>${article.title}</h3>
      <p>${article.summary}</p>
      <div class="meta">
        <span class="date">${article.date}</span>
        <span class="source">${article.source}</span>
      </div>
      <a href="${article.url}" target="_blank">続きを読む →</a>
    `;

    container.appendChild(card);
  });
}

loadNews();
