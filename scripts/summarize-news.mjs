// /scripts/summarize-news.mjs
import dotenv from "dotenv";
dotenv.config();  // ←★これを追加！
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === 設定 ===
const NEWS_PATH = path.resolve("news.json");
const MAX_ITEMS = process.argv.includes("--max") 
  ? Number(process.argv[process.argv.indexOf("--max")+1]) 
  : 20;                              // まとめてやりすぎない
const DRY_RUN = process.argv.includes("--dry"); // 変更を書き戻さない
const CONCURRENCY = 3;               // 同時実行上限（控えめ）
const MODEL = "gpt-4.1-mini";        // コスパ系モデル例（後で変更可）
const TIMEOUT_MS = 60_000;

// === 文章スタイル（日本語・3行） ===
const systemPrompt = `
あなたはニュース記事を要約するアシスタントです。
制約:
- 出力は日本語。3行の箇条書き。「・」で始める
- 1行は最大80〜120字程度。重複や煽り表現はしない
- 事実を簡潔に/因果が分かる形で/主語を明確に
- 絵文字・顔文字・ハッシュタグは不可
`;

function buildUserPrompt({ title, source, description, content, link }) {
  // content が無ければ description で代替
  const base = content?.trim() || description?.trim() || title;
  return `
▼メタ情報
- タイトル: ${title ?? ""}
- ソース: ${source ?? ""}
- URL: ${link ?? ""}

▼要約対象テキスト
${base}

▼出力フォーマット（厳守）
・
・
・
`.trim();
}

async function summarizeOne(item) {
  const userPrompt = buildUserPrompt(item);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await openai.responses.create({
      model: MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      // 将来JSON構造化する場合は Structured Outputs を検討（後述）
    }, { signal: controller.signal });

    // SDKの標準レスポンスからテキスト抽出
    const text = res.output_text?.trim?.() 
      ?? res.content?.[0]?.text?.trim?.() 
      ?? "";
    if (!text) throw new Error("空の応答");

    // ガード：3行に整形
    const lines = text
      .split("\n")
      .map(s => s.trim())
      .filter(s => s)
      .slice(0, 3);

    return lines.join("\n");
  } catch (err) {
    // シンプルな指数バックオフ
    console.error("summarize error:", err?.message || err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const raw = await fs.readFile(NEWS_PATH, "utf8");
  //const items = JSON.parse(raw);
  let json = JSON.parse(raw);
  // 配列でなければ、articles配列などを抽出
  const items = Array.isArray(json) ? json : (json.articles || json.items || []);

  // 対象の選定：summary未生成 or 古いもの
  const targets = items
    .filter(it => !it.summary)
    .slice(0, MAX_ITEMS);

  if (targets.length === 0) {
    console.log("要約対象なし");
    return;
  }

  console.log(`要約対象: ${targets.length}件（最大${MAX_ITEMS}件）`);

  // 素朴なキュー（並列CONCURRENCY）
  let idx = 0;
  const runWorker = async () => {
    while (idx < targets.length) {
      const myIndex = idx++;
      const it = targets[myIndex];
      try {
        const summary = await summarizeOne(it);
        it.summary = summary;
        it.summary_at = new Date().toISOString();
        console.log(`✅ summarized: ${it.title}`);
      } catch {
        it.summary_error = true;
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, runWorker));

  if (DRY_RUN) {
    console.log("DRY-RUN: ファイルは書き換えません。");
    return;
  }

  // items をマージして保存
  const map = new Map(items.map(x => [x.link || x.title, x]));
  for (const t of targets) {
    const key = t.link || t.title;
    const base = map.get(key) || t;
    map.set(key, { ...base, ...t });
  }
  const out = Array.from(map.values());

  await fs.writeFile(NEWS_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(`📝 書き込み完了: ${NEWS_PATH}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
