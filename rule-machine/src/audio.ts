type Tone = 'start' | 'jump' | 'collect' | 'shift' | 'hurt' | 'win';

let context: AudioContext | undefined;

function getContext() {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function playTone(tone: Tone) {
  const audio = getContext();
  const now = audio.currentTime;
  const values: Record<Tone, [number, number, OscillatorType]> = {
    start: [220, 440, 'triangle'],
    jump: [320, 490, 'sine'],
    collect: [660, 990, 'sine'],
    shift: [140, 760, 'sawtooth'],
    hurt: [180, 70, 'square'],
    win: [440, 1320, 'triangle'],
  };
  const [from, to, shape] = values[tone];
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = shape;
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + 0.15);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
}
