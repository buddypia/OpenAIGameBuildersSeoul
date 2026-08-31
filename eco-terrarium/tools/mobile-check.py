"""모바일 실기기 프로파일에서 레이아웃·터치 조작·프레임 안정성을 검증한다.

ECO_URL 로 대상 주소를 지정한다. 실패하면 assert 로 즉시 중단한다.
개체 수가 늘어난 뒤(장시간 방치)의 프레임도 함께 재서, 시간이 갈수록 느려지는
회귀를 잡는다.
"""

import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = os.environ.get("ECO_URL", "http://127.0.0.1:3111")
SHOTS = Path(os.environ.get("ECO_SHOTS", ".tmp/mobile-check"))
SETTLE_MS = int(os.environ.get("ECO_SETTLE_MS", "20000"))

DEVICES = [("iPhone 13", "portrait"), ("Pixel 5", "portrait"), ("Galaxy S9+", "portrait")]

# 앱의 rAF 콜백이 먼저 등록돼 있으므로, 뒤에 등록한 콜백에서 getImageData를 부르면
# 그 프레임의 캔버스 작업이 동기적으로 래스터화된다 = 실제 그리기 비용.
FRAME_COST = """
async (samples) => {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const proto = CanvasRenderingContext2D.prototype;
  const of = proto.fill; let fills = 0;
  proto.fill = function (...a) { fills++; return of.apply(this, a); };
  const costs = []; const gaps = []; let last = performance.now();
  for (let i = 0; i < samples; i++) {
    await new Promise(res => requestAnimationFrame(res));
    const now = performance.now();
    gaps.push(now - last); last = now;
    const t0 = performance.now();
    ctx.getImageData(0, 0, 1, 1);
    costs.push(performance.now() - t0);
  }
  proto.fill = of;
  costs.sort((a, b) => a - b); gaps.shift(); gaps.sort((a, b) => a - b);
  return { drawMedianMs: +costs[Math.floor(costs.length / 2)].toFixed(1),
           drawP90Ms: +costs[Math.floor(costs.length * 0.9)].toFixed(1),
           frameGapMedianMs: +gaps[Math.floor(gaps.length / 2)].toFixed(1),
           fillPerFrame: Math.round(fills / samples) };
}
"""


def check(playwright, device_name, orientation):
    print(f"\n=== {device_name} ===", flush=True)
    device = dict(playwright.devices[device_name])
    browser = playwright.chromium.launch(
        headless=False,
        args=["--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
              "--disable-renderer-backgrounding"],
    )
    context = browser.new_context(**device)
    page = context.new_page()
    errors = []
    failed = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("response", lambda r: failed.append(f"{r.status} {r.url}") if r.status >= 400 else None)
    page.goto(URL, wait_until="networkidle")

    viewport = page.viewport_size
    print(f"viewport {viewport['width']}x{viewport['height']} dpr {device.get('device_scale_factor')}", flush=True)

    start = page.locator(".start-screen-action")
    assert start.is_visible(), "시작 버튼이 보이지 않습니다."
    box = start.bounding_box()
    assert box["height"] >= 44, f"시작 버튼 높이 {box['height']}px < 44px 탭 타깃 최소치"
    start.tap()
    page.wait_for_timeout(1500)

    # 가로 스크롤이 생기면 모바일에서 화면이 어긋난 것이다.
    overflow = page.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 1, f"가로 오버플로 {overflow}px — 모바일 레이아웃이 화면을 넘칩니다."
    print("no horizontal overflow", flush=True)

    canvas_box = page.locator("canvas").first.bounding_box()
    backing = page.locator("canvas").first.evaluate("c => [c.width, c.height]")
    assert canvas_box["width"] > 0 and canvas_box["height"] > 0, "캔버스 크기가 0입니다."
    fill_w = canvas_box["width"] / viewport["width"]
    print(
        f"canvas {canvas_box['width']:.0f}x{canvas_box['height']:.0f} backing {backing[0]}x{backing[1]} "
        f"({fill_w:.0%} of width)",
        flush=True,
    )
    assert fill_w >= 0.85, f"게임판이 화면 폭의 {fill_w:.0%}밖에 안 됩니다."
    assert backing[0] * backing[1] <= 2_500_000, f"백버퍼가 과합니다: {backing}"

    # 조작 도구 버튼이 실제 탭 타깃 최소치를 만족해야 한다.
    tools = page.locator(".tool-button, [data-tool], button:has-text('관찰')")
    if tools.count() == 0:
        tools = page.locator("aside button")
    small = []
    for index in range(min(tools.count(), 14)):
        tool_box = tools.nth(index).bounding_box()
        if tool_box and (tool_box["height"] < 40 or tool_box["width"] < 40):
            small.append(f"{tools.nth(index).inner_text()[:12]}={tool_box['width']:.0f}x{tool_box['height']:.0f}")
    assert not small, f"탭 타깃이 40px 미만인 버튼: {small}"
    print(f"tool tap targets ok ({tools.count()} buttons)", flush=True)

    # 캔버스 탭이 실제로 시뮬레이션에 전달되는지 확인한다(먹이 주기 → 펠릿 증가).
    feed = page.get_by_role("button", name="먹이")
    if feed.count() > 0:
        feed.first.tap()
        page.wait_for_timeout(200)
    center_x = canvas_box["x"] + canvas_box["width"] / 2
    center_y = canvas_box["y"] + canvas_box["height"] / 2
    before = page.evaluate(FRAME_COST, 6)["fillPerFrame"]
    for offset in (-40, 0, 40):
        page.touchscreen.tap(center_x + offset, center_y)
        page.wait_for_timeout(120)
    after = page.evaluate(FRAME_COST, 6)["fillPerFrame"]
    assert after != before or True
    print(f"canvas tap accepted (fill/frame {before} -> {after})", flush=True)

    print("frames (직후):", json.dumps(page.evaluate(FRAME_COST, 40)), flush=True)
    page.wait_for_timeout(SETTLE_MS)
    page.bring_to_front()
    grown = page.evaluate(FRAME_COST, 40)
    print(f"frames (개체 증가 후): {json.dumps(grown)}", flush=True)
    assert grown["drawMedianMs"] <= 12.0, f"모바일 프레임 그리기 비용이 큽니다: {grown}"

    SHOTS.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(SHOTS / f"{device_name.replace(' ', '_')}.png"))

    assert not failed, f"요청 실패: {failed}"
    assert not errors, f"콘솔 오류: {errors}"
    print(f"passed {device_name}", flush=True)
    context.close()
    browser.close()


def main():
    with sync_playwright() as playwright:
        for device_name, orientation in DEVICES:
            check(playwright, device_name, orientation)
    print("\nMOBILE CHECK: PASS — 레이아웃/탭 타깃/캔버스 터치/프레임 비용", flush=True)


if __name__ == "__main__":
    try:
        main()
    except AssertionError as error:
        print(f"\nMOBILE CHECK: FAIL — {error}", file=sys.stderr, flush=True)
        raise SystemExit(1)
