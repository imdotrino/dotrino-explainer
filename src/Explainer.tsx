import React, { createContext, useContext, useEffect, useState } from 'react';
import { LANGS, type Lang, type LangConfig } from './lang';
import {
  AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import {
  Check, MessageCircle, MapPin, Gamepad2, Image as ImageIcon, KeyRound, FileText, Hand, Eye, EyeOff,
} from 'lucide-react';
import {
  C, lerp, clamp01, Place, Phone, Tablet, Laptop, Vault, Shield, Padlock, DotrinoCloud, Avatar, Packet, Tile, Pulse,
} from './Illustrations';

export const FPS = 30;

// La narración empieza cuando el logo ya se está yendo.
const AUDIO_START = 30;
const f = (s: number) => Math.round(s * FPS);
const at = (s: number) => AUDIO_START + f(s);

// Lo que depende del idioma (voz, guion y tiempos) llega por contexto desde lang.ts.
const LangCtx = createContext<LangConfig>(LANGS.es);
const useLang = () => useContext(LangCtx);
const scenesOf = (L: LangConfig) =>
  L.scenes.map((to, i) => ({ from: i === 0 ? at(0) - 6 : at(L.scenes[i - 1]), to: at(to) }));
export const totalFrames = (lang: Lang) => at(LANGS[lang].audioLen) + f(2.2);
const OVERLAP = 12;

const CX = 960;
const CY = 430;

// ---------- piezas comunes ----------

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      new FontFace('Quicksand', `url(${staticFile('quicksand.woff2')})`, { weight: '300 700' }),
      new FontFace('Comfortaa', `url(${staticFile('comfortaa.woff2')})`, { weight: '300 700' }),
    ];
    Promise.all(faces.map((ff) => ff.load())).then((loaded) => {
      loaded.forEach((ff) => document.fonts.add(ff));
      continueRender(handle);
    });
  }, [handle]);
};

const pop = (frame: number, fps: number, delay = 0, damping = 12) =>
  spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } });

const ramp = (frame: number, a: number, b: number, easing?: (t: number) => number) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

// Sombra suave en el piso bajo un objeto.
const Floor: React.FC<{ x: number; y: number; w: number; o?: number }> = ({ x, y, w, o = 1 }) => (
  <div style={{
    position: 'absolute', left: x - w / 2, top: y - w * 0.09, width: w, height: w * 0.18, borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(5,54,116,0.22), rgba(5,54,116,0) 70%)', opacity: o,
  }} />
);

const Badge: React.FC<{ x: number; y: number; s: number; size?: number; children: React.ReactNode }> = ({ x, y, s, size = 80, children }) => (
  <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${s})`, zIndex: 5 }}>
    {children}
  </div>
);

// Envuelve una escena: entra subiendo, sale desvaneciéndose.
const SceneShell: React.FC<{ dur: number; children: (frame: number) => React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = pop(frame, fps, 0, 16);
  const exit = interpolate(frame, [dur - OVERLAP, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{
      opacity: Math.min(enter, exit),
      transform: `translateY(${(1 - enter) * 60}px) scale(${0.96 + 0.04 * enter + (1 - exit) * 0.06})`,
    }}>
      {children(frame)}
    </AbsoluteFill>
  );
};

// Curva suave (cuadrática) entre dos puntos, con un arco hacia arriba.
const arc = (a: { x: number; y: number }, b: { x: number; y: number }, lift = 80) => (t: number) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - lift;
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * mx + t * t * b.x, y: u * u * a.y + 2 * u * t * my + t * t * b.y };
};
const arcD = (a: { x: number; y: number }, b: { x: number; y: number }, lift = 80) =>
  `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - lift} ${b.x} ${b.y}`;

// ---------- escenas ----------

const APPS = [MessageCircle, MapPin, Gamepad2, ImageIcon, KeyRound, FileText];

const SceneEcosystem: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const devs = [
    { x: CX - 420, y: CY + 40, w: 150, h: 280, Comp: Phone },
    { x: CX, y: CY - 10, w: 380, h: 300, Comp: Laptop },
    { x: CX + 420, y: CY + 30, w: 220, h: 280, Comp: Tablet },
  ];
  const line = ramp(frame, 24, 64, Easing.out(Easing.cubic));
  const links = [[0, 1], [1, 2]] as const;
  const anchors = devs.map((d) => ({ x: d.x, y: d.y - 40 }));
  return (
    <>
      {/* órbita de apps, con profundidad: detrás más pequeñas y tenues */}
      {APPS.map((Icon, i) => {
        const a = (i / APPS.length) * Math.PI * 2 + frame * 0.007;
        const depth = (Math.sin(a) + 1) / 2; // 0 = atrás, 1 = delante
        const s = pop(frame, fps, 4 + i * 5) * (0.7 + depth * 0.5);
        return (
          <Tile key={i} x={CX + Math.cos(a) * 760} y={CY - 20 + Math.sin(a) * 250} size={100} scale={s}
            opacity={0.45 + depth * 0.55} z={depth > 0.5 ? 4 : 0} bg={`linear-gradient(160deg, ${C.soft2}, ${C.soft})`}>
            <Icon size={52} color={C.dark} strokeWidth={1.8} />
          </Tile>
        );
      })}
      <svg width={1920} height={1080} style={{ position: 'absolute', zIndex: 1 }}>
        <defs>
          <filter id="eco-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {links.map(([a, b]) => {
          const d = arcD(anchors[a], anchors[b], 120);
          return (
            <g key={a}>
              <path d={d} stroke={C.accent} strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.25} filter="url(#eco-glow)"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
              <path d={d} stroke={C.accent} strokeWidth={6} fill="none" strokeLinecap="round"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
            </g>
          );
        })}
      </svg>
      {devs.map((d, i) => <Floor key={i} x={d.x} y={d.y + d.h / 2 + 6} w={d.w * 1.3} o={pop(frame, fps, i * 6)} />)}
      {devs.map((d, i) => (
        <Place key={i} x={d.x} y={d.y} w={d.w} h={d.h} scale={pop(frame, fps, i * 6)} float={6} frame={frame} phase={i * 2} z={2}>
          <d.Comp frame={frame} seed={i} />
        </Place>
      ))}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        {frame > 64 && links.map(([a, b], k) => {
          const t = ((frame - 64 + k * 22) % 44) / 44;
          const back = ((frame - 64 + k * 22 + 11) % 44) / 44;
          return (
            <React.Fragment key={k}>
              <Packet path={arc(anchors[a], anchors[b], 120)} t={t} />
              <Packet path={arc(anchors[b], anchors[a], 120)} t={back} color={C.mint} r={9} trail={5} />
            </React.Fragment>
          );
        })}
      </div>
      {links.map(([a, b], k) => (
        <Badge key={k} x={(anchors[a].x + anchors[b].x) / 2} y={(anchors[a].y + anchors[b].y) / 2 - 120} s={pop(frame, fps, 66 + k * 8, 9)} size={86}>
          <Shield check={ramp(frame, 72 + k * 8, 86 + k * 8)} />
        </Badge>
      ))}
    </>
  );
};

const SceneAccounts: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const card = pop(frame, fps, 0, 14);
  const fields = [0, 1, 2].map((i) => ramp(frame, 12 + i * 10, 34 + i * 10, Easing.out(Easing.cubic)));
  const done = pop(frame, fps, 50, 8);
  const shimmerX = ((frame * 14) % 900) - 200;
  return (
    <>
      <Floor x={CX} y={CY + 215} w={720} o={card} />
      <div style={{
        position: 'absolute', left: CX - 340, top: CY - 200, width: 680, height: 400, borderRadius: 44,
        background: `linear-gradient(160deg, #ffffff, ${C.soft2})`, boxShadow: '0 30px 70px rgba(5,54,116,0.16), inset 0 1px 0 #fff',
        transform: `scale(${card})`, overflow: 'hidden',
      }}>
        {/* franja de marca y brillo que recorre la tarjeta */}
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 14, background: `linear-gradient(90deg, ${C.accent}, ${C.mint})` }} />
        <div style={{
          position: 'absolute', left: shimmerX, top: -50, width: 140, height: 500, transform: 'rotate(18deg)',
          background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))', opacity: 0.8,
        }} />
        <div style={{ position: 'absolute', left: 56, top: 90, width: 190, height: 190, transform: `scale(${pop(frame, fps, 6)})` }}>
          <Avatar color={C.accent} />
        </div>
        {fields.map((b, i) => {
          const w = i === 2 ? 220 : 340;
          return (
            <div key={i} style={{ position: 'absolute', left: 290, top: 108 + i * 64, width: 340, height: 30, borderRadius: 15, background: '#e4ecf2' }}>
              <div style={{
                width: w * b, height: '100%', borderRadius: 15,
                background: i === 0 ? `linear-gradient(90deg, ${C.accent}, ${C.accent2})` : `linear-gradient(90deg, ${C.soft}, #bfdff2)`,
                boxShadow: b > 0 && b < 1 ? `0 0 14px ${C.accent}` : 'none',
              }} />
              {b > 0 && b < 1 && <div style={{ position: 'absolute', left: w * b - 2, top: 2, width: 4, height: 26, background: C.accent, borderRadius: 2 }} />}
            </div>
          );
        })}
        {/* huella de llave: puntos que se encienden */}
        <div style={{ position: 'absolute', left: 290, top: 318, display: 'flex', gap: 10 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: 5, background: C.mint,
              opacity: ramp(frame, 36 + i * 1.4, 42 + i * 1.4) * 0.9, transform: `scale(${ramp(frame, 36 + i * 1.4, 42 + i * 1.4)})`,
            }} />
          ))}
        </div>
      </div>
      {[0, 1].map((k) => <Pulse key={k} x={CX + 310} y={CY - 180} r={62} t={clamp01((frame - 52 - k * 10) / 30)} />)}
      <div style={{
        position: 'absolute', left: CX + 310 - 62, top: CY - 180 - 62, width: 124, height: 124, borderRadius: 62,
        background: `linear-gradient(145deg, ${C.mint2}, ${C.mint})`, transform: `scale(${done})`,
        boxShadow: '0 16px 36px rgba(0,107,92,0.35), inset 0 2px 0 rgba(255,255,255,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={74} color={C.white} strokeWidth={3} />
      </div>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + random(`sp${i}`) * 0.5;
        const t = clamp01((frame - 52) / 34);
        const d = 70 + t * 130 * (0.6 + random(`sd${i}`) * 0.6);
        return (
          <div key={i} style={{
            position: 'absolute', left: CX + 310 + Math.cos(a) * d - 7, top: CY - 180 + Math.sin(a) * d - 7, width: 14, height: 14,
            borderRadius: i % 2 ? 4 : 7, background: i % 3 ? C.mint : C.accent, opacity: Math.sin(t * Math.PI), transform: `rotate(${frame * 6}deg)`,
          }} />
        );
      })}
    </>
  );
};

const SceneTrusted: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const R = 330;
  const pts = [0, 1, 2].map((i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
    return { x: CX + Math.cos(a) * 180, y: CY + 10 + Math.sin(a) * 170 };
  });
  const devs = [
    { Comp: Laptop, w: 260, h: 205 },
    { Comp: Tablet, w: 150, h: 190 },
    { Comp: Phone, w: 100, h: 190 },
  ];
  // Un dato intenta salir y rebota en el borde.
  const esc = ramp(frame, 80, 130);
  const escR = R * Math.sin(Math.PI * esc) * 0.96;
  const hit = interpolate(frame, [100, 105, 124], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // «a menos que tú lo decidas»: se abre una puerta y sale uno.
  const toggle = ramp(frame, 168, 178, Easing.out(Easing.cubic));
  const out = ramp(frame, 180, 222, Easing.inOut(Easing.cubic));
  const gapDeg = toggle * 34;
  const outside = { x: CX + 640, y: CY - 10 };
  const exitPath = arc({ x: CX + 60, y: CY - 40 }, outside, 140);
  const circ = 2 * Math.PI * R;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <defs>
          <radialGradient id="tr-in" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.6" stopColor={C.soft} stopOpacity="0.15" /><stop offset="1" stopColor={C.soft} stopOpacity="0.6" />
          </radialGradient>
          <filter id="tr-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10" /></filter>
        </defs>
        <circle cx={CX} cy={CY} r={R} fill="url(#tr-in)" />
        {/* halo exterior */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={hit > 0 ? C.mint : C.accent} strokeWidth={22} opacity={0.18 + hit * 0.3} filter="url(#tr-glow)" />
        {/* anillo punteado giratorio */}
        <circle cx={CX} cy={CY} r={R + 16} fill="none" stroke={C.accent} strokeWidth={3} strokeDasharray="6 14" opacity={0.5}
          strokeDashoffset={frame * 1.2} />
        {/* anillo principal, con una puerta que se abre a la derecha (ángulo 0) */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={hit > 0 ? C.mint : C.accent} strokeWidth={7 + hit * 7} strokeLinecap="round"
          strokeDasharray={`${circ * (1 - gapDeg / 360)} ${circ * (gapDeg / 360)}`}
          transform={`rotate(${gapDeg / 2} ${CX} ${CY})`} />
        {/* onda del rebote */}
        {hit > 0 && <circle cx={CX + R} cy={CY} r={20 + (1 - hit) * 90} fill="none" stroke={C.mint} strokeWidth={5} opacity={hit} />}
      </svg>
      {frame > 10 && [[0, 1], [1, 2], [2, 0]].map(([a, b], k) => {
        const t = ((frame + k * 15) % 45) / 45;
        return <Packet key={k} path={arc(pts[a], pts[b], 40)} t={t} r={11} trail={6} />;
      })}
      {esc > 0 && esc < 1 && <Packet path={(t) => ({ x: CX + R * Math.sin(Math.PI * t) * 0.96, y: CY })} t={esc} color={C.mint} r={15} trail={8} />}
      {pts.map((p, i) => {
        const d = devs[i];
        return (
          <Place key={i} x={p.x} y={p.y} w={d.w} h={d.h} scale={pop(frame, fps, i * 5)} float={5} frame={frame} phase={i * 2.1}>
            <d.Comp frame={frame} seed={i + 3} />
          </Place>
        );
      })}
      {/* la otra persona, fuera del círculo */}
      <Place x={outside.x} y={outside.y} w={150} h={150} scale={pop(frame, fps, 160, 10)} float={5} frame={frame} phase={1}>
        <Avatar />
      </Place>
      {/* interruptor */}
      <div style={{
        position: 'absolute', left: CX - 80, top: CY + R + 28, width: 160, height: 78, borderRadius: 39,
        background: toggle > 0.5 ? `linear-gradient(145deg, ${C.mint2}, ${C.mint})` : 'linear-gradient(145deg, #d7e0e6, #bcc8d0)',
        boxShadow: toggle > 0.5 ? '0 10px 30px rgba(0,107,92,0.4), inset 0 2px 4px rgba(0,0,0,0.15)' : 'inset 0 2px 4px rgba(0,0,0,0.15)',
        opacity: ramp(frame, 150, 160), transform: `scale(${pop(frame, fps, 150, 10)})`,
      }}>
        <div style={{
          position: 'absolute', top: 7, left: 7 + toggle * 82, width: 64, height: 64, borderRadius: 32,
          background: 'linear-gradient(160deg, #ffffff, #e6eef4)', boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
        }} />
        <div style={{ position: 'absolute', left: 168, top: 6 + Math.sin(frame * 0.2) * 2 * (toggle < 1 ? 1 : 0), transform: `rotate(${-10 + toggle * 10}deg)` }}>
          <Hand size={64} color={C.text} strokeWidth={1.6} />
        </div>
      </div>
      {out > 0 && out < 1 && <Packet path={exitPath} t={out} color={C.mint} r={15} trail={9} />}
      {out >= 1 && <Pulse x={outside.x} y={outside.y} r={75} t={clamp01((frame - 222) / 28)} />}
    </>
  );
};

const SceneChoose: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const xs = [CX - 440, CX, CX + 440];
  const devs = [
    { Comp: Phone, w: 150, h: 280 },
    { Comp: Laptop, w: 400, h: 318 },
    { Comp: Tablet, w: 220, h: 280 },
  ];
  const cursor = interpolate(frame, [8, 30, 50, 66], [0, 2, 0.4, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const chosen = pop(frame, fps, 72, 10);
  const vault = pop(frame, fps, 92, 9);
  const door = 1 - ramp(frame, 108, 126, Easing.inOut(Easing.cubic)); // abierta → cerrada
  const dial = interpolate(frame, [126, 160], [0, 540], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const hx = lerp(xs[0], xs[2], cursor / 2);
  const ringO = interpolate(frame, [4, 10, 72, 80], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <>
      {/* selector que recorre los aparatos */}
      <div style={{
        position: 'absolute', left: hx - 170, top: CY - 180, width: 340, height: 340, borderRadius: 80, opacity: ringO,
        border: `8px solid ${C.mint}`, boxShadow: `0 0 40px rgba(0,107,92,0.35), inset 0 0 40px rgba(0,107,92,0.12)`,
      }} />
      {[0, 1, 2, 3].map((k) => (
        <div key={k} style={{
          position: 'absolute', opacity: ringO, left: hx + (k % 2 ? 150 : -170), top: CY + (k < 2 ? -180 : 140), width: 20, height: 40,
          borderRadius: 6, background: C.mint, transform: `rotate(${k * 90}deg)`,
        }} />
      ))}
      {xs.map((x, i) => {
        const sc = i === 1 ? 1 + chosen * 0.3 : pop(frame, fps, i * 4) * (1 - chosen * 0.25);
        const op = i === 1 ? 1 : 1 - chosen * 0.65;
        const d = devs[i];
        return (
          <React.Fragment key={i}>
            <Floor x={x} y={CY + d.h / 2 + 10} w={d.w * 1.3 * sc} o={op} />
            {i === 1 && chosen > 0 && <Pulse x={x} y={CY} r={260} t={clamp01((frame - 72) / 36)} color={C.accent} width={5} />}
            <Place x={x} y={CY} w={d.w} h={d.h} scale={sc} opacity={op} float={5} frame={frame} phase={i}>
              <d.Comp frame={frame} seed={i + 6} />
            </Place>
          </React.Fragment>
        );
      })}
      <Badge x={CX + 190} y={CY - 150} s={vault} size={170}>
        <Vault frame={frame} open={door} dial={dial} />
      </Badge>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: CY + 200, textAlign: 'center',
        fontFamily: 'Comfortaa', fontWeight: 700, fontSize: 84, color: C.dark, letterSpacing: 2,
        textShadow: '0 6px 24px rgba(5,54,116,0.18)',
        opacity: ramp(frame, 100, 114),
        transform: `translateY(${interpolate(frame, [100, 114], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
      }}>{useLang().vaultWord}</div>
    </>
  );
};

const SceneOptions: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const items = [
    { Comp: Phone, x: CX - 520, at: 34, w: 170, h: 320 },
    { Comp: Laptop, x: CX, at: 74, w: 400, h: 318 },
    { Comp: DotrinoCloud, x: CX + 520, at: 122, w: 380, h: 260 },
  ];
  return (
    <>
      {items.map((it, i) => {
        const s = pop(frame, fps, it.at, 12);
        const isCloud = i === 2;
        return (
          <React.Fragment key={i}>
            {isCloud && [0, 1, 2].map((k) => (
              <Pulse key={k} x={it.x} y={CY} r={190} t={((frame - 150 + k * 20) % 60) / 60 * (frame > 150 ? 1 : 0)} />
            ))}
            {!isCloud && <Floor x={it.x} y={CY + it.h / 2 + 10} w={it.w * 1.3} o={s} />}
            <div style={{ position: 'absolute', left: 0, top: (1 - s) * 80, opacity: s, width: 1920, height: 1080 }}>
              <Place x={it.x} y={CY} w={it.w} h={it.h} float={6} frame={frame} phase={i * 1.7}>
                <it.Comp frame={frame} seed={i + 9} />
              </Place>
              <Badge x={it.x + it.w / 2 - 10} y={CY - it.h / 2 + 10} s={pop(frame, fps, it.at + 10, 9)} size={120}>
                <Vault frame={frame} dial={interpolate(frame, [it.at + 10, it.at + 50], [0, 360], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })} />
              </Badge>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

const GLYPHS = 'A9#xQ$7k%Zp@3!vW&8m*R?';
const scramble = (frame: number, n: number, seed: string) =>
  Array.from({ length: n }, (_, i) => GLYPHS[Math.floor(random(`${seed}-${Math.floor(frame / 3)}-${i}`) * GLYPHS.length)]).join('');

const SceneEncrypted: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const L = { x: CX - 600, y: CY + 40 };
  const Rr = { x: CX + 600, y: CY + 40 };
  const M = { x: CX, y: CY - 100 };
  const aL = { x: L.x + 40, y: L.y - 60 };
  const aR = { x: Rr.x - 60, y: Rr.y - 60 };
  const aM = { x: M.x, y: M.y + 10 };
  const lock = 1 - ramp(frame, 14, 26, Easing.inOut(Easing.cubic));
  const cycle = 64;
  const t = ((frame - 24) % cycle) / cycle;
  const path = (tt: number) => (tt < 0.5 ? arc(aL, aM, 160)(tt * 2) : arc(aM, aR, 160)((tt - 0.5) * 2));
  const { encrypted: E } = useLang();
  const eye = pop(frame, fps, f(E.eye), 10);
  const slash = ramp(frame, f(E.slash[0]), f(E.slash[1]));
  const notDotrino = pop(frame, fps, f(E.notDotrino), 9);
  const d = `${arcD(aL, aM, 160)} ${arcD(aM, aR, 160).replace(/^M [^Q]+/, '')}`;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <defs><filter id="en-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="8" /></filter></defs>
        <path d={d} stroke={C.accent} strokeWidth={18} fill="none" opacity={0.12} filter="url(#en-glow)" />
        <path d={d} stroke={C.accent} strokeWidth={5} fill="none" strokeDasharray="6 20" strokeLinecap="round" opacity={0.6} strokeDashoffset={-frame * 2} />
      </svg>
      <Floor x={L.x} y={L.y + 150} w={200} />
      <Floor x={Rr.x} y={Rr.y + 160} w={520} />
      <Place x={L.x} y={L.y} w={160} h={300} scale={pop(frame, fps, 0)} float={5} frame={frame} phase={0}><Phone frame={frame} seed={12} /></Place>
      <Place x={Rr.x} y={Rr.y} w={400} h={318} scale={pop(frame, fps, 6)} float={5} frame={frame} phase={2}><Laptop frame={frame} seed={13} /></Place>
      <Place x={M.x} y={M.y} w={360} h={240} scale={pop(frame, fps, 10)} float={7} frame={frame} phase={4}><DotrinoCloud frame={frame} /></Place>
      <Badge x={L.x + 90} y={L.y - 110} s={pop(frame, fps, 14, 8)} size={112}><Padlock open={lock} /></Badge>
      <Badge x={Rr.x + 190} y={Rr.y - 130} s={pop(frame, fps, 18, 8)} size={112}><Padlock open={lock} /></Badge>
      {frame > 24 && <Packet path={path} t={t} color={C.dark} r={12} trail={9} label={scramble(frame, 9, 'msg')} />}
      {/* el ojo tachado */}
      <div style={{
        position: 'absolute', left: CX - 80, top: CY + 150, width: 160, height: 160, borderRadius: 80, transform: `scale(${eye})`,
        background: `linear-gradient(160deg, #ffffff, ${C.soft2})`, boxShadow: '0 16px 40px rgba(5,54,116,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {slash > 0.5 ? <EyeOff size={100} color={C.muted} strokeWidth={1.6} /> : <Eye size={100} color={C.muted} strokeWidth={1.6} />}
        <div style={{
          position: 'absolute', inset: -6, borderRadius: '50%', border: `6px solid ${C.mint}`, opacity: slash,
          transform: `scale(${0.8 + slash * 0.2})`,
        }} />
      </div>
      {/* lo que ve la nube: solo ruido */}
      <div style={{
        position: 'absolute', left: M.x + 170, top: M.y - 60, padding: '12px 26px', borderRadius: 26,
        background: `linear-gradient(160deg, #ffffff, ${C.soft2})`, boxShadow: '0 14px 30px rgba(5,54,116,0.16)', fontFamily: 'monospace', fontSize: 34,
        color: C.dark, transform: `scale(${notDotrino})`, letterSpacing: 3, border: `2px solid ${C.soft}`,
      }}>{scramble(frame, 6, 'srv')}</div>
    </>
  );
};

// ---------- capas fijas ----------

const LogoCard: React.FC<{ frame: number; fps: number; size?: number }> = ({ frame, fps, size = 1 }) => {
  const s = pop(frame, fps, 0, 14);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${size * (0.9 + 0.1 * s)})` }}>
      <Img src={staticFile('bird.png')} style={{ width: 360 }} />
      <div style={{ fontFamily: 'Comfortaa', fontWeight: 700, fontSize: 132, color: C.dark, marginTop: 20 }}>dotrino</div>
    </div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = useLang().captions.find(([a, b]) => frame >= at(a) && frame < at(b));
  if (!cur) return null;
  const local = frame - at(cur[0]);
  const o = interpolate(local, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{
        maxWidth: 1480, padding: '18px 36px', borderRadius: 28, background: 'rgba(255,255,255,0.94)',
        boxShadow: '0 8px 30px rgba(5,54,116,0.10)', fontFamily: 'Quicksand', fontWeight: 600, fontSize: 44,
        lineHeight: 1.3, color: C.text, textAlign: 'center',
      }}>{cur[2]}</div>
    </div>
  );
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const blobs = [
    { x: 260, y: 220, r: 380, sp: 0.004 },
    { x: 1680, y: 820, r: 460, sp: -0.003 },
    { x: 1500, y: 160, r: 260, sp: 0.005 },
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #ffffff 0%, ${C.bg} 60%, #eef4f8 100%)` }}>
      {blobs.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', left: b.x + Math.cos(frame * b.sp * 6 + i) * 60 - b.r, top: b.y + Math.sin(frame * b.sp * 6 + i) * 40 - b.r,
          width: b.r * 2, height: b.r * 2, borderRadius: '50%', background: C.soft, opacity: 0.5, filter: 'blur(60px)',
        }} />
      ))}
      {/* capa de puntos con paralaje lento */}
      <svg width={1920} height={1080} style={{ position: 'absolute', opacity: 0.35 }}>
        <defs>
          <pattern id="bg-dots" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform={`translate(${(frame * 0.25) % 64} ${(frame * 0.12) % 64})`}>
            <circle cx="2" cy="2" r="2" fill={C.accent} opacity="0.35" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#bg-dots)" />
      </svg>
      {/* anillos grandes muy tenues, paralaje opuesto */}
      <svg width={1920} height={1080} style={{ position: 'absolute', opacity: 0.5 }}>
        {[520, 760, 1000].map((r, i) => (
          <circle key={i} cx={CX + Math.sin(frame * 0.004 + i) * 30} cy={CY + Math.cos(frame * 0.003 + i) * 20} r={r} fill="none" stroke={C.soft} strokeWidth={2} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const SCENE_COMPONENTS = [SceneEcosystem, SceneAccounts, SceneTrusted, SceneChoose, SceneOptions, SceneEncrypted];

export const Explainer: React.FC<{ lang: Lang }> = ({ lang }) => (
  <LangCtx.Provider value={LANGS[lang]}>
    <ExplainerBody />
  </LangCtx.Provider>
);

const ExplainerBody: React.FC = () => {
  useFonts();
  const L = useLang();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOpacity = interpolate(frame, [18, 42], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Backdrop />
      {scenesOf(L).map((s, i) => {
        const Comp = SCENE_COMPONENTS[i];
        const dur = s.to - s.from + OVERLAP;
        return (
          <Sequence key={i} from={s.from} durationInFrames={dur}>
            <SceneShell dur={dur}>{(fr) => <Comp frame={fr} />}</SceneShell>
          </Sequence>
        );
      })}
      <Sequence from={at(L.welcomeFrom)}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <WelcomeScene />
        </AbsoluteFill>
      </Sequence>
      <Captions />
      {introOpacity > 0 && (
        <AbsoluteFill style={{ background: C.white, opacity: introOpacity, alignItems: 'center', justifyContent: 'center' }}>
          <LogoCard frame={1000} fps={fps} />
        </AbsoluteFill>
      )}
      <Sequence from={AUDIO_START}>
        <Audio src={staticFile(L.audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};

const WelcomeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 0, 12);
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{
          position: 'absolute', left: '50%', top: '38%', width: 420 + k * 220, height: 420 + k * 220, borderRadius: '50%',
          transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * Math.sin(frame * 0.05 + k)})`,
          border: `3px solid ${C.soft}`, opacity: 0.8 - k * 0.22,
        }} />
      ))}
      <LogoCard frame={frame} fps={fps} size={0.75} />
      <div style={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 96, color: C.accent, marginTop: 30 }}>{useLang().welcomeWord}</div>
    </div>
  );
};
