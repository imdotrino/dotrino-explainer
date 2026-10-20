import React, { useId } from 'react';
import { Img, staticFile } from 'remotion';

export const C = {
  bg: '#f7fafc', text: '#181c1e', accent: '#00658c', soft: '#d4ecfa', mint: '#006b5c',
  dark: '#053674', white: '#ffffff', muted: '#5b6670',
  // tintes y sombras de la misma familia
  dark2: '#0a4a8f', accent2: '#2a8bb5', soft2: '#eaf5fc', mint2: '#1f8f7c', shadow: 'rgba(5,54,116,0.16)',
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// Posiciona un SVG centrado en (x, y) con una leve flotación.
export const Place: React.FC<{
  x: number; y: number; w: number; h: number; scale?: number; opacity?: number; rot?: number;
  float?: number; frame?: number; phase?: number; children: React.ReactNode; z?: number;
}> = ({ x, y, w, h, scale = 1, opacity = 1, rot = 0, float = 0, frame = 0, phase = 0, children, z }) => {
  const fy = float ? Math.sin(frame * 0.05 + phase) * float : 0;
  const fr = float ? Math.sin(frame * 0.035 + phase) * 1.2 : 0;
  return (
    <div style={{
      position: 'absolute', left: x - w / 2, top: y - h / 2 + fy, width: w, height: h, opacity, zIndex: z,
      transform: `scale(${scale}) rotate(${rot + fr}deg)`, transformOrigin: '50% 60%',
    }}>
      {children}
    </div>
  );
};

// ---------- contenido de pantalla (UI diminuta y datos que brillan) ----------

const ScreenUI: React.FC<{ x: number; y: number; w: number; h: number; frame: number; seed?: number; id: string }> =
  ({ x, y, w, h, frame, seed = 0, id }) => {
    const u = Math.min(w, h) / 10;
    const rows = 4;
    return (
      <g clipPath={`url(#${id}-clip)`}>
        <defs>
          <clipPath id={`${id}-clip`}><rect x={x} y={y} width={w} height={h} rx={u * 0.6} /></clipPath>
        </defs>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-scr)`} />
        {/* barra superior */}
        <rect x={x + u * 0.8} y={y + u * 0.9} width={w * 0.34} height={u * 0.7} rx={u * 0.35} fill={C.accent} opacity={0.85} />
        <circle cx={x + w - u * 1.3} cy={y + u * 1.25} r={u * 0.42} fill={C.mint} opacity={0.8} />
        {/* tarjetas */}
        {Array.from({ length: rows }, (_, i) => {
          const ry = y + u * 2.6 + i * (h - u * 3.4) / rows;
          const rh = (h - u * 3.4) / rows - u * 0.5;
          const wob = 0.55 + 0.35 * Math.abs(Math.sin(frame * 0.03 + i * 1.3 + seed));
          return (
            <g key={i}>
              <rect x={x + u * 0.8} y={ry} width={w - u * 1.6} height={rh} rx={u * 0.45} fill={C.white} opacity={0.9} />
              <rect x={x + u * 1.3} y={ry + rh * 0.3} width={(w - u * 3) * wob} height={rh * 0.22} rx={rh * 0.11} fill={C.soft} />
              <rect x={x + u * 1.3} y={ry + rh * 0.62} width={(w - u * 3) * 0.45} height={rh * 0.16} rx={rh * 0.08} fill={C.soft2} />
            </g>
          );
        })}
        {/* dato que viaja por la pantalla */}
        {(() => {
          const t = ((frame * 0.9 + seed * 37) % 90) / 90;
          const gy = y + u * 2.2 + t * (h - u * 3);
          return <>
            <rect x={x + u * 0.8} y={gy - u * 0.9} width={w - u * 1.6} height={u * 1.8} fill={`url(#${id}-glow)`} opacity={0.75} />
            <circle cx={x + w - u * 1.5} cy={gy} r={u * 0.3} fill={C.accent2} opacity={0.9} />
          </>;
        })()}
      </g>
    );
  };

const ScreenDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-scr`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={C.soft2} /><stop offset="1" stopColor={C.soft} />
    </linearGradient>
    <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.accent} stopOpacity="0" /><stop offset="0.5" stopColor={C.accent} stopOpacity="0.28" /><stop offset="1" stopColor={C.accent} stopOpacity="0" />
    </linearGradient>
    <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={C.dark2} /><stop offset="1" stopColor={C.dark} />
    </linearGradient>
    <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" /><stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
    </linearGradient>
    <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor={C.dark} floodOpacity="0.22" />
    </filter>
  </defs>
);

// ---------- dispositivos ----------

export const Phone: React.FC<{ frame: number; seed?: number }> = ({ frame, seed = 0 }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 140 260" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ScreenDefs id={id} />
      <g filter={`url(#${id}-sh)`}>
        <rect x="16" y="14" width="120" height="240" rx="22" fill={C.dark} opacity="0.55" />
        <rect x="10" y="6" width="120" height="240" rx="22" fill={`url(#${id}-body)`} />
      </g>
      <rect x="127" y="60" width="4" height="34" rx="2" fill={C.dark2} />
      <rect x="6" y="52" width="4" height="22" rx="2" fill={C.dark2} />
      <rect x="6" y="82" width="4" height="22" rx="2" fill={C.dark2} />
      <ScreenUI x={18} y={18} w={104} h={216} frame={frame} seed={seed} id={id} />
      <rect x="52" y="22" width="36" height="7" rx="3.5" fill={C.dark} />
      <rect x="10" y="6" width="120" height="240" rx="22" fill={`url(#${id}-shine)`} />
      <rect x="10.5" y="6.5" width="119" height="239" rx="21.5" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
    </svg>
  );
};

export const Tablet: React.FC<{ frame: number; seed?: number }> = ({ frame, seed = 0 }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 220 280" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ScreenDefs id={id} />
      <g filter={`url(#${id}-sh)`}>
        <rect x="18" y="16" width="196" height="260" rx="20" fill={C.dark} opacity="0.55" />
        <rect x="10" y="6" width="196" height="260" rx="20" fill={`url(#${id}-body)`} />
      </g>
      <ScreenUI x={22} y={20} w={172} h={232} frame={frame} seed={seed} id={id} />
      <circle cx="108" cy="13" r="2.6" fill={C.soft} opacity="0.7" />
      <rect x="10" y="6" width="196" height="260" rx="20" fill={`url(#${id}-shine)`} />
      <rect x="10.5" y="6.5" width="195" height="259" rx="19.5" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
    </svg>
  );
};

export const Laptop: React.FC<{ frame: number; seed?: number }> = ({ frame, seed = 0 }) => {
  const id = useId().replace(/:/g, '');
  const keys: React.ReactNode[] = [];
  const rows = [12, 12, 11, 10];
  rows.forEach((n, r) => {
    for (let k = 0; k < n; k++) {
      const kw = 232 / 12 - 3;
      keys.push(<rect key={`${r}-${k}`} x={56 + r * 4 + k * (kw + 3)} y={214 + r * 11} width={kw} height={8} rx={2} fill={C.white} opacity={0.75} />);
    }
  });
  return (
    <svg viewBox="0 0 340 270" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ScreenDefs id={id} />
      <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dbe8f2" /><stop offset="1" stopColor="#b9cfe0" />
      </linearGradient>
      <g filter={`url(#${id}-sh)`}>
        <rect x="46" y="18" width="250" height="186" rx="14" fill={C.dark} opacity="0.55" />
        <rect x="40" y="10" width="250" height="186" rx="14" fill={`url(#${id}-body)`} />
      </g>
      <ScreenUI x={50} y={20} w={230} h={160} frame={frame} seed={seed} id={id} />
      <circle cx="165" cy="15" r="2.4" fill={C.soft} opacity="0.8" />
      <rect x="40" y="10" width="250" height="186" rx="14" fill={`url(#${id}-shine)`} />
      {/* base con teclado y trackpad */}
      <g filter={`url(#${id}-sh)`}>
        <path d="M18 206 H322 L336 246 Q338 256 328 256 H12 Q2 256 4 246 Z" fill={`url(#${id}-base)`} />
      </g>
      <path d="M18 206 H322 L336 246 Q338 256 328 256 H12 Q2 256 4 246 Z" fill="none" stroke="#ffffff" strokeOpacity="0.7" />
      {keys}
      <rect x="128" y="248" width="84" height="5" rx="2.5" fill={C.white} opacity="0.7" />
      <rect x="146" y="203" width="48" height="4" rx="2" fill={C.dark2} />
    </svg>
  );
};

// ---------- caja fuerte: dial que gira y puerta que se cierra ----------

export const Vault: React.FC<{ frame: number; open?: number; dial?: number; dark?: boolean }> = ({ frame, open = 0, dial, dark = true }) => {
  const id = useId().replace(/:/g, '');
  const rot = dial ?? frame * 2.2;
  const sx = Math.max(0.06, 1 - open * 0.94);
  const faceA = dark ? C.dark2 : C.accent2;
  const faceB = dark ? C.dark : C.accent;
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={faceA} /><stop offset="1" stopColor={faceB} /></linearGradient>
        <linearGradient id={`${id}-d`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={faceB} /><stop offset="1" stopColor={faceA} /></linearGradient>
        <radialGradient id={`${id}-in`} cx="0.5" cy="0.5" r="0.6"><stop offset="0" stopColor={C.soft} /><stop offset="1" stopColor={C.accent} /></radialGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor={C.soft} /></linearGradient>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor={C.dark} floodOpacity="0.28" />
        </filter>
      </defs>
      <g filter={`url(#${id}-sh)`}>
        <rect x="18" y="20" width="176" height="166" rx="22" fill={faceB} opacity="0.6" />
        <rect x="10" y="10" width="176" height="166" rx="22" fill={`url(#${id}-b)`} />
      </g>
      {/* interior (se ve cuando la puerta está abierta) */}
      <rect x="28" y="28" width="140" height="130" rx="14" fill={`url(#${id}-in)`} opacity={open} />
      {open > 0.1 && [0, 1, 2].map((i) => (
        <rect key={i} x={44} y={48 + i * 34} width={108} height={14} rx={7} fill={C.white} opacity={0.75 * open} />
      ))}
      {/* puerta */}
      <g transform={`translate(28 0) scale(${sx} 1) translate(-28 0)`}>
        <rect x="28" y="28" width="140" height="130" rx="14" fill={`url(#${id}-d)`} />
        <rect x="28.5" y="28.5" width="139" height="129" rx="13.5" fill="none" stroke="#ffffff" strokeOpacity="0.28" />
        {/* dial */}
        <g transform={`rotate(${rot} 98 93)`}>
          <circle cx="98" cy="93" r="34" fill={`url(#${id}-metal)`} />
          <circle cx="98" cy="93" r="26" fill="none" stroke={C.accent} strokeWidth="3" strokeDasharray="3 7" />
          <circle cx="98" cy="93" r="10" fill={C.accent} />
          <path d="M98 64 L98 74" stroke={C.mint} strokeWidth="5" strokeLinecap="round" />
        </g>
        <circle cx="98" cy="93" r="34" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
        {/* manija y bisagras */}
        <rect x="144" y="70" width="10" height="46" rx="5" fill={`url(#${id}-metal)`} />
        <rect x="36" y="44" width="8" height="18" rx="3" fill={C.soft} opacity="0.7" />
        <rect x="36" y="124" width="8" height="18" rx="3" fill={C.soft} opacity="0.7" />
      </g>
      <rect x="40" y="176" width="22" height="14" rx="4" fill={faceB} />
      <rect x="134" y="176" width="22" height="14" rx="4" fill={faceB} />
    </svg>
  );
};

// ---------- escudo con check ----------

export const Shield: React.FC<{ check?: number }> = ({ check = 1 }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 110" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.mint2} /><stop offset="1" stopColor={C.mint} /></linearGradient>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor={C.mint} floodOpacity="0.35" /></filter>
      </defs>
      <path d="M50 4 L90 20 V52 C90 78 70 96 50 106 C30 96 10 78 10 52 V20 Z" fill={`url(#${id}-g)`} filter={`url(#${id}-sh)`} />
      <path d="M50 12 L82 25 V52 C82 72 66 88 50 97 C34 88 18 72 18 52 V25 Z" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2" />
      <path d="M32 54 L45 67 L70 40" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="60" strokeDashoffset={60 * (1 - check)} />
    </svg>
  );
};

// ---------- candado con arco animado ----------

export const Padlock: React.FC<{ open?: number }> = ({ open = 0 }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 120" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.mint2} /><stop offset="1" stopColor={C.mint} /></linearGradient>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e9f3f9" /><stop offset="1" stopColor="#b9cfe0" /></linearGradient>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor={C.mint} floodOpacity="0.35" /></filter>
      </defs>
      <g transform={`translate(0 ${-open * 16}) rotate(${open * -28} 70 56)`}>
        <path d="M30 60 V36 A20 20 0 0 1 70 36 V60" fill="none" stroke={`url(#${id}-m)`} strokeWidth="12" strokeLinecap="round" />
      </g>
      <rect x="14" y="54" width="72" height="58" rx="14" fill={`url(#${id}-g)`} filter={`url(#${id}-sh)`} />
      <rect x="15" y="55" width="70" height="56" rx="13" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />
      <circle cx="50" cy="78" r="7" fill="#ffffff" />
      <rect x="47" y="82" width="6" height="14" rx="3" fill="#ffffff" />
    </svg>
  );
};

// ---------- nube de Dotrino (con el pajarito) ----------

export const DotrinoCloud: React.FC<{ frame: number }> = ({ frame }) => {
  const id = useId().replace(/:/g, '');
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox="0 0 300 200" width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor={C.soft} /></linearGradient>
          <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="18" stdDeviation="16" floodColor={C.dark} floodOpacity="0.2" /></filter>
        </defs>
        <path d="M78 170 C40 170 22 142 30 116 C36 96 56 86 76 90 C78 56 110 34 142 42 C160 20 198 20 216 46 C250 40 282 66 276 100 C294 110 294 150 266 164 C250 172 230 170 220 170 Z"
          fill={`url(#${id}-g)`} filter={`url(#${id}-sh)`} />
        <path d="M78 170 C40 170 22 142 30 116 C36 96 56 86 76 90 C78 56 110 34 142 42 C160 20 198 20 216 46 C250 40 282 66 276 100 C294 110 294 150 266 164 C250 172 230 170 220 170 Z"
          fill="none" stroke="#ffffff" strokeWidth="3" />
        {[0, 1, 2].map((i) => {
          const t = ((frame * 0.7 + i * 30) % 90) / 90;
          return <circle key={i} cx={60 + t * 180} cy={150 - Math.sin(t * Math.PI) * 10 - i * 6} r={3.5} fill={C.accent2} opacity={0.5 * Math.sin(t * Math.PI)} />;
        })}
      </svg>
      <Img src={staticFile('bird.png')} style={{ position: 'absolute', left: '33%', top: '26%', width: '34%' }} />
    </div>
  );
};

// ---------- avatar abstracto (sin cara) ----------

export const Avatar: React.FC<{ color?: string }> = ({ color = C.mint }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor={C.soft} /></linearGradient>
        <clipPath id={`${id}-c`}><circle cx="50" cy="50" r="46" /></clipPath>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="12" stdDeviation="10" floodColor={C.dark} floodOpacity="0.2" /></filter>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${id}-g)`} filter={`url(#${id}-sh)`} />
      <g clipPath={`url(#${id}-c)`}>
        <circle cx="50" cy="40" r="16" fill={color} />
        <ellipse cx="50" cy="86" rx="30" ry="24" fill={color} />
      </g>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
};

// ---------- paquete de datos con estela de partículas ----------

export const Packet: React.FC<{
  path: (t: number) => { x: number; y: number }; t: number; color?: string; r?: number; trail?: number; label?: string;
}> = ({ path, t, color = C.accent, r = 13, trail = 7, label }) => {
  const p = path(t);
  return (
    <>
      {Array.from({ length: trail }, (_, i) => {
        const tt = t - (i + 1) * 0.028;
        if (tt < 0) return null;
        const q = path(tt);
        const k = 1 - (i + 1) / (trail + 1);
        return (
          <div key={i} style={{
            position: 'absolute', left: q.x - r * k * 0.8, top: q.y - r * k * 0.8, width: r * k * 1.6, height: r * k * 1.6,
            borderRadius: '50%', background: color, opacity: 0.45 * k,
          }} />
        );
      })}
      <div style={{
        position: 'absolute', left: p.x - r, top: p.y - r, width: r * 2, height: r * 2, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #ffffff, ${color} 70%)`, boxShadow: `0 0 24px ${color}, 0 0 6px #ffffff`,
      }} />
      {label && (
        <div style={{
          position: 'absolute', left: p.x - 120, top: p.y - 86, width: 240, height: 62, borderRadius: 31,
          background: `linear-gradient(135deg, ${C.dark2}, ${C.dark})`, color: C.white, fontFamily: 'monospace', fontSize: 32,
          letterSpacing: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 14px 30px rgba(5,54,116,0.3)', border: '2px solid rgba(255,255,255,0.35)',
        }}>{label}</div>
      )}
    </>
  );
};

// ---------- tarjeta blanca con profundidad (para apps/badges) ----------

export const Tile: React.FC<{ x: number; y: number; size: number; scale?: number; opacity?: number; bg?: string; children: React.ReactNode; z?: number }> =
  ({ x, y, size, scale = 1, opacity = 1, bg, children, z }) => (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z,
      borderRadius: size * 0.27, background: bg ?? `linear-gradient(160deg, #ffffff, ${C.soft2})`, opacity,
      transform: `scale(${scale})`, boxShadow: `0 ${size * 0.12}px ${size * 0.3}px rgba(5,54,116,0.14), inset 0 1px 0 #ffffff`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</div>
  );

// Anillo de pulso.
export const Pulse: React.FC<{ x: number; y: number; r: number; t: number; color?: string; width?: number }> = ({ x, y, r, t, color = C.mint, width = 6 }) => (
  <div style={{
    position: 'absolute', left: x - r - t * r * 0.6, top: y - r - t * r * 0.6, width: (r + t * r * 0.6) * 2, height: (r + t * r * 0.6) * 2,
    borderRadius: '50%', border: `${width}px solid ${color}`, opacity: t <= 0 || t >= 1 ? 0 : (1 - t) * 0.8,
  }} />
);
