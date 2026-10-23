import React, { useId } from 'react';
import { C, clamp01, lerp } from './Illustrations';

// Ilustraciones animadas de la explicación de Dotrino Terminal.
// Todo es determinista a partir de `frame` y de las props: nada de estado ni azar.

const MONO = 'ui-monospace, Menlo, Consolas, monospace';
const TERM_TOP = '#0f1720';
const TERM_BOTTOM = '#111a24';
const MINT_TXT = '#4fd1a5';
const PATH_TXT = '#7cc4ff';
const CURSOR = '#7dd3fc';
const TERM_TXT = '#d9e4ee';
const PURPLE_A = '#5b3fd6';
const PURPLE_B = '#8b5cf6';

const useUid = (): string => useId().replace(/:/g, '');
const blink = (frame: number, period = 30): boolean => Math.floor(frame / period) % 2 === 0;

// Reparte `typed` (0..1 sobre todos los caracteres) entre las líneas.
const revealLines = (lines: string[], typed: number): { text: string; full: boolean }[] => {
  const total = lines.reduce((n, l) => n + l.length, 0);
  let budget = Math.round(clamp01(typed) * total);
  return lines.map((l) => {
    const take = Math.max(0, Math.min(l.length, budget));
    budget -= take;
    return { text: l.slice(0, take), full: take === l.length };
  });
};

// Una línea de terminal: `$` en menta, rutas (`~/…`, `/…`) en azul claro, `✓ …` toda en menta.
const TermLine: React.FC<{ text: string; original: string; x: number; y: number; size: number }> = ({
  text,
  original,
  x,
  y,
  size,
}) => {
  if (text.length === 0) return null;
  const common = { x, y, fontFamily: MONO, fontSize: size, style: { whiteSpace: 'pre' as const } };
  if (original.startsWith('✓ ')) {
    return (
      <text {...common} fill={MINT_TXT}>
        {text}
      </text>
    );
  }
  const isPrompt = original.startsWith('$ ');
  const body = isPrompt ? text.slice(1) : text;
  const tokens = body.split(/(\s+)/);
  return (
    <text {...common} fill={TERM_TXT}>
      {isPrompt && <tspan fill={MINT_TXT}>$</tspan>}
      {tokens.map((tok, i) => {
        const isPath = /^(~|\/|\.\/)/.test(tok);
        return (
          <tspan key={i} fill={isPath ? PATH_TXT : undefined}>
            {tok}
          </tspan>
        );
      })}
    </text>
  );
};

// Marco de terminal reutilizable (fondo oscuro con brillo interior).
const TermDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-term`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={TERM_TOP} />
      <stop offset="1" stopColor={TERM_BOTTOM} />
    </linearGradient>
    <linearGradient id={`${id}-purple`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={PURPLE_A} />
      <stop offset="1" stopColor={PURPLE_B} />
    </linearGradient>
    <linearGradient id={`${id}-navy`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0d3d7a" />
      <stop offset="1" stopColor={C.dark} />
    </linearGradient>
    <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.white} stopOpacity="0.5" />
      <stop offset="1" stopColor={C.white} stopOpacity="0" />
    </linearGradient>
    <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={C.shadow} />
    </filter>
    <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// 1. ConsoleScreen
// ---------------------------------------------------------------------------

export const ConsoleScreen: React.FC<{
  frame: number;
  lines: string[];
  typed?: number;
  cursor?: boolean;
}> = ({ frame, lines, typed = 1, cursor = true }) => {
  const id = useUid();
  const shown = revealLines(lines, typed);
  const size = 13;
  const lineH = 20;
  const x0 = 18;
  const y0 = 50;
  // El cursor va al final de la última línea con texto (o al inicio de la siguiente si ya está completa).
  let cursorLine = 0;
  let cursorCol = 0;
  for (let i = 0; i < shown.length; i++) {
    if (shown[i].text.length > 0 || i === 0) {
      cursorLine = i;
      cursorCol = shown[i].text.length;
    }
  }
  if (typed >= 1 && shown.length > 0) {
    cursorLine = shown.length - 1;
    cursorCol = shown[cursorLine].text.length;
  }
  const charW = size * 0.6;
  return (
    <svg viewBox="0 0 400 260" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <TermDefs id={id} />
      <rect x="0" y="0" width="400" height="260" rx="16" fill={`url(#${id}-term)`} filter={`url(#${id}-shadow)`} />
      <rect x="0.75" y="0.75" width="398.5" height="258.5" rx="15.5" fill="none" stroke={C.white} strokeOpacity="0.08" />
      {/* barra superior */}
      <rect x="0" y="0" width="400" height="28" rx="16" fill="#182330" />
      <rect x="0" y="14" width="400" height="14" fill="#182330" />
      <line x1="0" y1="28.5" x2="400" y2="28.5" stroke={C.white} strokeOpacity="0.06" />
      <circle cx="18" cy="14" r="5" fill="#f3a6a6" />
      <circle cx="34" cy="14" r="5" fill="#f5d58a" />
      <circle cx="50" cy="14" r="5" fill="#9fe0c4" />
      <rect x="150" y="9" width="100" height="10" rx="5" fill={C.white} fillOpacity="0.08" />
      {shown.map((l, i) => (
        <TermLine key={i} text={l.text} original={lines[i]} x={x0} y={y0 + i * lineH} size={size} />
      ))}
      {cursor && blink(frame) && (
        <rect
          x={x0 + cursorCol * charW + 1}
          y={y0 + cursorLine * lineH - size + 1}
          width={charW}
          height={size + 3}
          rx="1.5"
          fill={CURSOR}
          fillOpacity="0.9"
        />
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 2. Computer (monitor de escritorio)
// ---------------------------------------------------------------------------

export const Computer: React.FC<{ frame: number; children?: React.ReactNode; glow?: number }> = ({
  frame,
  children,
  glow = 0,
}) => {
  const id = useUid();
  const g = clamp01(glow);
  const pulse = 0.85 + 0.15 * Math.sin(frame / 12);
  return (
    <svg viewBox="0 0 420 360" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <TermDefs id={id} />
      <defs>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6eef5" />
        </linearGradient>
        <linearGradient id={`${id}-stand`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe8f0" />
          <stop offset="1" stopColor="#b9c8d6" />
        </linearGradient>
      </defs>
      {/* halo */}
      {g > 0 && (
        <rect
          x="16"
          y="10"
          width="388"
          height="262"
          rx="24"
          fill={C.accent2}
          opacity={0.55 * g * pulse}
          filter={`url(#${id}-glow)`}
        />
      )}
      {/* pie y cuello */}
      <ellipse cx="210" cy="344" rx="96" ry="9" fill={C.shadow} opacity="0.6" />
      <rect x="130" y="326" width="160" height="16" rx="8" fill={`url(#${id}-stand)`} />
      <rect x="186" y="270" width="48" height="60" rx="10" fill={`url(#${id}-stand)`} />
      <rect x="186" y="270" width="48" height="60" rx="10" fill="none" stroke={C.white} strokeOpacity="0.6" />
      {/* marco */}
      <rect x="16" y="10" width="388" height="262" rx="20" fill={`url(#${id}-bezel)`} filter={`url(#${id}-shadow)`} />
      <rect x="17" y="11" width="386" height="260" rx="19" fill="none" stroke={C.white} strokeOpacity="0.9" />
      <rect x="16.5" y="10.5" width="387" height="261" rx="19.5" fill="none" stroke={C.dark} strokeOpacity="0.1" />
      {/* pantalla */}
      <rect x="30" y="24" width="360" height="234" rx="12" fill={`url(#${id}-term)`} />
      {children ? (
        <foreignObject x="30" y="24" width="360" height="234" style={{ overflow: 'hidden', borderRadius: 12 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>{children}</div>
        </foreignObject>
      ) : (
        <g>
          <text x="48" y="58" fontFamily={MONO} fontSize="14" fill={MINT_TXT}>
            $
          </text>
          {blink(frame) && <rect x="62" y="46" width="9" height="16" rx="1.5" fill={CURSOR} />}
        </g>
      )}
      {/* brillo de cristal */}
      <rect x="30" y="24" width="360" height="60" rx="12" fill={`url(#${id}-shine)`} opacity="0.12" pointerEvents="none" />
      <rect x="30.5" y="24.5" width="359" height="233" rx="11.5" fill="none" stroke={C.white} strokeOpacity="0.12" />
      {/* cámara */}
      <circle cx="210" cy="17" r="2.5" fill="#b9c8d6" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 3. PhoneScreen
// ---------------------------------------------------------------------------

type PhoneMode = 'list' | 'console' | 'scan' | 'code';

const MiniMonitor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x="0" y="0" width="16" height="11" rx="2.5" fill={C.white} />
    <rect x="2" y="2" width="12" height="7" rx="1.5" fill={C.dark} />
    <rect x="5" y="12" width="6" height="2" rx="1" fill={C.white} fillOpacity="0.8" />
  </g>
);

const Key: React.FC<{ x: number; y: number; w: number; label: string }> = ({ x, y, w, label }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x="0" y="0" width={w} height="13" rx="3.5" fill="#223040" />
    <rect x="0.5" y="0.5" width={w - 1} height="12" rx="3" fill="none" stroke={C.white} strokeOpacity="0.12" />
    <text x={w / 2} y="9.2" textAnchor="middle" fontFamily={MONO} fontSize="6.5" fill="#c6d3df">
      {label}
    </text>
  </g>
);

// Patrón QR determinista 7×7 con los tres cuadrados de localización.
const qrCells = (n: number): boolean[][] => {
  const cells: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) {
      const finder =
        (r < 3 && c < 3) || (r < 3 && c >= n - 3) || (r >= n - 3 && c < 3);
      if (finder) {
        row.push(true);
        continue;
      }
      // hash barato y determinista
      const h = (r * 7 + c * 13 + r * c * 3) % 5;
      row.push(h === 0 || h === 3);
    }
    cells.push(row);
  }
  return cells;
};

const QrPattern: React.FC<{ x: number; y: number; size: number; n?: number; fill?: string; opacity?: number }> = ({
  x,
  y,
  size,
  n = 7,
  fill = C.dark,
  opacity = 1,
}) => {
  const cells = qrCells(n);
  const s = size / n;
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      {cells.map((row, r) =>
        row.map((on, c) => {
          const finder = (r < 3 && c < 3) || (r < 3 && c >= n - 3) || (r >= n - 3 && c < 3);
          if (finder) {
            const rr = r < 3 ? r : r - (n - 3);
            const cc = c < 3 ? c : c - (n - 3);
            if (rr === 0 && cc === 0) {
              // dibujamos el localizador completo una sola vez: aro + centro
              return (
                <g key={`${r}-${c}`}>
                  <rect x={c * s} y={r * s} width={s * 3} height={s * 3} rx={s * 0.3} fill={fill} />
                  <rect x={c * s + s * 0.55} y={r * s + s * 0.55} width={s * 1.9} height={s * 1.9} fill={C.white} />
                  <rect x={c * s + s} y={r * s + s} width={s} height={s} rx={s * 0.15} fill={fill} />
                </g>
              );
            }
            return null;
          }
          return on ? (
            <rect key={`${r}-${c}`} x={c * s + s * 0.08} y={r * s + s * 0.08} width={s * 0.84} height={s * 0.84} rx={s * 0.15} fill={fill} />
          ) : null;
        }),
      )}
    </g>
  );
};

export const PhoneScreen: React.FC<{
  frame: number;
  mode: PhoneMode;
  highlight?: number;
  selected?: number;
  typed?: number;
  code?: string;
  scan?: number;
}> = ({ frame, mode, highlight = 0, selected = -1, typed = 1, code = '7K3F', scan = 0 }) => {
  const id = useUid();
  // Pantalla: x=12 y=16 w=116 h=228 rx=14
  const sx = 12;
  const sy = 16;
  const sw = 116;
  const sh = 228;

  const renderList = () => {
    const rows = [0, 1, 2];
    return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill={C.soft2} />
        {/* barra de título */}
        <rect x={sx} y={sy} width={sw} height="36" fill={C.white} />
        <line x1={sx} y1={sy + 36.5} x2={sx + sw} y2={sy + 36.5} stroke={C.dark} strokeOpacity="0.08" />
        <rect x={sx + 10} y={sy + 10} width="18" height="18" rx="5" fill={`url(#${id}-purple)`} />
        <text x={sx + 19} y={sy + 23} textAnchor="middle" fontFamily={MONO} fontSize="9" fontWeight="700" fill={C.white}>
          {'>_'}
        </text>
        <rect x={sx + 34} y={sy + 14} width="44" height="6" rx="3" fill={C.dark} fillOpacity="0.55" />
        <rect x={sx + 34} y={sy + 23} width="28" height="4" rx="2" fill={C.dark} fillOpacity="0.18" />
        <circle cx={sx + sw - 14} cy={sy + 19} r="6" fill={C.soft} />
        <circle cx={sx + sw - 14} cy={sy + 17} r="2.2" fill={C.accent} />
        <path d={`M ${sx + sw - 18} ${sy + 23} q 4 -4 8 0`} fill={C.accent} />
        {/* filas */}
        {rows.map((i) => {
          const y = sy + 50 + i * 40;
          const isSel = i === selected;
          const t = isSel ? clamp01(highlight) : 0;
          return (
            <g key={i}>
              <rect
                x={sx + 7}
                y={y}
                width={sw - 14}
                height="32"
                rx="8"
                fill={C.white}
              />
              <rect x={sx + 7} y={y} width={sw - 14} height="32" rx="8" fill={C.accent} opacity={0.18 * t} />
              <rect
                x={sx + 7.5}
                y={y + 0.5}
                width={sw - 15}
                height="31"
                rx="7.5"
                fill="none"
                stroke={C.accent}
                strokeOpacity={0.1 + 0.6 * t}
              />
              <MiniMonitor x={sx + 15} y={y + 9} />
              <rect x={sx + 38} y={y + 9} width={30 + (i % 2) * 10} height="5" rx="2.5" fill={C.dark} fillOpacity="0.6" />
              <rect x={sx + 38} y={y + 19} width={22 + ((i + 1) % 3) * 6} height="4" rx="2" fill={C.dark} fillOpacity="0.2" />
              <circle cx={sx + sw - 18} cy={y + 16} r="3.5" fill={C.mint2} />
              <circle cx={sx + sw - 18} cy={y + 16} r="5.5" fill={C.mint2} opacity={0.25 + 0.15 * Math.sin(frame / 10 + i)} />
            </g>
          );
        })}
      </g>
    );
  };

  const renderConsole = () => {
    const lines = ['$ ssh home', '~/work $', '$ ls', 'app  docs  src'];
    const shown = revealLines(lines, typed);
    const size = 7.5;
    const lh = 12;
    const x0 = sx + 8;
    const y0 = sy + 20;
    let cl = 0;
    let cc = 0;
    shown.forEach((l, i) => {
      if (l.text.length > 0 || i === 0) {
        cl = i;
        cc = l.text.length;
      }
    });
    return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill={`url(#${id}-term)`} />
        {shown.map((l, i) => (
          <TermLine key={i} text={l.text} original={lines[i]} x={x0} y={y0 + i * lh} size={size} />
        ))}
        {blink(frame) && (
          <rect x={x0 + cc * size * 0.6 + 1} y={y0 + cl * lh - size + 1} width={size * 0.6} height={size + 2} rx="1" fill={CURSOR} />
        )}
        {/* fila de teclas */}
        <rect x={sx} y={sy + sh - 24} width={sw} height="24" fill="#182330" />
        <Key x={sx + 6} y={sy + sh - 18.5} w={22} label="Esc" />
        <Key x={sx + 32} y={sy + sh - 18.5} w={22} label="Tab" />
        <Key x={sx + 58} y={sy + sh - 18.5} w={24} label="Ctrl" />
        <Key x={sx + 86} y={sy + sh - 18.5} w={24} label="↑ ↓" />
      </g>
    );
  };

  const renderScan = () => {
    const p = clamp01(scan);
    const vx = sx + 18;
    const vy = sy + 50;
    const vw = sw - 36;
    const vh = vw;
    const lineY = vy + p * vh;
    const L = 12;
    const corner = (x: number, y: number, dx: number, dy: number) => (
      <path
        d={`M ${x} ${y + dy * L} L ${x} ${y} L ${x + dx * L} ${y}`}
        fill="none"
        stroke={MINT_TXT}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
    return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill="#0b1118" />
        {/* viñeta de cámara */}
        <rect x={sx} y={sy} width={sw} height={sh} fill={`url(#${id}-vignette)`} />
        <QrPattern x={vx + 12} y={vy + 12} size={vw - 24} fill="#9fb4c8" opacity={0.35} />
        {corner(vx, vy, 1, 1)}
        {corner(vx + vw, vy, -1, 1)}
        {corner(vx, vy + vh, 1, -1)}
        {corner(vx + vw, vy + vh, -1, -1)}
        <rect x={vx + 4} y={lineY - 6} width={vw - 8} height="12" fill={MINT_TXT} opacity="0.18" />
        <line x1={vx + 4} y1={lineY} x2={vx + vw - 4} y2={lineY} stroke={MINT_TXT} strokeWidth="2" strokeLinecap="round" />
        <rect x={sx + 28} y={sy + sh - 34} width={sw - 56} height="8" rx="4" fill={C.white} fillOpacity="0.18" />
      </g>
    );
  };

  const renderCode = () => {
    const pop = 0.9 + 0.1 * Math.sin(frame / 14);
    return (
      <g>
        <rect x={sx} y={sy} width={sw} height={sh} fill={C.soft2} />
        <rect x={sx} y={sy} width={sw} height="36" fill={C.white} />
        <line x1={sx} y1={sy + 36.5} x2={sx + sw} y2={sy + 36.5} stroke={C.dark} strokeOpacity="0.08" />
        <rect x={sx + 10} y={sy + 10} width="18" height="18" rx="5" fill={`url(#${id}-purple)`} />
        <text x={sx + 19} y={sy + 23} textAnchor="middle" fontFamily={MONO} fontSize="9" fontWeight="700" fill={C.white}>
          {'>_'}
        </text>
        <rect x={sx + 34} y={sy + 14} width="44" height="6" rx="3" fill={C.dark} fillOpacity="0.55" />
        <rect x={sx + 20} y={sy + 78} width={sw - 40} height="8" rx="4" fill={C.dark} fillOpacity="0.14" />
        <g transform={`translate(${sx + sw / 2},${sy + 118}) scale(${pop})`}>
          <rect x="-46" y="-18" width="92" height="36" rx="18" fill={C.white} filter={`url(#${id}-shadow)`} />
          <rect x="-45.5" y="-17.5" width="91" height="35" rx="17.5" fill="none" stroke={C.accent} strokeOpacity="0.35" />
          <text x="0" y="7" textAnchor="middle" fontFamily={MONO} fontSize="20" fontWeight="700" fill={C.dark2} letterSpacing="2">
            {code}
          </text>
        </g>
        <circle cx={sx + sw / 2} cy={sy + 168} r="13" fill={C.mint2} />
        <circle cx={sx + sw / 2} cy={sy + 168} r="13" fill="none" stroke={C.white} strokeOpacity="0.5" />
        <path
          d={`M ${sx + sw / 2 - 6} ${sy + 168} l 4 4 l 8 -8`}
          fill="none"
          stroke={C.white}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 140 260" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <TermDefs id={id} />
      <defs>
        <radialGradient id={`${id}-vignette`} cx="0.5" cy="0.5" r="0.7">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <clipPath id={`${id}-screen`}>
          <rect x={sx} y={sy} width={sw} height={sh} rx="14" />
        </clipPath>
      </defs>
      {/* cuerpo */}
      <rect x="4" y="4" width="132" height="252" rx="22" fill={`url(#${id}-navy)`} filter={`url(#${id}-shadow)`} />
      <rect x="5" y="5" width="130" height="250" rx="21" fill="none" stroke={C.white} strokeOpacity="0.25" />
      {/* botones laterales */}
      <rect x="2" y="70" width="2.5" height="22" rx="1.2" fill="#0d3d7a" />
      <rect x="2" y="98" width="2.5" height="22" rx="1.2" fill="#0d3d7a" />
      <rect x="135.5" y="84" width="2.5" height="34" rx="1.2" fill="#0d3d7a" />
      {/* pantalla */}
      <g clipPath={`url(#${id}-screen)`}>
        {mode === 'list' && renderList()}
        {mode === 'console' && renderConsole()}
        {mode === 'scan' && renderScan()}
        {mode === 'code' && renderCode()}
      </g>
      <rect x={sx + 0.5} y={sy + 0.5} width={sw - 1} height={sh - 1} rx="13.5" fill="none" stroke={C.white} strokeOpacity="0.14" />
      {/* altavoz */}
      <rect x="56" y="8" width="28" height="4" rx="2" fill="#0a2d5c" />
      {/* brillo de cristal */}
      <rect x={sx} y={sy} width={sw} height="50" rx="14" fill={`url(#${id}-shine)`} opacity="0.1" pointerEvents="none" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 4. InviteCard (tarjeta tipo ticket)
// ---------------------------------------------------------------------------

export const InviteCard: React.FC<{ frame: number; qr?: boolean }> = ({ frame, qr = false }) => {
  const id = useUid();
  const float = Math.sin(frame / 20) * 1.5;
  return (
    <svg viewBox="0 0 260 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <TermDefs id={id} />
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.white} />
          <stop offset="1" stopColor={C.soft2} />
        </linearGradient>
        <linearGradient id={`${id}-stripe`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.accent2} />
          <stop offset="1" stopColor={C.accent} />
        </linearGradient>
        <mask id={`${id}-ticket`}>
          <rect x="6" y="6" width="248" height="148" rx="14" fill="#fff" />
          <circle cx="6" cy="80" r="9" fill="#000" />
          <circle cx="254" cy="80" r="9" fill="#000" />
          <circle cx="178" cy="6" r="7" fill="#000" />
          <circle cx="178" cy="154" r="7" fill="#000" />
        </mask>
      </defs>
      <g transform={`translate(0,${float})`}>
        <g mask={`url(#${id}-ticket)`} filter={`url(#${id}-shadow)`}>
          <rect x="6" y="6" width="248" height="148" rx="14" fill={`url(#${id}-card)`} />
          <rect x="6" y="6" width="12" height="148" fill={`url(#${id}-stripe)`} />
          {/* línea perforada */}
          <line x1="178" y1="14" x2="178" y2="146" stroke={C.dark} strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="4 5" strokeLinecap="round" />
          {/* glifo de bóveda / cerradura */}
          <g transform="translate(34,30)">
            <rect x="0" y="0" width="40" height="40" rx="10" fill={C.soft} />
            <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" fill="none" stroke={C.white} strokeOpacity="0.9" />
            <circle cx="20" cy="20" r="12" fill="none" stroke={C.accent} strokeWidth="3" />
            <circle cx="20" cy="17" r="3.2" fill={C.accent} />
            <path d="M 18 18.5 L 17 26 L 23 26 L 22 18.5 Z" fill={C.accent} />
          </g>
          {/* barras de texto */}
          <rect x="86" y="38" width="78" height="9" rx="4.5" fill={C.dark} fillOpacity="0.65" />
          <rect x="86" y="54" width="56" height="6" rx="3" fill={C.dark} fillOpacity="0.22" />
          <rect x="34" y="92" width="130" height="6" rx="3" fill={C.dark} fillOpacity="0.16" />
          <rect x="34" y="106" width="96" height="6" rx="3" fill={C.dark} fillOpacity="0.16" />
          <rect x="34" y="124" width="60" height="12" rx="6" fill={C.mint2} fillOpacity="0.18" />
          <circle cx="44" cy="130" r="3" fill={C.mint2} />
          <rect x="52" y="127.5" width="34" height="5" rx="2.5" fill={C.mint} fillOpacity="0.55" />
          {/* QR a la derecha */}
          {qr ? (
            <g>
              <rect x="192" y="44" width="50" height="50" rx="6" fill={C.white} />
              <QrPattern x="196" y="48" size={42} />
              <rect x="200" y="104" width="34" height="5" rx="2.5" fill={C.dark} fillOpacity="0.2" />
            </g>
          ) : (
            <g>
              <rect x="196" y="52" width="42" height="7" rx="3.5" fill={C.dark} fillOpacity="0.14" />
              <rect x="196" y="66" width="30" height="7" rx="3.5" fill={C.dark} fillOpacity="0.14" />
              <rect x="196" y="80" width="38" height="7" rx="3.5" fill={C.dark} fillOpacity="0.14" />
              <rect x="196" y="94" width="24" height="7" rx="3.5" fill={C.dark} fillOpacity="0.14" />
            </g>
          )}
          {/* brillo */}
          <rect x="6" y="6" width="248" height="40" fill={`url(#${id}-shine)`} opacity="0.7" />
        </g>
        <rect x="6.75" y="6.75" width="246.5" height="146.5" rx="13.5" fill="none" stroke={C.dark} strokeOpacity="0.08" mask={`url(#${id}-ticket)`} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 5. CodeChip
// ---------------------------------------------------------------------------

const mix = (a: string, b: string, t: number): string => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const CodeChip: React.FC<{ code: string; approved?: number }> = ({ code, approved = 0 }) => {
  const id = useUid();
  const t = clamp01(approved);
  const bg = mix('#ffffff', '#e3f6f0', t);
  const border = mix(C.accent2, C.mint2, t);
  const txt = mix(C.dark2, C.mint, t);
  // el check aparece con un pequeño rebote
  const s = t <= 0 ? 0 : t < 1 ? 1.15 * Math.sin((t * Math.PI) / 2) : 1;
  return (
    <svg viewBox="0 0 260 110" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <TermDefs id={id} />
      <rect x="10" y="15" width="240" height="80" rx="40" fill={bg} filter={`url(#${id}-shadow)`} />
      <rect x="11.5" y="16.5" width="237" height="77" rx="38.5" fill="none" stroke={border} strokeWidth="3" strokeOpacity={0.55 + 0.45 * t} />
      <rect x="14" y="19" width="232" height="72" rx="36" fill="none" stroke={C.white} strokeOpacity="0.9" />
      <rect x="20" y="22" width="220" height="30" rx="15" fill={`url(#${id}-shine)`} opacity="0.5" />
      <text
        x={t > 0 ? 118 : 130}
        y="71"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="46"
        fontWeight="700"
        fill={txt}
        letterSpacing="6"
      >
        {code}
      </text>
      {t > 0 && (
        <g transform={`translate(214,55) scale(${s})`}>
          <circle r="20" fill={C.mint2} />
          <circle r="20" fill="none" stroke={C.white} strokeOpacity="0.6" strokeWidth="1.5" />
          <path d="M -9 0 l 6 6 l 12 -12" fill="none" stroke={C.white} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 6. EncryptedTunnel
// ---------------------------------------------------------------------------

const Packet: React.FC<{ x: number; y: number; color: string; opacity: number; flip?: boolean }> = ({
  x,
  y,
  color,
  opacity,
  flip,
}) => (
  <g transform={`translate(${x},${y})${flip ? ' scale(-1,1)' : ''}`} opacity={opacity}>
    <rect x="-16" y="-16" width="32" height="32" rx="9" fill={color} />
    <rect x="-15.5" y="-15.5" width="31" height="31" rx="8.5" fill="none" stroke={C.white} strokeOpacity="0.55" />
    {/* candado */}
    <path d="M -5 -2 v -4 a 5 5 0 0 1 10 0 v 4" fill="none" stroke={C.white} strokeWidth="2.2" strokeLinecap="round" />
    <rect x="-7.5" y="-2" width="15" height="11" rx="3" fill={C.white} />
    <circle cx="0" cy="3" r="1.8" fill={color} />
  </g>
);

export const EncryptedTunnel: React.FC<{ frame: number; flow?: number }> = ({ frame, flow = 1 }) => {
  const id = useUid();
  const f = clamp01(flow);
  const W = 900;
  const cy = 100;
  // paquetes de ida (azul) y de vuelta (menta), con desfase determinista
  const forward = [0, 0.22, 0.47, 0.71].map((o, i) => ({ o, dy: i % 2 === 0 ? -12 : 10 }));
  const back = [0.1, 0.6].map((o, i) => ({ o, dy: i % 2 === 0 ? 14 : -10 }));
  const period = 240;
  const pos = (o: number) => (((frame / period + o) % 1) + 1) % 1;
  const edge = (p: number) => clamp01(Math.min(p, 1 - p) * 8);
  return (
    <svg viewBox="0 0 900 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <TermDefs id={id} />
      <defs>
        <linearGradient id={`${id}-tube`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf5fc" />
          <stop offset="0.5" stopColor="#cfe7f7" />
          <stop offset="1" stopColor="#b7d9ef" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-edges`}>
          <rect x="0" y="0" width={W} height="200" fill={`url(#${id}-fade)`} />
        </mask>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.accent2} />
          <stop offset="1" stopColor={C.accent} />
        </linearGradient>
      </defs>
      <g mask={`url(#${id}-edges)`}>
        {/* tubo */}
        <rect x="0" y={cy - 40} width={W} height="80" rx="40" fill={`url(#${id}-tube)`} opacity="0.95" />
        <rect x="0" y={cy - 40} width={W} height="80" rx="40" fill="none" stroke={C.accent} strokeOpacity="0.18" strokeWidth="2" />
        <rect x="0" y={cy - 36} width={W} height="22" rx="11" fill={`url(#${id}-shine)`} opacity="0.9" />
        {/* anillos del tubo, para dar sensación de avance */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = ((i * 110 + (frame * 0.6) % 110) % (W + 110)) - 55;
          return <rect key={i} x={x} y={cy - 38} width="4" height="76" rx="2" fill={C.accent} opacity="0.07" />;
        })}
        {/* paquetes */}
        {forward.map((p, i) => {
          const t = pos(p.o);
          const x = t * W;
          const y = cy + p.dy + Math.sin(frame / 9 + i) * 3;
          return <Packet key={`f${i}`} x={x} y={y} color={C.accent} opacity={f * edge(t)} />;
        })}
        {back.map((p, i) => {
          const t = 1 - pos(p.o);
          const x = t * W;
          const y = cy + p.dy + Math.cos(frame / 11 + i) * 3;
          return <Packet key={`b${i}`} x={x} y={y} color={C.mint2} opacity={f * edge(t)} flip />;
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 7. AgentBadge
// ---------------------------------------------------------------------------

export const AgentBadge: React.FC<{ frame: number; on?: number }> = ({ frame, on = 0 }) => {
  const id = useUid();
  const o = clamp01(on);
  const ph = (frame % 60) / 60; // pulso que nace en el borde y se expande
  const r1 = 44 + ph * 14;
  const a1 = (1 - ph) * 0.6;
  const ph2 = ((frame + 30) % 60) / 60;
  const r2 = 44 + ph2 * 14;
  const a2 = (1 - ph2) * 0.6;
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <TermDefs id={id} />
      {o > 0 && (
        <g>
          <circle cx="60" cy="60" r={r1} fill="none" stroke={C.mint2} strokeWidth="3" opacity={a1 * o} />
          <circle cx="60" cy="60" r={r2} fill="none" stroke={C.mint2} strokeWidth="3" opacity={a2 * o} />
          <circle cx="60" cy="60" r="47" fill="none" stroke={C.mint2} strokeWidth="3" opacity={0.9 * o} />
        </g>
      )}
      <circle cx="60" cy="60" r="40" fill={`url(#${id}-purple)`} filter={`url(#${id}-shadow)`} />
      <circle cx="60" cy="60" r="38.5" fill="none" stroke={C.white} strokeOpacity="0.45" strokeWidth="1.5" />
      <ellipse cx="60" cy="44" rx="26" ry="14" fill={`url(#${id}-shine)`} opacity="0.5" />
      <text x="60" y="71" textAnchor="middle" fontFamily={MONO} fontSize="30" fontWeight="700" fill={C.white}>
        {'>_'}
      </text>
      {o > 0 && (
        <g transform="translate(90,30)" opacity={o}>
          <circle r="9" fill={C.mint2} />
          <circle r="9" fill="none" stroke={C.white} strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};
