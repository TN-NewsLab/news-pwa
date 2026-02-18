import json


def strip_code_fence(text: str) -> str:
    """Remove ```...``` fences if present and return stripped text."""
    text = text.strip()
    if not text.startswith("```"):
        return text

    lines = text.splitlines()
    lines = [line for line in lines if not line.strip().startswith("```")]
    return "\n".join(lines).strip()


def parse_translation_response(content) -> dict:
    """
    Parse model output into a fixed dict schema.

    Returns:
      {
        "en_title": str,
        "en_summary": str,
        "error": "" | "JSON_PARSE_FAILED"
      }
    """
    out = {
        "en_title": "",
        "en_summary": "",
        "error": ""
    }

    if not isinstance(content, str):
        content = str(content)

    text = strip_code_fence(content)

    try:
        data = json.loads(text)
    except Exception:
        out["error"] = "JSON_PARSE_FAILED"
        return out

    title = data.get("en_title", data.get("title_ja", ""))
    summary = data.get("en_summary", data.get("summary_ja", ""))

    out["en_title"] = title.strip() if isinstance(title, str) else str(title)
    out["en_summary"] = summary.strip() if isinstance(summary, str) else str(summary)
    return out
