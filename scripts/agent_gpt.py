import os
import feedparser
import json
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

# 1) .env 読み込み
load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=API_KEY)

RSS_SOURCES = {
    "ai": {
        "source": "VentureBeat",
        "url": "https://venturebeat.com/category/ai/feed/"
    },
    "economy": {
        "source": "Bloomberg",
        "url": "https://www.bloomberg.com/feeds/markets/news.rss"
    },
    "world": {
        "source": "BBC",
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml"
    },
    "japan_politics": {
        "source": "NHK",
        "url": "https://www3.nhk.or.jp/rss/news/cat3.xml"
    }
}

# ********** RSS取得 **********
def fetch_rss(url):
    feed = feedparser.parse(url)
    # 記事が空でない時だけ1件
    return feed.entries[0] if feed.entries else None

def fetch_rss_ai_multiple(url, max_items=2):
    """
    AIカテゴリ専用：OpenAI/ChatGPT関連を優先しつつ、
    最大 max_items 件のニュースを返す関数。
    """
    feed = feedparser.parse(url)
    entries = feed.entries

    if not entries:
        return []

    keywords = ["openai", "chatgpt", "sam altman", "gpt", "large language model"]

    # --- ① 優先記事（OpenAI/ChatGPT関連）を先に取得
    priority_items = []
    normal_items = []

    for e in entries:
        text = (e.title + " " + e.get("summary", "")).lower()
        if any(k in text for k in keywords):
            priority_items.append(e)
        else:
            normal_items.append(e)

    # --- ② 優先 → 通常 の順で max_items 件取り出す
    combined = priority_items + normal_items
    return combined[:max_items]

# ********** title・summary抽出 / 3行要約 **********
def summarize(text, title=""):
    if not text or text.strip() == "":
        prompt = (
            "次のニュースタイトルから、記事の内容を推測して3行の要約文を生成してください。\n"
            f"タイトル: {title}\n"
        )
    else:
        prompt = f"次の記事を3行で要約してください：\n{text}"
    
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    content = res.choices[0].message.content

    # content が文字列の場合
    if isinstance(content, str):
        return content

    # content が配列（MessageContent）で返る場合
    if isinstance(content, list) and len(content) > 0:
        first = content[0]
        # text属性を持つタイプ
        if hasattr(first, "text"):
            return first.text
        # 万が一 text がなくても string_value がある
        if hasattr(first, "string_value"):
            return first.string_value

    # それでもダメなら、とりあえず文字列化して返す
    return str(content)

 # ********** カテゴリ判定 **********
def classify_category(title, summary, initial_category):
    text = (title + " " + summary).lower()

    # --- AI キーワード ---
    ai_keywords = [
        "ai", "artificial intelligence", "gpt", "chatgpt",
        "openai", "neural", "model", "llm", "gemini",
        "anthropic", "deepseek", "生成ai", "機械学習"
    ]

    # --- 経済 キーワード ---
    economy_keywords = [
        "stock", "market", "shares", "inflation", "finance",
        "経済", "企業", "株", "景気", "賃金", "資金", "金利"
    ]

    # --- ① AI判定 ---
    if any(k in text for k in ai_keywords):
        return "AI"

    # --- ② 経済判定 ---
    if any(k in text for k in economy_keywords):
        return "経済"

    # --- ③ どちらでもない場合 → その他 ---
    return "その他"

# ********** timestamp生成 **********
def format_timestamp(entry):
    """
    RSSのpubDateをJSTの 'YYYY-MM-DD HH:MM' に統一。
    pubDateが無ければ現在時刻を使用。
    """
    try:
        if hasattr(entry, "published"):
            dt = feedparser._parse_date(entry.published)
        elif hasattr(entry, "updated"):
            dt = feedparser._parse_date(entry.updated)
        else:
            dt = None
    except:
        dt = None

    # pubDate取得失敗 → 今の日時を使う
    if dt is None:
        dt_obj = datetime.now(timezone.utc)
    else:
        dt_obj = datetime(*dt[:6], tzinfo=timezone.utc)

    # JSTへ変換
    jst = dt_obj.astimezone(timezone(timedelta(hours=9)))

    # フォーマット
    return jst.strftime("%Y-%m-%d %H:%M")

def main():
    output_items = []

    for category, info in RSS_SOURCES.items():
        print(f"\n🔁 [{info['source']}] RSS取得中...")

        # --- AIカテゴリは 2件ロジック ---
        if category == "ai":
            entries = fetch_rss_ai_multiple(info["url"], max_items=2)

        else:
            # --- それ以外のカテゴリは通常1件 ---
            entry = fetch_rss(info["url"])
            if not entry:
                print(f"⚠️ {info['source']} のRSSが取得できませんでした。")
                continue
            entries = [entry]  # ← 1件をリスト化して統一処理にする

        # --- entriesの共通処理 ---
        for entry in entries:
            title = entry.title
            link = entry.link
            description = entry.summary if hasattr(entry, "summary") else ""

            print(f"🧠 [{info['source']}] 要約中...")
            summary = summarize(description, title)

            category_final = classify_category(title, summary, category)

            timestamp = format_timestamp(entry)

            output_items.append({
                "source": info['source'],
                "title": title,
                "summary": summary,
                "link": link,
                "category": category_final
            })

    output = {"news": output_items}

    with open("summary.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\n✅ 複数ニュースまとめて summary.json を生成しました！")

if __name__ == "__main__":
    main()

