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
        "translated_title_ja": str,
        "translated_summary_ja": str,
        "error": "" | "JSON_PARSE_FAILED"
      }
    """
    out = {
        "translated_title_ja": "",
        "translated_summary_ja": "",
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

    title = data.get("translated_title_ja", data.get("title_ja", ""))
    summary = data.get("translated_summary_ja", data.get("summary_ja", ""))

    out["translated_title_ja"] = title.strip() if isinstance(title, str) else str(title)
    out["translated_summary_ja"] = summary.strip() if isinstance(summary, str) else str(summary)
    return out
