# -*- coding: utf-8 -*-
"""Generate one MP3 per word card so pronunciation works without a system
Japanese voice.

Usage:
    pip install edge-tts
    python tools/build_audio.py

Writes docs/audio/<word-id>.mp3 (served by GitHub Pages next to the app).
Existing files larger than 500 bytes are skipped, so it is safe to re-run.
"""
import asyncio
import json
import os
import sys

try:  # Windows consoles default to GBK and cannot print kana.
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDS_PATH = os.path.join(ROOT, "src", "data", "words.json")
OUT_DIR = os.path.join(ROOT, "docs", "audio")
VOICE = "ja-JP-NanamiNeural"
RATE = "-5%"
CONCURRENCY = int(os.environ.get("AUDIO_CONCURRENCY", "8"))


async def synth_one(word, semaphore, stats):
    path = os.path.join(OUT_DIR, f"{word['id']}.mp3")
    if os.path.exists(path) and os.path.getsize(path) > 500:
        stats["skip"] += 1
        return
    text = (word["kana"] or word["surface"]).replace("～", " ").replace("~", " ").strip()
    if not text:
        return
    for attempt in range(3):
        try:
            async with semaphore:
                communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
                await communicate.save(path)
            if os.path.getsize(path) > 500:
                stats["ok"] += 1
                if stats["ok"] % 25 == 0:
                    print(f"  generated {stats['ok']} …", flush=True)
                return
            raise RuntimeError("empty audio")
        except Exception:  # noqa: BLE001 - retry transient network failures
            await asyncio.sleep(1.2 * (attempt + 1))
    stats["fail"].append(word["id"])


async def main():
    with open(WORDS_PATH, encoding="utf-8") as handle:
        words = json.load(handle)["words"]
    os.makedirs(OUT_DIR, exist_ok=True)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    stats = {"ok": 0, "skip": 0, "fail": []}
    print(f"voices: {VOICE} · words: {len(words)}")
    await asyncio.gather(*(synth_one(word, semaphore, stats) for word in words))
    print(f"done · generated {stats['ok']} · skipped {stats['skip']} · failed {len(stats['fail'])}")
    if stats["fail"]:
        print("failed:", ", ".join(stats["fail"][:20]))


if __name__ == "__main__":
    asyncio.run(main())
