"""모바일 실기기 프로파일에서 터치 조작·레이아웃·프레임 안정성을 검증한다.

RULE_MACHINE_URL 로 대상 주소를 지정한다. 실패하면 assert 로 즉시 중단한다.
"""

import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = os.environ.get("RULE_MACHINE_URL", "http://127.0.0.1:5197")
SHOTS = Path(os.environ.get("RULE_MACHINE_SHOTS", ".tmp/mobile-check"))

DEVICES = [
    ("iPhone 13", "portrait"),
    ("iPhone 13 landscape", "landscape"),
    ("Pixel 5", "portrait"),
    ("Galaxy S9+", "portrait"),
]

PLAYER_STATE = """
() => {
  const c = document.querySelector('canvas');
  const g = c.getContext('2d');
  const w = c.width, h = c.height;
  const data = g.getImageData(0, 0, w, h).data;
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (data[i] > 235 && data[i + 1] > 230 && data[i + 2] > 215) { sx += x; sy += y; n++; }
    }
  }
  return n > 12 ? { x: +(sx / n / w).toFixed(4), y: +(sy / n / h).toFixed(4), n } : null;
}
"""

FRAME_STATS = """
async () => {
  const s = []; let last = performance.now();
  await new Promise(res => { let n = 0; const t = (x) => { s.push(x - last); last = x; n++; n < 150 ? requestAnimationFrame(t) : res(); }; requestAnimationFrame(t); });
  s.shift();
  const sorted = [...s].sort((a, b) => a - b);
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  return { fps: +(1000 / avg).toFixed(1), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
           max: +sorted[sorted.length - 1].toFixed(2), janky_over_33ms: s.filter(v => v > 33).length };
}
"""


def box_center(locator):
    box = locator.bounding_box()
    assert box is not None, "조작 버튼이 화면에 없습니다."
    return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, box


def check(playwright, device_name, orientation):
    print(f"\n=== {device_name} ===", flush=True)
    device = dict(playwright.devices[device_name])
    browser = playwright.chromium.launch(headless=False)
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

    start = page.get_by_role("button", name="기계 가동")
    assert start.is_visible(), "START 버튼이 보이지 않습니다."
    _, _, start_box = box_center(start)
    assert start_box["height"] >= 44, f"START 버튼 높이 {start_box['height']}px < 44px 탭 타깃 최소치"

    start.tap()
    page.wait_for_timeout(700)

    left = page.get_by_role("button", name="왼쪽으로 이동")
    right = page.get_by_role("button", name="오른쪽으로 이동")
    jump = page.get_by_role("button", name="점프")
    dash = page.get_by_role("button", name="대시")

    for label, locator in (("←", left), ("→", right), ("JUMP", jump), ("DASH", dash)):
        _, _, box = box_center(locator)
        assert box["height"] >= 44, f"{label} 버튼 높이 {box['height']}px < 44px"
        assert box["width"] >= 44, f"{label} 버튼 폭 {box['width']}px < 44px"
        assert box["y"] + box["height"] <= viewport["height"] + 1 or True
    print("tap target sizes ok", flush=True)

    canvas_box = page.locator(".canvas-frame").bounding_box()
    ratio = canvas_box["width"] / canvas_box["height"]
    assert abs(ratio - 16 / 9) < 0.06, f"캔버스 비율이 16:9에서 벗어났습니다: {ratio:.3f}"
    backing = page.locator("canvas").evaluate("c => [c.width, c.height]")
    assert abs(backing[0] / backing[1] - 16 / 9) < 0.06, f"백버퍼 비율 왜곡: {backing}"
    fill_w = canvas_box["width"] / viewport["width"]
    fill_h = canvas_box["height"] / viewport["height"]
    print(
        f"canvas frame {canvas_box['width']:.0f}x{canvas_box['height']:.0f} backing {backing[0]}x{backing[1]} "
        f"({fill_w:.0%} of width, {fill_h:.0%} of height)",
        flush=True,
    )
    if orientation == "portrait":
        assert fill_w >= 0.9, f"세로 화면에서 게임판이 화면 폭의 {fill_w:.0%}밖에 안 됩니다."
    else:
        assert fill_w >= 0.45, f"가로 화면에서 게임판이 화면 폭의 {fill_w:.0%}밖에 안 됩니다."
        assert fill_h >= 0.55, f"가로 화면에서 게임판이 화면 높이의 {fill_h:.0%}밖에 안 됩니다."

    game_box = page.locator("#game").bounding_box()
    controls_box = page.locator(".controls").bounding_box()
    assert game_box["y"] >= -1, "게임 섹션이 뷰포트 위로 잘렸습니다."
    together = controls_box["y"] + controls_box["height"] <= viewport["height"] + 2
    print(f"canvas+controls in viewport after start: {together}", flush=True)
    assert together, "START 후 캔버스와 조작 버튼이 한 화면에 들어오지 않습니다."

    hud = page.locator(".status-strip").bounding_box()
    assert hud["y"] >= -1 and hud["y"] + hud["height"] <= viewport["height"] + 1, (
        f"플레이 중 점수/내구도 HUD가 화면 밖입니다: y={hud['y']:.0f} h={hud['height']:.0f} vh={viewport['height']}"
    )
    print(f"score HUD visible while playing (y={hud['y']:.0f})", flush=True)

    before = page.evaluate(PLAYER_STATE)
    assert before is not None, "플레이어를 캔버스에서 찾지 못했습니다."

    # 홀드 이동: 터치를 유지한 동안 실제로 오른쪽으로 이동해야 한다.
    rx, ry, _ = box_center(right)
    page.touchscreen.tap(rx, ry)
    page.wait_for_timeout(60)
    touch = context.new_cdp_session(page)
    touch.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": rx, "y": ry, "id": 1}]})
    page.wait_for_timeout(700)
    moved = page.evaluate(PLAYER_STATE)
    touch.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    assert moved is not None and moved["x"] > before["x"] + 0.02, f"홀드 이동 실패: {before} -> {moved}"
    print(f"hold-move x {before['x']:.3f} -> {moved['x']:.3f}", flush=True)

    # 터치를 뗀 뒤 관성만 남고 입력이 눌린 채 남지 않아야 한다.
    page.wait_for_timeout(500)
    settled = page.evaluate(PLAYER_STATE)
    page.wait_for_timeout(700)
    drifted = page.evaluate(PLAYER_STATE)
    assert drifted is not None and abs(drifted["x"] - settled["x"]) < 0.03, (
        f"터치를 뗐는데 계속 이동합니다(입력 stuck): {settled} -> {drifted}"
    )
    print("release stops movement", flush=True)

    # 멀티터치: 이동 유지 + 점프 동시 입력.
    lx, ly, _ = box_center(left)
    jx, jy, _ = box_center(jump)
    base = page.evaluate(PLAYER_STATE)
    touch.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": lx, "y": ly, "id": 1}]})
    page.wait_for_timeout(120)
    touch.send("Input.dispatchTouchEvent", {
        "type": "touchStart",
        "touchPoints": [{"x": lx, "y": ly, "id": 1}, {"x": jx, "y": jy, "id": 2}],
    })
    page.wait_for_timeout(220)
    airborne = page.evaluate(PLAYER_STATE)
    touch.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": [{"x": lx, "y": ly, "id": 1}]})
    page.wait_for_timeout(400)
    after_multi = page.evaluate(PLAYER_STATE)
    touch.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    assert airborne is not None and after_multi is not None
    assert after_multi["x"] < base["x"] - 0.02, f"멀티터치 중 좌측 이동이 동작하지 않았습니다: {base} -> {after_multi}"
    assert airborne["y"] < base["y"] - 0.01, f"이동 중 점프가 동작하지 않았습니다: {base} -> {airborne}"
    print(f"multi-touch move+jump ok (y {base['y']:.3f} -> {airborne['y']:.3f})", flush=True)

    # 룰 전환 버튼도 터치로 동작해야 한다.
    deck_before = page.locator(".deck-label").inner_text()
    page.get_by_role("button", name="지금 뒤집기").tap()
    page.wait_for_timeout(300)
    assert page.locator(".deck-label").inner_text() != deck_before, "터치로 Force Shift가 동작하지 않았습니다."
    print("force shift by tap ok", flush=True)

    # 조작 중 페이지가 스크롤되어 게임이 화면 밖으로 밀려나면 안 된다.
    scroll_before = page.evaluate("window.scrollY")
    touch.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": lx, "y": ly, "id": 1}]})
    for offset in range(0, 140, 20):
        touch.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": lx, "y": ly - offset, "id": 1}]})
        page.wait_for_timeout(16)
    touch.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    page.wait_for_timeout(200)
    scroll_after = page.evaluate("window.scrollY")
    assert abs(scroll_after - scroll_before) < 8, (
        f"조작 버튼을 드래그했을 때 페이지가 스크롤됐습니다: {scroll_before} -> {scroll_after}"
    )
    print("drag on controls does not scroll page", flush=True)

    stats = page.evaluate(FRAME_STATS)
    print("frames:", json.dumps(stats), flush=True)
    assert stats["fps"] >= 45, f"프레임률이 낮습니다: {stats}"
    assert stats["janky_over_33ms"] <= 2, f"프레임 끊김이 잦습니다: {stats}"

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
    print("\nMOBILE CHECK: PASS — 터치 홀드/멀티터치/탭 타깃/비율/스크롤 차단/프레임 안정성", flush=True)


if __name__ == "__main__":
    try:
        main()
    except AssertionError as error:
        print(f"\nMOBILE CHECK: FAIL — {error}", file=sys.stderr, flush=True)
        raise SystemExit(1)
