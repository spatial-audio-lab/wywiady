import { useEffect, useRef } from 'react';

interface MapViewProps {
  speakerAPos: { x: number; z: number };
  speakerBPos: { x: number; z: number };
  speakerALabel: string;
  speakerBLabel: string;
  listenerX: number;
  listenerZ: number;
  listenerAngle: number;
  activeSpeaker: 'A' | 'B' | null;
  accentColor: string;
  ambientDesc: string;
  onListenerMove: (x: number, z: number, angle: number) => void;
}

// ─── Visual constants ───
const SPEAKER_A_CLR = '#ff6b6b';
const SPEAKER_B_CLR = '#4ecdc4';
const LISTENER_CLR  = '#c8d8ff';
const CONE_CLR      = 'rgba(90,160,255,0.07)';
const GRID_CLR      = 'rgba(255,255,255,0.035)';
const GRID_MAJOR    = 'rgba(255,255,255,0.07)';
const BG            = '#060610';

// ─── Movement constants ───
const MOVE_SPD = 4.0;   // world-units / sec
const ROT_SPD  = 2.5;   // rad / sec
const BOUNDS   = 12;

// ─── Helpers ───
function d(x1: number, z1: number, x2: number, z2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
}

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ══════════════════════════════════════════════════════════
//  Drawing primitives (all accept screen-space coordinates)
// ══════════════════════════════════════════════════════════

function drawGrid(
  c: CanvasRenderingContext2D,
  camX: number, camZ: number, s: number, w: number, h: number,
) {
  const half = (v: number) => v / (2 * s);
  const l = camX - half(w), r = camX + half(w);
  const t = camZ - half(h), b = camZ + half(h);
  const g = 1, maj = 5;
  const x0 = Math.floor(l / g) * g, x1 = Math.ceil(r / g) * g;
  const z0 = Math.floor(t / g) * g, z1 = Math.ceil(b / g) * g;
  c.lineWidth = 1;
  for (let x = x0; x <= x1; x += g) {
    c.strokeStyle = x % maj === 0 ? GRID_MAJOR : GRID_CLR;
    const sx = w / 2 + (x - camX) * s;
    c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, h); c.stroke();
  }
  for (let z = z0; z <= z1; z += g) {
    c.strokeStyle = z % maj === 0 ? GRID_MAJOR : GRID_CLR;
    const sy = h / 2 + (z - camZ) * s;
    c.beginPath(); c.moveTo(0, sy); c.lineTo(w, sy); c.stroke();
  }
}

function drawCone(
  c: CanvasRenderingContext2D,
  sx: number, sy: number, angle: number, sc: number,
) {
  const r = 6 * sc;
  const ca = angle - Math.PI / 2;     // canvas angle
  const half = Math.PI / 3.5;         // ~51° half-angle ≈ 103° total
  c.save();
  c.fillStyle = CONE_CLR;
  c.beginPath();
  c.moveTo(sx, sy);
  c.arc(sx, sy, r, ca - half, ca + half);
  c.closePath();
  c.fill();
  // inner lighter cone
  c.fillStyle = 'rgba(120,180,255,0.04)';
  c.beginPath();
  c.moveTo(sx, sy);
  c.arc(sx, sy, r * 0.55, ca - half * 0.5, ca + half * 0.5);
  c.closePath();
  c.fill();
  c.restore();
}

function drawWaves(
  c: CanvasRenderingContext2D,
  sx: number, sy: number, clr: string, time: number, sc: number,
) {
  const n = 5;
  const maxR = 3.5 * sc;
  const per = 2.2;
  c.save();
  for (let i = 0; i < n; i++) {
    const phase = ((time / per) + i / n) % 1;
    const r = phase * maxR;
    const a = (1 - phase) * 0.45;
    c.strokeStyle = rgba(clr, a);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(sx, sy, r, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

function drawSpeaker(
  c: CanvasRenderingContext2D,
  sx: number, sy: number,
  letter: string, label: string, clr: string,
  active: boolean, time: number, sc: number, dpr: number,
) {
  const r = 0.55 * sc;

  // sound waves
  if (active) drawWaves(c, sx, sy, clr, time, sc);

  // glow
  if (active) {
    const g = c.createRadialGradient(sx, sy, 0, sx, sy, r * 2.5);
    g.addColorStop(0, rgba(clr, 0.25));
    g.addColorStop(1, rgba(clr, 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(sx, sy, r * 2.5, 0, Math.PI * 2); c.fill();
  }

  // outer ring
  c.save();
  c.fillStyle = rgba(clr, active ? 0.22 : 0.10);
  c.strokeStyle = rgba(clr, active ? 0.85 : 0.35);
  c.lineWidth = 2.5 * dpr;
  c.beginPath(); c.arc(sx, sy, r, 0, Math.PI * 2);
  c.fill(); c.stroke();

  // letter
  c.fillStyle = clr;
  c.font = `bold ${Math.round(20 * dpr)}px system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(letter, sx, sy + 1 * dpr);

  // label
  c.fillStyle = rgba(clr, 0.75);
  c.font = `${Math.round(11 * dpr)}px system-ui, sans-serif`;
  c.fillText(label, sx, sy + r + 18 * dpr);

  // speaking badge
  if (active) {
    c.fillStyle = clr;
    c.font = `bold ${Math.round(9 * dpr)}px system-ui, sans-serif`;
    c.fillText('♦ SPEAKING', sx, sy - r - 12 * dpr);
  }
  c.restore();
}

function drawDistLine(
  c: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  clr: string, dist: number, dpr: number,
) {
  c.save();
  c.strokeStyle = rgba(clr, 0.25);
  c.lineWidth = 1.5 * dpr;
  c.setLineDash([7 * dpr, 5 * dpr]);
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.setLineDash([]);

  // label
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const txt = dist.toFixed(1) + ' m';
  c.font = `${Math.round(10 * dpr)}px monospace`;
  c.fillStyle = rgba(clr, 0.55);
  c.textAlign = 'center';
  // background
  const tw = c.measureText(txt).width + 6 * dpr;
  c.fillStyle = 'rgba(6,6,16,0.7)';
  c.fillRect(mx - tw / 2, my - 8 * dpr, tw, 14 * dpr);
  c.fillStyle = rgba(clr, 0.55);
  c.fillText(txt, mx, my + 3 * dpr);
  c.restore();
}

function drawListener(
  c: CanvasRenderingContext2D,
  sx: number, sy: number, angle: number, dpr: number,
) {
  const sz = 15 * dpr;

  c.save();
  c.translate(sx, sy);
  c.rotate(angle);

  // shadow
  c.fillStyle = 'rgba(80,140,255,0.15)';
  c.beginPath();
  c.arc(0, 0, sz * 1.2, 0, Math.PI * 2);
  c.fill();

  // body triangle
  c.fillStyle = LISTENER_CLR;
  c.strokeStyle = 'rgba(100,160,255,0.7)';
  c.lineWidth = 2 * dpr;
  c.beginPath();
  c.moveTo(0, -sz);                     // tip (forward = up = -y)
  c.lineTo(-sz * 0.62, sz * 0.55);
  c.lineTo(sz * 0.62, sz * 0.55);
  c.closePath();
  c.fill();
  c.stroke();

  // direction dot
  c.fillStyle = '#5588ff';
  c.beginPath();
  c.arc(0, -sz * 0.3, 3 * dpr, 0, Math.PI * 2);
  c.fill();

  c.restore();

  // label (screen-aligned)
  c.fillStyle = 'rgba(150,195,255,0.75)';
  c.font = `${Math.round(10 * dpr)}px system-ui, sans-serif`;
  c.textAlign = 'center';
  c.fillText('🎧 YOU', sx, sy + 26 * dpr);
}

function drawCompass(
  c: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number, angle: number, dpr: number,
) {
  c.save();
  // ring
  c.strokeStyle = 'rgba(255,255,255,0.08)';
  c.lineWidth = 1.5 * dpr;
  c.beginPath(); c.arc(cx, cy, radius, 0, Math.PI * 2); c.stroke();

  // ticks
  const labels = ['N', 'E', 'S', 'W'];
  const fs = Math.round(9 * dpr);
  c.font = `${fs}px system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 - Math.PI / 2;
    c.fillStyle = i === 0 ? 'rgba(255,100,100,0.6)' : 'rgba(255,255,255,0.25)';
    c.fillText(labels[i], cx + Math.cos(a) * (radius - 10 * dpr), cy + Math.sin(a) * (radius - 10 * dpr));
  }

  // facing direction indicator
  const ca = angle - Math.PI / 2;
  const dx = Math.cos(ca) * (radius - 22 * dpr);
  const dy = Math.sin(ca) * (radius - 22 * dpr);
  c.fillStyle = '#5588ff';
  c.beginPath(); c.arc(cx + dx, cy + dy, 4 * dpr, 0, Math.PI * 2); c.fill();

  c.restore();
}

function drawVignette(c: CanvasRenderingContext2D, w: number, h: number) {
  const g = c.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

// ══════════════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════════════

export function MapView({
  speakerAPos, speakerBPos,
  speakerALabel, speakerBLabel,
  listenerX, listenerZ, listenerAngle,
  activeSpeaker, accentColor, ambientDesc,
  onListenerMove,
}: MapViewProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const keysRef       = useRef<Set<string>>(new Set());
  const frameRef      = useRef(0);

  const stateRef = useRef({
    x: listenerX, z: listenerZ, angle: listenerAngle,
    camX: listenerX, camZ: listenerZ, time: 0,
  });
  const propsRef = useRef({
    speakerAPos, speakerBPos,
    speakerALabel, speakerBLabel,
    activeSpeaker, accentColor, ambientDesc, onListenerMove,
  });

  // keep propsRef current
  useEffect(() => {
    propsRef.current = {
      speakerAPos, speakerBPos,
      speakerALabel, speakerBLabel,
      activeSpeaker, accentColor, ambientDesc, onListenerMove,
    };
  });

  // sync position from parent (e.g. interview change resets position)
  useEffect(() => {
    stateRef.current.x     = listenerX;
    stateRef.current.z     = listenerZ;
    stateRef.current.angle = listenerAngle;
    stateRef.current.camX  = listenerX;
    stateRef.current.camZ  = listenerZ;
  }, [listenerX, listenerZ, listenerAngle]);

  // ─── Keyboard ───
  useEffect(() => {
    const valid = new Set(['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright']);
    const down = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      const k = ev.key.toLowerCase();
      if (valid.has(k)) { ev.preventDefault(); keysRef.current.add(k); }
    };
    const up = (ev: KeyboardEvent) => keysRef.current.delete(ev.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ─── Render loop ───
  useEffect(() => {
    const cvs = canvasRef.current;
    const box = containerRef.current;
    if (!cvs || !box) return;
    const ctx = cvs.getContext('2d')!;
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const r = box.getBoundingClientRect();
      cvs.width  = r.width * dpr;
      cvs.height = r.height * dpr;
      cvs.style.width  = r.width + 'px';
      cvs.style.height = r.height + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();

    const loop = (now: number) => {
      frameRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;

      const st = stateRef.current;
      const pr = propsRef.current;
      st.time += dt;

      // ─── Input ───
      const k = keysRef.current;
      let moved = false;

      // Forward / backward
      if (k.has('w') || k.has('arrowup')) {
        st.x += Math.sin(st.angle) * MOVE_SPD * dt;
        st.z -= Math.cos(st.angle) * MOVE_SPD * dt;
        moved = true;
      }
      if (k.has('s') || k.has('arrowdown')) {
        st.x -= Math.sin(st.angle) * MOVE_SPD * dt;
        st.z += Math.cos(st.angle) * MOVE_SPD * dt;
        moved = true;
      }
      // Strafe left / right
      if (k.has('a')) {
        st.x -= Math.cos(st.angle) * MOVE_SPD * dt;
        st.z -= Math.sin(st.angle) * MOVE_SPD * dt;
        moved = true;
      }
      if (k.has('d')) {
        st.x += Math.cos(st.angle) * MOVE_SPD * dt;
        st.z += Math.sin(st.angle) * MOVE_SPD * dt;
        moved = true;
      }
      // Rotate
      if (k.has('q') || k.has('arrowleft'))  { st.angle -= ROT_SPD * dt; moved = true; }
      if (k.has('e') || k.has('arrowright')) { st.angle += ROT_SPD * dt; moved = true; }

      // clamp
      st.x = Math.max(-BOUNDS, Math.min(BOUNDS, st.x));
      st.z = Math.max(-BOUNDS, Math.min(BOUNDS, st.z));

      if (moved) pr.onListenerMove(st.x, st.z, st.angle);

      // smooth camera
      st.camX += (st.x - st.camX) * 4 * dt;
      st.camZ += (st.z - st.camZ) * 4 * dt;

      // ─── Draw ───
      const w = cvs.width;
      const h = cvs.height;
      const sc = Math.min(w, h) / 18;   // responsive scale

      const sx = (wx: number) => w / 2 + (wx - st.camX) * sc;
      const sy = (wz: number) => h / 2 + (wz - st.camZ) * sc;

      // background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      // ambient glow
      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.45);
      const pulse = 0.06 + 0.02 * Math.sin(st.time * 0.4);
      glow.addColorStop(0, rgba(pr.accentColor, pulse));
      glow.addColorStop(1, rgba(pr.accentColor, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // grid
      drawGrid(ctx, st.camX, st.camZ, sc, w, h);

      // hearing cone
      drawCone(ctx, sx(st.x), sy(st.z), st.angle, sc);

      // distance lines
      const dA = d(st.x, st.z, pr.speakerAPos.x, pr.speakerAPos.z);
      const dB = d(st.x, st.z, pr.speakerBPos.x, pr.speakerBPos.z);
      drawDistLine(ctx, sx(st.x), sy(st.z), sx(pr.speakerAPos.x), sy(pr.speakerAPos.z), SPEAKER_A_CLR, dA, dpr);
      drawDistLine(ctx, sx(st.x), sy(st.z), sx(pr.speakerBPos.x), sy(pr.speakerBPos.z), SPEAKER_B_CLR, dB, dpr);

      // speakers
      drawSpeaker(ctx, sx(pr.speakerAPos.x), sy(pr.speakerAPos.z), 'A', pr.speakerALabel, SPEAKER_A_CLR, pr.activeSpeaker === 'A', st.time, sc, dpr);
      drawSpeaker(ctx, sx(pr.speakerBPos.x), sy(pr.speakerBPos.z), 'B', pr.speakerBLabel, SPEAKER_B_CLR, pr.activeSpeaker === 'B', st.time, sc, dpr);

      // listener
      drawListener(ctx, sx(st.x), sy(st.z), st.angle, dpr);

      // vignette
      drawVignette(ctx, w, h);

      // compass (top-left)
      const compassR = 36 * dpr;
      drawCompass(ctx, 50 * dpr, 50 * dpr, compassR, st.angle, dpr);

      // coords HUD (top-right)
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = `${Math.round(10 * dpr)}px monospace`;
      ctx.textAlign = 'right';
      const deg = ((st.angle * 180 / Math.PI) % 360 + 360) % 360;
      ctx.fillText(`X ${st.x.toFixed(1)}  Z ${st.z.toFixed(1)}`, w - 16 * dpr, 24 * dpr);
      ctx.fillText(`θ ${deg.toFixed(0)}°`, w - 16 * dpr, 40 * dpr);
      ctx.fillText(`d(A) ${dA.toFixed(1)}m   d(B) ${dB.toFixed(1)}m`, w - 16 * dpr, 56 * dpr);
      ctx.restore();
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: BG }}>
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* ─── Controls overlay ─── */}
      <div className="absolute bottom-4 left-4 select-none pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md rounded-xl px-4 py-3 border border-white/5">
          <div className="grid grid-cols-3 gap-[3px] w-fit mx-auto mb-2">
            {/* Row 1 */}
            <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/10 text-[10px] text-amber-300/70 font-bold">Q</kbd>
            <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/15 text-[10px] text-white/80 font-bold">W</kbd>
            <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/10 text-[10px] text-amber-300/70 font-bold">E</kbd>
            {/* Row 2 */}
            <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/15 text-[10px] text-white/80 font-bold">A</kbd>
            <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/15 text-[10px] text-white/80 font-bold">S</kbd>
            <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/15 text-[10px] text-white/80 font-bold">D</kbd>
          </div>
          <div className="text-[8px] text-white/25 text-center leading-snug space-y-0.5">
            <div><span className="text-white/40">W</span> forward · <span className="text-white/40">S</span> back · <span className="text-white/40">A</span> strafe ← · <span className="text-white/40">D</span> strafe →</div>
            <div><span className="text-amber-300/50">Q</span> rotate ← · <span className="text-amber-300/50">E</span> rotate →</div>
          </div>
        </div>
      </div>

      {/* ─── Ambient indicator ─── */}
      <div className="absolute bottom-4 right-4 select-none pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md rounded-xl px-3 py-2 border border-white/5 max-w-[200px]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            <span className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">FOA Ambient</span>
          </div>
          <p className="text-[9px] text-white/20 italic leading-snug">{ambientDesc}</p>
        </div>
      </div>
    </div>
  );
}
