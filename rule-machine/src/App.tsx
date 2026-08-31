import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { playTone } from './audio';
import { RuleMachineGame } from './engine';
import type { GameInput, GameSnapshot, RulePair } from './game-types';
import { combinationCount, getRule } from './rules';
import './styles.css';

const initialState: GameSnapshot = {
  active: false,
  score: 0,
  integrity: 3,
  elapsed: 0,
  roundRemaining: 30,
  pair: ['enemy-platform', 'orb-magnet'],
  headline: '적 = 발판 × 별이 끌려온다',
  message: 'START를 누르면 30초 타이머가 가동됩니다.',
  won: false,
};

const keyToInput: Record<string, keyof GameInput> = {
  ArrowLeft: 'left', A: 'left', a: 'left', ArrowRight: 'right', D: 'right', d: 'right', ArrowUp: 'jump', W: 'jump', w: 'jump', ' ': 'dash', Shift: 'dash',
};

/* 룰 카드는 30초에 한 번만 바뀌므로 타이머 갱신으로 다시 그리지 않는다. */
const RuleDeck = memo(function RuleDeck({ pair, headline, onShift }: { pair: RulePair; headline: string; onShift: () => void }) {
  return (
    <section className="rule-deck" aria-label="현재 적용된 룰 카드">
      <p className="deck-label">CURRENT COLLISION <span>×</span> {headline}</p>
      <div className="cards">
        {pair.map(getRule).map((rule, index) => (
          <article className={`rule-card card-${index + 1}`} key={rule.id} style={{ '--rule-color': rule.color } as React.CSSProperties}>
            <span className="card-index">0{index + 1}</span>
            <span className="rule-symbol" aria-hidden="true">{rule.kicker}</span>
            <h2>{rule.title}</h2>
            <p>{rule.short}</p>
          </article>
        ))}
        <button className="shift-button" onClick={onShift} type="button">지금 뒤집기 <span aria-hidden="true">↻</span></button>
      </div>
    </section>
  );
});

const Manual = memo(function Manual() {
  return (
    <aside className="manual" aria-label="플레이 방법">
      <p><b>MOVE</b> ← → 또는 A D</p>
      <p><b>JUMP</b> ↑ 또는 W</p>
      <p><b>DASH</b> Space / Shift</p>
      <p className="manual-note">전환 버튼은 심사용 즉시 쇼케이스입니다. 실제 룰 충돌은 매 30초마다 자동 실행됩니다.</p>
    </aside>
  );
});

const TouchControls = memo(function TouchControls({ press }: { press: (input: keyof GameInput, pressed: boolean) => void }) {
  /* 포인터를 캡처해 두면 손가락이 버튼 밖으로 미끄러져도 release를 놓치지 않는다. */
  const hold = (input: keyof GameInput) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId) === false) {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }
      press(input, true);
    },
    onPointerUp: () => press(input, false),
    onPointerCancel: () => press(input, false),
    onLostPointerCapture: () => press(input, false),
  });

  /* 탭 액션은 click(최대 300ms 지연)이 아니라 pointerdown에서 즉시 반응시킨다. */
  const tap = (input: keyof GameInput) => ({
    onPointerDown: () => {
      press(input, true);
      press(input, false);
    },
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail !== 0) return;
      press(input, true);
      press(input, false);
    },
  });

  return (
    <div className="controls" aria-label="터치 조작">
      <div className="control-group">
        <button type="button" aria-label="왼쪽으로 이동" {...hold('left')}>←</button>
        <button type="button" aria-label="오른쪽으로 이동" {...hold('right')}>→</button>
      </div>
      <div className="control-group action-controls">
        <button type="button" aria-label="점프" {...tap('jump')}>JUMP</button>
        <button type="button" aria-label="대시" {...tap('dash')}>DASH</button>
      </div>
    </div>
  );
});

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<RuleMachineGame>();
  const [snapshot, setSnapshot] = useState(initialState);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const game = new RuleMachineGame(canvas, setSnapshot, playTone);
    gameRef.current = game;
    game.run();
    const resize = () => game.resize();
    const keydown = (event: KeyboardEvent) => {
      const control = keyToInput[event.key];
      if (!control || event.repeat) return;
      event.preventDefault();
      game.setInput({ [control]: true });
    };
    const keyup = (event: KeyboardEvent) => {
      const control = keyToInput[event.key];
      if (!control) return;
      event.preventDefault();
      game.setInput({ [control]: false });
    };
    /* 앱 전환·전화 수신처럼 release 이벤트가 유실되는 상황에서 입력이 눌린 채 남지 않게 한다. */
    const releaseAll = () => game.setInput({ left: false, right: false, jump: false, dash: false });
    /* 레이아웃 변화까지 잡되 rAF 한 프레임에 한 번만 백버퍼를 재할당한다. */
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', releaseAll);
    window.addEventListener('pointercancel', releaseAll);
    document.addEventListener('visibilitychange', releaseAll);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', releaseAll);
      window.removeEventListener('pointercancel', releaseAll);
      document.removeEventListener('visibilitychange', releaseAll);
      game.destroy();
      gameRef.current = undefined;
    };
  }, []);

  const press = useCallback((input: keyof GameInput, pressed: boolean) => {
    gameRef.current?.setInput({ [input]: pressed });
  }, []);
  /* 좁은 화면에서는 START 직후 게임과 조작 버튼이 함께 보이도록 스크롤을 맞춘다. */
  const start = useCallback(() => {
    gameRef.current?.start();
    if (window.matchMedia('(max-width: 900px), (max-height: 760px)').matches) {
      document.getElementById('game')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  const forceShift = useCallback(() => gameRef.current?.forceShift(), []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="The Rule Machine 상단으로 이동">
          <span className="brand-mark" aria-hidden="true">R/</span>
          <span>THE RULE<br />MACHINE</span>
        </a>
        <div className="status-strip" aria-label="게임 상태">
          <span><b>{String(snapshot.score).padStart(2, '0')}</b> / 12 코어</span>
          <span><b>{'◆'.repeat(snapshot.integrity)}</b><i>{'◇'.repeat(3 - snapshot.integrity)}</i></span>
          <span className="combos">{combinationCount} 조합 가능</span>
        </div>
      </header>

      <section className="hero" aria-labelledby="game-title">
        <div className="title-copy">
          <p className="eyebrow">GO LIMITLESS / SURPRISE ME</p>
          <h1 id="game-title">규칙이 당신을<br /><em>플레이</em>합니다.</h1>
          <p className="lead">30초마다 두 개의 규칙이 충돌합니다. 적은 발판이 되고, 하늘은 바닥이 됩니다. 별 12개를 훔쳐 기계를 탈출하세요.</p>
        </div>
        <div className="shift-meter">
          <span>다음 규칙 충돌까지</span>
          <strong>{String(Math.ceil(snapshot.roundRemaining)).padStart(2, '0')}<small>SEC</small></strong>
          <div className="meter-track"><i style={{ transform: `scaleX(${Math.max(0, snapshot.roundRemaining / 30)})` }} /></div>
        </div>
      </section>

      <RuleDeck pair={snapshot.pair} headline={snapshot.headline} onShift={forceShift} />

      <section className="machine" id="game" aria-label="The Rule Machine 게임 영역">
        <div className="canvas-frame">
          <canvas ref={canvasRef} role="img" aria-label="규칙 충돌에 따라 바뀌는 추상 플랫폼 게임 화면" />
          {!snapshot.active && <div className="start-layer"><p>READY / NO ASSETS / ALL RULES LIVE</p><button type="button" onClick={start}>기계 가동 <span>→</span></button></div>}
          {snapshot.won && <div className="win-layer"><p>LIMIT EXCEEDED</p><button type="button" onClick={start}>다시 뒤집기 <span>↻</span></button></div>}
          <div className="canvas-caption" aria-live="polite">{snapshot.message}</div>
        </div>
        <TouchControls press={press} />
      </section>

      <Manual />
    </main>
  );
}
