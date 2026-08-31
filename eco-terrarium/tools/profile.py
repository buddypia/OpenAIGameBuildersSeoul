"""테라리움 실행 중 프레임률과 CPU 프로파일(자기 시간 상위 함수)을 측정한다.

ECO_URL 로 대상 주소를 지정한다. 추측 대신 실제 병목을 숫자로 확인하기 위한 도구다.
"""

import json
import os
import sys
from collections import defaultdict

from playwright.sync_api import sync_playwright

URL = os.environ.get("ECO_URL", "http://127.0.0.1:3000")
SECONDS = float(os.environ.get("ECO_PROFILE_SECONDS", "6"))

FRAME_STATS = """
async (seconds) => {
  const s = []; let last = performance.now();
  const until = last + seconds * 1000;
  await new Promise(res => {
    const t = (x) => { s.push(x - last); last = x; x < until ? requestAnimationFrame(t) : res(); };
    requestAnimationFrame(t);
  });
  s.shift();
  const sorted = [...s].sort((a, b) => a - b);
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  return { frames: s.length, avgMs: +avg.toFixed(2), fps: +(1000 / avg).toFixed(1),
           p50: +sorted[Math.floor(sorted.length * 0.5)].toFixed(2),
           p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
           max: +sorted[sorted.length - 1].toFixed(2),
           over16: s.filter(v => v > 16.7).length, over33: s.filter(v => v > 33).length };
}
"""


def summarize(profile, limit=18):
    nodes = {n["id"]: n for n in profile["nodes"]}
    self_ticks = defaultdict(int)
    samples = profile.get("samples") or []
    deltas = profile.get("timeDeltas") or []
    for index, node_id in enumerate(samples):
        self_ticks[node_id] += deltas[index] if index < len(deltas) else 0
    total = sum(self_ticks.values()) or 1
    rows = []
    for node_id, micros in sorted(self_ticks.items(), key=lambda kv: -kv[1])[:limit]:
        frame = nodes[node_id]["callFrame"]
        name = frame.get("functionName") or "(anonymous)"
        url = (frame.get("url") or "").rsplit("/", 1)[-1]
        line = frame.get("lineNumber", -1) + 1
        rows.append((f"{name} @ {url}:{line}", micros / 1000.0, 100.0 * micros / total))
    return rows, total / 1000.0


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1600, "height": 950})
        page.goto(URL, wait_until="networkidle")

        page.locator(".start-screen-action").click()
        page.wait_for_timeout(2500)

        counts = page.evaluate("() => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio })")
        canvas = page.locator("canvas").first
        backing = canvas.evaluate("c => [c.width, c.height]")
        print(f"viewport {counts['w']}x{counts['h']} dpr {counts['dpr']} canvas backing {backing[0]}x{backing[1]}")

        print("\n--- frame timing ---")
        stats = page.evaluate(FRAME_STATS, SECONDS)
        print(json.dumps(stats))

        print("\n--- cpu profile (self time) ---")
        session = page.context.new_cdp_session(page)
        session.send("Profiler.enable")
        session.send("Profiler.setSamplingInterval", {"interval": 100})
        session.send("Profiler.start")
        page.wait_for_timeout(int(SECONDS * 1000))
        result = session.send("Profiler.stop")
        rows, total_ms = summarize(result["profile"])
        print(f"total sampled {total_ms:.0f} ms")
        for name, ms, pct in rows:
            print(f"{pct:6.2f}%  {ms:8.1f} ms  {name}")

        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001
        print(f"PROFILE FAILED: {error}", file=sys.stderr)
        raise SystemExit(1)
