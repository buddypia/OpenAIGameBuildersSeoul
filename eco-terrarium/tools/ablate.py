"""캔버스 기능을 하나씩 무력화하며 프레임 시간을 재서 진짜 병목을 특정한다(ablation).

추측을 배제하기 위한 실험 도구. 각 측정은 패치 설치 → 측정 → 복구까지
한 번의 evaluate 안에서 끝나므로 호출 간 상태 공유로 인한 오염이 없다.
장면 복잡도(프레임당 fill 수)를 함께 기록해 개체 수 변동에 의한 교란을 드러내고,
baseline과 교차로 여러 라운드 반복해 드리프트를 분리한다.
"""

import os
import statistics

from playwright.sync_api import sync_playwright

URL = os.environ.get("ECO_URL", "http://127.0.0.1:3111")
SECONDS = float(os.environ.get("ECO_ABLATE_SECONDS", "3"))
REPEATS = int(os.environ.get("ECO_ABLATE_REPEATS", "3"))

# 창이 뒤로 밀리거나 점유되면 Chromium이 rAF를 30Hz로 묶어 측정이 무의미해진다.
LAUNCH_ARGS = [
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
]

MEASURE = """
async (cfg) => {
  const proto = CanvasRenderingContext2D.prototype;
  const restore = [];

  if (cfg.noShadow) {
    const d = Object.getOwnPropertyDescriptor(proto, 'shadowBlur');
    Object.defineProperty(proto, 'shadowBlur', {
      configurable: true, get() { return d.get.call(this); }, set() { d.set.call(this, 0); },
    });
    restore.push(() => Object.defineProperty(proto, 'shadowBlur', d));
  }
  if (cfg.noComposite) {
    const d = Object.getOwnPropertyDescriptor(proto, 'globalCompositeOperation');
    Object.defineProperty(proto, 'globalCompositeOperation', {
      configurable: true, get() { return d.get.call(this); }, set() { d.set.call(this, 'source-over'); },
    });
    restore.push(() => Object.defineProperty(proto, 'globalCompositeOperation', d));
  }
  if (cfg.noGradients) {
    const lin = proto.createLinearGradient, rad = proto.createRadialGradient;
    proto.createLinearGradient = () => 'rgba(30,60,70,0.5)';
    proto.createRadialGradient = () => 'rgba(30,60,70,0.5)';
    restore.push(() => { proto.createLinearGradient = lin; proto.createRadialGradient = rad; });
  }

  let fills = 0;
  const origFill = proto.fill;
  proto.fill = function (...a) { fills++; return origFill.apply(this, a); };
  restore.push(() => { proto.fill = origFill; });

  await new Promise(r => setTimeout(r, 500));
  fills = 0;
  const s = []; let last = performance.now();
  const until = last + cfg.seconds * 1000;
  await new Promise(res => {
    const t = (x) => { s.push(x - last); last = x; x < until ? requestAnimationFrame(t) : res(); };
    requestAnimationFrame(t);
  });
  for (const undo of restore) undo();

  s.shift();
  const sorted = [...s].sort((a, b) => a - b);
  return { medianMs: +sorted[Math.floor(sorted.length / 2)].toFixed(1),
           frames: s.length, fillPerFrame: Math.round(fills / (s.length + 1)) };
}
"""

CASES = [
    ("baseline", {}),
    ("shadowBlur 제거", {"noShadow": True}),
    ("gradient 제거", {"noGradients": True}),
    ("composite 제거", {"noComposite": True}),
    ("shadow+gradient 제거", {"noShadow": True, "noGradients": True}),
    ("셋 다 제거", {"noShadow": True, "noGradients": True, "noComposite": True}),
]


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=False, args=LAUNCH_ARGS)
        page = browser.new_page(viewport={"width": 1600, "height": 950})
        page.goto(URL, wait_until="networkidle")
        page.locator(".start-screen-action").click()
        page.wait_for_timeout(4000)

        backing = page.locator("canvas").first.evaluate("c => c.width + 'x' + c.height")
        print(f"canvas backing {backing}\n")

        timings = {label: [] for label, _ in CASES}
        scene = {label: [] for label, _ in CASES}
        for round_index in range(REPEATS):
            for label, flags in CASES:
                cfg = {"seconds": SECONDS, "noShadow": False, "noGradients": False, "noComposite": False}
                cfg.update(flags)
                result = page.evaluate(MEASURE, cfg)
                timings[label].append(result["medianMs"])
                scene[label].append(result["fillPerFrame"])
            print(f"round {round_index + 1}/{REPEATS}", flush=True)

        base = statistics.median(timings["baseline"])
        print(f"\n{'조건':24s} {'중앙 프레임(ms)':>15s} {'fps':>7s} {'절감':>12s} {'fill/frame':>11s}")
        for label, _ in CASES:
            ms = statistics.median(timings[label])
            note = "-" if label == "baseline" else f"{base - ms:+.1f} ms"
            print(f"{label:24s} {ms:15.1f} {1000 / ms:7.1f} {note:>12s} {statistics.median(scene[label]):11.0f}")
        browser.close()


if __name__ == "__main__":
    main()
