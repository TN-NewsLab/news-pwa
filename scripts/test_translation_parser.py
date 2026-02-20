import unittest
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from translation_parser import parse_translation_response


class ParseTranslationResponseTests(unittest.TestCase):
    def test_parse_fenced_json(self):
        content = '''```json
{"title_ja":"日本語タイトル", "summary_ja":"日本語要約"}
```'''
        got = parse_translation_response(content)
        self.assertEqual(got["translated_title_ja"], "日本語タイトル")
        self.assertEqual(got["translated_summary_ja"], "日本語要約")
        self.assertEqual(got["error"], "")

    def test_parse_non_json(self):
        content = "This is not JSON"
        got = parse_translation_response(content)
        self.assertEqual(got["translated_title_ja"], "")
        self.assertEqual(got["translated_summary_ja"], "")
        self.assertEqual(got["error"], "JSON_PARSE_FAILED")


if __name__ == "__main__":
    unittest.main()
