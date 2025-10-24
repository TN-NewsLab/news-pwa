async function loadNews() {
  try {
    const res = await fetch('./news.json');
    const data = await res.json();

    const aiContainer = document.getElementById('ai-list');
    const bizContainer = document.getElementById('biz-list');

    // AIニュース
    data.AI.forEach(n => {
      aiContainer.innerHTML += `
        <div class="card">
          <a href="${n.url}" target="_blank">${n.title}</a>
          <p>${n.summary}</p>
        </div>`;
    });

    // 経済ニュース
    data["経済"].forEach(n => {
      bizContainer.innerHTML += `
        <div class="card">
          <a href="${n.url}" target="_blank">${n.title}</a>
          <p>${n.summary}</p>
        </div>`;
    });
  } catch (err) {
    console.error('ニュース読み込みエラー:', err);
  }
}

loadNews();
