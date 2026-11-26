# -*- coding: utf-8 -*-
"""Regenerate src/data/words.json from the textbook word-list DOCX.

Usage:
    python tools/build_words.py "C:/path/to/04-单词表-按单元-Word版.docx"

The DOCX stores each lesson as six tables (基础会话 / 应用会话1 / 应用会话2 /
正文 / 句型 / 注解). Rows are read in document order so every word keeps its
lesson and section. Readings come from the full-width brackets after the
headword, e.g. 小学校（しょうがっこう）.
"""
import io
import json
import os
import re
import sys
from collections import Counter

try:  # Windows consoles default to GBK and cannot print Japanese kana.
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001 - older interpreters simply keep their default
    pass

import docx

SECTION_LABEL = {
    "基础会话单词": "基础会话",
    "应用会话1单词": "应用会话 1",
    "应用会话2单词": "应用会话 2",
    "正文单词": "正文",
    "句型单词": "句型",
    "注解单词": "注解",
}
SECTION_ORDER = [
    "基础会话单词",
    "应用会话1单词",
    "应用会话2单词",
    "正文单词",
    "句型单词",
    "注解单词",
]

POS_ZH = {
    "—": "未标注",
    "名": "名词",
    "代": "代词",
    "副": "副词",
    "イ形": "い形容词",
    "ナ形": "な形容词",
    "連体": "连体词",
    "接続": "接续词",
    "感": "感叹词",
    "終助": "终助词",
    "取り立て助": "提示助词",
    "連語": "惯用语",
    "接尾": "接尾词",
    "接頭": "接头词",
    "自五": "自动词·五段",
    "他五": "他动词·五段",
    "自下一": "自动词·一段",
    "他下一": "他动词·一段",
    "自上一": "自动词·一段",
    "他上一": "他动词·一段",
    "自他五": "自他动词·五段",
    "自カ": "自动词·カ变",
    "名・ナ形": "名词·な形容词",
    "名・他サ": "名词·他动词(サ变)",
    "名・自サ": "名词·自动词(サ变)",
    "名・自他サ": "名词·自他动词(サ变)",
    "名・助数": "名词·量词",
    "名・副": "名词·副词",
    "名・他サ・ナ形": "名词·他动词(サ变)·な形容词",
    "名・自サ・ナ形": "名词·自动词(サ变)·な形容词",
    "副・自サ": "副词·自动词(サ变)",
    "副・自他サ": "副词·自他动词(サ变)",
    "副・自サ・ナ形": "副词·自动词(サ变)·な形容词",
}

# The book prints no reading above these two entries; both are unambiguous.
MANUAL_READING = {
    "お待たせしました": "おまたせしました",
    "小テスト": "しょうテスト",
}

LESSON_TOPIC = {
    1: "假期生活",
    2: "学习情况及方法",
    3: "外语学习班",
    4: "考试相关情况",
    5: "大学生的课余活动",
    6: "参观公共场所时的注意事项",
    7: "请求他人帮助",
    8: "看病",
}

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "words.json")


def split_word(cell: str):
    match = re.match(r"^(.*?)[（(]([^（()）]*)[）)]\s*$", cell.strip())
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return cell.strip(), ""


def read_rows(path: str):
    document = docx.Document(path)
    paragraphs = {id(p._element): p for p in document.paragraphs}
    tables = {id(t._element): t for t in document.tables}

    unit = lesson = lesson_title = section = None
    rows = []
    for child in document.element.body.iterchildren():
        key = id(child)
        if key in paragraphs:
            text = paragraphs[key].text.strip()
            if not text:
                continue
            if re.match(r"^第[一二三四五六七八九十]+单元", text):
                unit = text
                continue
            match = re.match(r"^第(\d+)课[\s\u3000]*(.*)$", text)
            if match:
                lesson = int(match.group(1))
                lesson_title = match.group(2).strip()
                section = None
                continue
            match = re.match(r"^(基础会话单词|应用会话1单词|应用会话2单词|正文单词|句型单词|注解单词)", text)
            if match:
                section = match.group(1)
            continue
        if key not in tables or lesson is None or section is None:
            continue
        for row in tables[key].rows:
            cells = [c.text.strip() for c in row.cells]
            if not any(cells) or cells[0].startswith("单词"):
                continue
            rows.append({"lesson": lesson, "title": lesson_title, "section": section, "cells": cells})
    return rows


def build(source: str):
    rows = read_rows(source)
    words = []
    seen = set()
    for row in rows:
        surface, kana = split_word(row["cells"][0])
        pos = row["cells"][1].strip() or "—"
        meaning = row["cells"][2].strip()
        if not kana:
            kana = MANUAL_READING.get(surface, "")
        if not kana:
            kana = surface  # kana-only entry, reading equals the headword
        section_index = SECTION_ORDER.index(row["section"]) + 1
        duplicate_key = (surface, kana, meaning, row["lesson"])
        if duplicate_key in seen:
            continue  # the same entry repeated in one lesson's two tables
        seen.add(duplicate_key)
        words.append(
            {
                "id": "",
                "no": 0,
                "lesson": row["lesson"],
                "section": section_index,
                "surface": surface,
                "kana": kana,
                "meaning": meaning,
                "pos": pos,
                "posZh": POS_ZH.get(pos, pos),
            }
        )

    for index, word in enumerate(words, 1):
        word["no"] = index
        word["id"] = f"w{index:03d}"

    lesson_titles = {}
    for paragraph in docx.Document(source).paragraphs:
        match = re.match(r"^第(\d+)课[\s\u3000]*(.*)$", paragraph.text.strip())
        if match:
            lesson_titles[int(match.group(1))] = match.group(2).strip()

    lessons = []
    for lesson in range(1, 9):
        count = sum(1 for w in words if w["lesson"] == lesson)
        lessons.append(
            {
                "lesson": lesson,
                "title": lesson_titles.get(lesson, ""),
                "topic": LESSON_TOPIC.get(lesson, ""),
                "unit": 1 if lesson <= 4 else 2,
                "count": count,
            }
        )

    units = [
        {"unit": 1, "label": "第一单元", "range": "第 1〜4 课", "lessons": [1, 2, 3, 4]},
        {"unit": 2, "label": "第二单元", "range": "第 5〜8 课", "lessons": [5, 6, 7, 8]},
    ]

    payload = {
        "meta": {
            "title": "新经典日本语 基础教程 第二册（第三版）",
            "scope": "第 1〜8 课 · 不含练习单词",
            "count": len(words),
            "source": os.path.basename(source),
            "version": 1,
        },
        "sections": [
            {"index": i + 1, "label": SECTION_LABEL[s], "raw": s} for i, s in enumerate(SECTION_ORDER)
        ],
        "units": units,
        "lessons": lessons,
        "words": words,
    }
    return payload


def main():
    if len(sys.argv) < 2:
        print("usage: python tools/build_words.py <word-list.docx>")
        return 1
    payload = build(sys.argv[1])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    io.open(OUT, "w", encoding="utf-8").write(
        json.dumps(payload, ensure_ascii=False, indent=1)
    )
    words = payload["words"]
    print(f"wrote {OUT}")
    print(f"{len(words)} cards ·", dict(sorted(Counter(w["lesson"] for w in words).items())))
    print("with reading:", sum(1 for w in words if w["kana"] != w["surface"]))
    print("unmapped pos:", [w["pos"] for w in words if w["pos"] not in POS_ZH])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
