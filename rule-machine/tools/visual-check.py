import os
from pathlib import Path

from playwright.sync_api import sync_playwright


def check_page(page, width: int, height: int, screenshot: str):
    print(f"checking {width}x{height}", flush=True)
    page.set_viewport_size({"width": width, "height": height})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.goto(os.environ.get("RULE_MACHINE_URL", "http://127.0.0.1:5197"), wait_until="networkidle")
    print("loaded", flush=True)
    assert page.get_by_role("button", name="기계 가동").is_visible()
    print("start visible", flush=True)
    canvas = page.locator("canvas")
    assert canvas.evaluate("element => element.width > 0 && element.height > 0")
    before = page.locator(".deck-label").inner_text()
    print("deck read", flush=True)
    page.get_by_role("button", name="기계 가동").click()
    print("started", flush=True)
    page.get_by_role("button", name="지금 뒤집기", exact=False).click()
    print("shifted", flush=True)
    page.wait_for_timeout(250)
    after = page.locator(".deck-label").inner_text()
    assert before != after, "Force Shift가 룰 카드 조합을 바꾸지 않았습니다."
    page.keyboard.down("ArrowRight")
    page.wait_for_timeout(100)
    page.keyboard.up("ArrowRight")
    page.screenshot(path=screenshot, full_page=True)
    assert not errors, f"브라우저 콘솔 오류: {errors}"
    print(f"passed {width}x{height}", flush=True)
    return after


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    desktop = browser.new_page(viewport={"width": 1440, "height": 920})
    mobile = browser.new_page(viewport={"width": 320, "height": 760})
    desktop_state = check_page(desktop, 1440, 920, "/tmp/rule-machine-desktop.png")
    mobile_state = check_page(mobile, 320, 760, "/tmp/rule-machine-mobile.png")
    browser.close()

Path("/tmp/rule-machine-visual-check.txt").write_text(
    f"desktop={desktop_state}\nmobile={mobile_state}\n", encoding="utf-8"
)
print("VISUAL CHECK: PASS — desktop/mobile 렌더링, 시작, Force Shift, 키보드 입력, 콘솔 오류 없음")
