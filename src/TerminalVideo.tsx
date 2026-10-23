import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { C, clamp01, lerp, Place, Phone, Tablet, Laptop, Vault, Shield, Padlock, Packet, Pulse } from './Illustrations';
import {
  FPS, INTRO_HOLD, AUDIO_START, OVERLAP, CX, CY, useFonts, pop, ramp, Floor, Badge, SceneShell, arc, arcD, LogoCard, Backdrop,
} from './Explainer';
import { ConsoleScreen, Computer, PhoneScreen, InviteCard, CodeChip, EncryptedTunnel, AgentBadge } from './TerminalArt';

// Video «Dotrino Terminal». Lo que cambia por idioma: voz, guion, tiempos y textos en pantalla.
// Los tiempos salen de script/terminal-<lang>.srt, en segundos del audio.
export type TLang = 'es' | 'en';
type TConfig = {
  audio: string; audioLen: number; captions: [number, number, string][];
  scenes: number[]; outroFrom: number;
  // Instantes (segundos del audio) en que pasa cada cosa dentro de las escenas.
  t: {
    devices: [number, number, number]; typeFrom: number; installed: number;
    invite: number; paste: number; code: number; approve: number; once: number;
    card: number; scan: number; deviceCode: number; deviceOk: number;
    icon: number; list: number; pick: number; inside: number; close: number; resume: number; tagline: number;
  };
  installed: string; pastePrompt: string; received: string; ready: string; tagline: string;
};
const T: Record<TLang, TConfig> = {
  es: {
    audio: 'terminal-es.mp3', audioLen: 61.872,
    captions: [
      [0.1, 7.756, 'Con Dotrino Terminal entras a tu computadora desde cualquier dispositivo: tu teléfono, una tablet u otra computadora.'],
      [7.706, 14.411, 'Primero, en la computadora a la que quieres entrar, instala el agente de Terminal con un solo comando.'],
      [14.411, 17.819, 'La primera vez te pide enlazarla con tu Bóveda.'],
      [17.819, 23.496, 'En la Bóveda pide una invitación, pégala en el agente y aprueba el código que te muestra.'],
      [23.496, 25.877, 'Se hace una sola vez.'],
      [25.877, 34.411, 'Después enlaza el dispositivo desde el que vas a entrar: escanea la invitación de tu Bóveda y aprueba en ella el código que aparece en la pantalla.'],
      [34.411, 35.927, 'Listo.'],
      [35.927, 38.809, 'Abre Terminal en ese dispositivo.'],
      [38.809, 42.218, 'Tus computadoras aparecen solas en la lista.'],
      [42.218, 44.924, 'Elige una y ya estás dentro.'],
      [44.924, 50.488, 'Lo que escribes viaja cifrado de extremo a extremo, solo entre tus dispositivos.'],
      [50.488, 56.578, 'Si cierras la app, la consola sigue abierta en tu computadora, y la retomas donde la dejaste.'],
      [56.578, 58.571, 'Dotrino Terminal.'],
      [58.571, 61.829, 'Tu computadora, desde cualquier lugar.'],
    ],
    scenes: [7.73, 14.411, 25.877, 34.411, 44.924, 56.578], outroFrom: 56.578,
    t: {
      devices: [4.6, 5.6, 6.4], typeFrom: 9.6, installed: 12.6,
      invite: 18.7, paste: 20.2, code: 21.4, approve: 22.6, once: 23.5,
      card: 28.4, scan: 29.2, deviceCode: 31.4, deviceOk: 33.2,
      icon: 36.0, list: 38.9, pick: 42.4, inside: 43.6, close: 50.9, resume: 54.6, tagline: 58.6,
    },
    installed: '✓ agente de Terminal listo', pastePrompt: 'Pega la invitación:', received: '✓ invitación recibida',
    ready: '✓ listo en 2,4 s', tagline: 'Tu computadora, desde cualquier lugar.',
  },
  en: {
    audio: 'terminal-en.mp3', audioLen: 55.56,
    captions: [
      [0.1, 7.139, 'With Dotrino Terminal you get into your computer from any device: your phone, a tablet or another computer.'],
      [7.089, 13.589, 'First, on the computer you want to get into, install the Terminal agent with a single command.'],
      [13.589, 16.892, 'The first time, it asks you to link it to your Vault.'],
      [16.892, 23.668, 'In your Vault, ask for an invitation, paste it into the agent and approve the code it shows you.'],
      [23.668, 25.615, 'You only do this once.'],
      [25.615, 33.247, "Then link the device you'll use to get in: scan the invitation from your Vault and approve there the code that appears on the screen."],
      [33.247, 34.26, "That's it."],
      [34.26, 36.405, 'Open Terminal on that device.'],
      [36.405, 39.431, 'Your computers show up in the list by themselves.'],
      [39.431, 41.076, "Pick one and you're in."],
      [41.076, 45.721, 'What you type travels end-to-end encrypted, only between your devices.'],
      [45.721, 51.576, 'If you close the app, the console stays open on your computer, and you pick up where you left off.'],
      [51.576, 53.207, 'Dotrino Terminal.'],
      [53.207, 55.536, 'Your computer, from anywhere.'],
    ],
    scenes: [7.11, 13.589, 25.615, 33.247, 41.076, 51.576], outroFrom: 51.576,
    t: {
      devices: [4.7, 5.5, 6.2], typeFrom: 9.5, installed: 12.5,
      invite: 18.2, paste: 19.8, code: 21.5, approve: 22.7, once: 23.8,
      card: 27.6, scan: 28.6, deviceCode: 30.8, deviceOk: 32.4,
      icon: 34.4, list: 36.5, pick: 39.6, inside: 40.6, close: 46.2, resume: 50.3, tagline: 53.2,
    },
    installed: '✓ Terminal agent ready', pastePrompt: 'Paste the invitation:', received: '✓ invitation received',
    ready: '✓ done in 2.4 s', tagline: 'Your computer, from anywhere.',
  },
};
const LCtx = createContext<TConfig>(T.es);
const useT = () => useContext(LCtx);

const f = (s: number) => Math.round(s * FPS);
const at = (s: number) => AUDIO_START + f(s);
// Frame local de una escena para un instante del audio.
const local = (L: TConfig, scene: number, s: number) => f(s - (scene === 0 ? 0 : L.scenes[scene - 1]));
export const terminalFrames = (lang: TLang) => at(T[lang].audioLen) + f(2.2);

const session = (L: TConfig) => ['$ ls', 'src  docs  run.sh', '$ npm run build', L.ready, '$ '];

// Caja posicionada por su centro, para meter el arte de TerminalArt.
const Box: React.FC<{ x: number; y: number; w: number; h: number; s?: number; o?: number; z?: number; children: React.ReactNode }> =
  ({ x, y, w, h, s = 1, o = 1, z, children }) => (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `scale(${s})`, opacity: o, zIndex: z }}>
      {children}
    </div>
  );

const Line: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; t: number; lift?: number; color?: string }> =
  ({ a, b, t, lift = 80, color = C.accent }) => (
    <svg width={1920} height={1080} style={{ position: 'absolute', zIndex: 1 }}>
      <path d={arcD(a, b, lift)} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    </svg>
  );

// 1. Desde cualquier dispositivo, a tu computadora.
const SceneAnyDevice: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const L = useT();
  const comp = { x: CX + 360, y: CY };
  const devs = [
    { x: CX - 560, y: CY - 150, w: 120, h: 224, Comp: Phone, at: local(L, 0, L.t.devices[0]) },
    { x: CX - 480, y: CY + 150, w: 170, h: 216, Comp: Tablet, at: local(L, 0, L.t.devices[1]) },
    { x: CX - 170, y: CY + 10, w: 260, h: 206, Comp: Laptop, at: local(L, 0, L.t.devices[2]) },
  ];
  return (
    <>
      <Floor x={comp.x} y={comp.y + 200} w={620} o={pop(frame, fps, 0)} />
      <Box x={comp.x} y={comp.y} w={540} h={462} s={pop(frame, fps, 0, 14)} z={2}>
        <Computer frame={frame} glow={ramp(frame, 20, 50)}>
          <ConsoleScreen frame={frame} lines={session(L)} typed={ramp(frame, 20, 160)} />
        </Computer>
      </Box>
      {devs.map((d, i) => {
        const s = pop(frame, fps, d.at - 10);
        const line = ramp(frame, d.at, d.at + 20, Easing.out(Easing.cubic));
        const a = { x: d.x, y: d.y }, b = { x: comp.x - 200, y: comp.y - 40 };
        return (
          <React.Fragment key={i}>
            <Line a={a} b={b} t={line} lift={60} />
            {line >= 1 && <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
              <Packet path={arc(a, b, 60)} t={((frame - d.at) % 40) / 40} r={10} trail={5} />
            </div>}
            <Place x={d.x} y={d.y} w={d.w} h={d.h} scale={s} float={5} frame={frame} phase={i * 2} z={2}>
              <d.Comp frame={frame} seed={i} />
            </Place>
          </React.Fragment>
        );
      })}
    </>
  );
};

// 2. Instala el agente con un solo comando.
const SceneInstall: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const L = useT();
  const done = local(L, 1, L.t.installed);
  return (
    <>
      <Floor x={CX} y={CY + 250} w={760} />
      <Box x={CX} y={CY} w={720} h={616} s={pop(frame, fps, 0, 14)} z={2}>
        <Computer frame={frame}>
          <ConsoleScreen frame={frame} lines={['$ npm install -g @dotrino/terminal-agent', L.installed]} typed={ramp(frame, local(L, 1, L.t.typeFrom), done)} />
        </Computer>
      </Box>
      <Box x={CX + 330} y={CY - 250} w={150} h={150} s={pop(frame, fps, done, 9)} z={3}>
        <AgentBadge frame={frame} on={ramp(frame, done + 8, done + 20)} />
      </Box>
    </>
  );
};

// 3. La primera vez: invitación de la Bóveda, código y aprobación.
const SceneLinkVault: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const L = useT();
  const vault = { x: CX - 470, y: CY + 10 };
  const comp = { x: CX + 430, y: CY - 10 };
  const invite = local(L, 2, L.t.invite);
  const paste = local(L, 2, L.t.paste);
  const code = local(L, 2, L.t.code);
  const approve = local(L, 2, L.t.approve);
  const once = local(L, 2, L.t.once);
  const fly = ramp(frame, invite + 10, paste, Easing.inOut(Easing.cubic));
  const card = arc({ x: vault.x, y: vault.y - 60 }, { x: comp.x, y: comp.y - 60 }, 220)(fly);
  const ok = ramp(frame, approve, approve + 14);
  const cs = pop(frame, fps, code, 10);
  return (
    <>
      <Floor x={vault.x} y={vault.y + 190} w={420} />
      <Place x={vault.x} y={vault.y} w={300} h={330} scale={pop(frame, fps, 0)} float={4} frame={frame} z={2}>
        <Vault frame={frame} open={1 - ramp(frame, approve, approve + 20)} dark />
      </Place>
      <Floor x={comp.x} y={comp.y + 200} w={560} />
      <Box x={comp.x} y={comp.y} w={480} h={411} s={pop(frame, fps, 6, 14)} z={2}>
        <Computer frame={frame} glow={ok}>
          <ConsoleScreen frame={frame} lines={['$ dotrino-terminal-agent', L.pastePrompt, ...(frame > paste ? [L.received] : [])]} typed={ramp(frame, 10, 60)} />
        </Computer>
      </Box>
      <Box x={comp.x + 210} y={comp.y - 200} w={110} h={110} s={pop(frame, fps, 10, 10)} z={3}>
        <AgentBadge frame={frame} on={ok} />
      </Box>
      <Line a={{ x: vault.x + 150, y: vault.y - 40 }} b={{ x: comp.x - 240, y: comp.y - 40 }} t={ok} lift={120} color={C.mint} />
      {frame > invite && fly < 1 && (
        <Box x={card.x} y={card.y} w={260} h={160} s={pop(frame, fps, invite, 10)} z={4}>
          <InviteCard frame={frame} />
        </Box>
      )}
      {[vault.x, comp.x].map((x, i) => (
        <Box key={i} x={x} y={CY + 290} w={260} h={110} s={cs} z={4}>
          <CodeChip code="7K3F" approved={ok} />
        </Box>
      ))}
      <Badge x={CX} y={CY - 200} s={pop(frame, fps, once, 9)} size={110}>
        <Shield check={ramp(frame, once + 6, once + 18)} />
      </Badge>
      {ok > 0 && <Pulse x={CX} y={CY - 200} r={70} t={clamp01((frame - once) / 30)} />}
    </>
  );
};

// 4. Enlaza el dispositivo: escanea la invitación y aprueba el código.
const SceneLinkDevice: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const L = useT();
  const vault = { x: CX - 430, y: CY + 20 };
  const phone = { x: CX + 380, y: CY };
  const scanFrom = local(L, 3, L.t.scan);
  const codeAt = local(L, 3, L.t.deviceCode);
  const approve = local(L, 3, L.t.deviceOk);
  const ok = ramp(frame, approve, approve + 14);
  const mode = frame < scanFrom - 20 ? 'list' : frame < codeAt ? 'scan' : 'code';
  return (
    <>
      <Floor x={vault.x} y={vault.y + 180} w={400} />
      <Place x={vault.x} y={vault.y} w={280} h={308} scale={pop(frame, fps, 0)} float={4} frame={frame} z={2}>
        <Vault frame={frame} open={0} dark />
      </Place>
      <Box x={vault.x} y={vault.y - 230} w={300} h={185} s={pop(frame, fps, local(L, 3, L.t.card), 10)} z={3}>
        <InviteCard frame={frame} qr />
      </Box>
      <Floor x={phone.x} y={phone.y + 230} w={300} />
      <Place x={phone.x} y={phone.y} w={240} h={446} scale={pop(frame, fps, 6)} float={5} frame={frame} z={2}>
        <PhoneScreen frame={frame} mode={mode} scan={ramp(frame, scanFrom - 20, codeAt)} code="4M9Q" />
      </Place>
      {mode === 'scan' && <Line a={{ x: phone.x - 120, y: phone.y - 60 }} b={{ x: vault.x + 150, y: vault.y - 230 }} t={ramp(frame, scanFrom - 20, scanFrom + 10)} lift={40} color={C.mint} />}
      <Box x={vault.x} y={CY + 300} w={260} h={110} s={pop(frame, fps, codeAt + 6, 10)} z={4}>
        <CodeChip code="4M9Q" approved={ok} />
      </Box>
      <Line a={{ x: vault.x + 140, y: vault.y - 20 }} b={{ x: phone.x - 120, y: phone.y - 20 }} t={ok} lift={110} color={C.mint} />
    </>
  );
};

// 5. Abre Terminal: tus computadoras en la lista, eliges una y estás dentro.
const SceneOpen: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const L = useT();
  const phone = { x: CX - 120, y: CY };
  const comp = { x: CX + 470, y: CY };
  const listAt = local(L, 4, L.t.list);
  const pick = local(L, 4, L.t.pick);
  const inside = local(L, 4, L.t.inside);
  const iconS = pop(frame, fps, local(L, 4, L.t.icon), 9);
  const iconO = 1 - ramp(frame, listAt - 6, listAt + 6);
  return (
    <>
      <Floor x={phone.x} y={phone.y + 260} w={340} />
      <Place x={phone.x} y={phone.y} w={270} h={502} scale={pop(frame, fps, 0, 12)} float={5} frame={frame} z={2}>
        <PhoneScreen frame={frame} mode={frame < inside ? 'list' : 'console'} highlight={ramp(frame, pick, pick + 10)}
          selected={frame >= pick ? 0 : -1} typed={ramp(frame, inside, inside + 60)} />
      </Place>
      {iconO > 0 && (
        <div style={{ position: 'absolute', left: phone.x - 90, top: phone.y - 90, width: 180, height: 180, zIndex: 4, opacity: iconO, transform: `scale(${iconS})` }}>
          <Img src={staticFile('terminal-icon.png')} style={{ width: 180, borderRadius: 40, boxShadow: '0 20px 50px rgba(5,54,116,0.3)' }} />
        </div>
      )}
      <Floor x={comp.x} y={comp.y + 170} w={460} o={ramp(frame, inside - 10, inside)} />
      <Box x={comp.x} y={comp.y} w={400} h={343} s={pop(frame, fps, inside - 10, 12)} z={2}>
        <Computer frame={frame} glow={ramp(frame, inside, inside + 15)}>
          <ConsoleScreen frame={frame} lines={['$ ']} typed={1} />
        </Computer>
      </Box>
      <Line a={{ x: phone.x + 140, y: phone.y - 30 }} b={{ x: comp.x - 200, y: comp.y - 30 }} t={ramp(frame, inside, inside + 18)} lift={90} />
      {frame > pick && frame < inside + 20 && <Pulse x={phone.x} y={phone.y - 90} r={60} t={clamp01((frame - pick) / 24)} color={C.accent} />}
    </>
  );
};

// 6. Cifrado entre tus aparatos, y la consola sigue viva en la computadora.
const SceneEncrypted: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const L = useT();
  const phone = { x: CX - 600, y: CY };
  const comp = { x: CX + 520, y: CY - 10 };
  const close = local(L, 5, L.t.close);
  const resume = local(L, 5, L.t.resume);
  const away = ramp(frame, close, close + 14) * (1 - ramp(frame, resume, resume + 14));
  const flow = 1 - away;
  return (
    <>
      <Floor x={phone.x} y={phone.y + 240} w={300} o={flow} />
      <Place x={phone.x} y={lerp(phone.y, phone.y + 140, away)} w={240} h={446} scale={pop(frame, fps, 0) * (1 - 0.35 * away)} opacity={1 - 0.85 * away} float={5} frame={frame} z={2}>
        <PhoneScreen frame={frame} mode="console" typed={ramp(frame, 10, 120)} />
      </Place>
      <Box x={CX - 40} y={CY - 20} w={800} h={178} o={pop(frame, fps, 8) * flow} z={1}>
        <EncryptedTunnel frame={frame} flow={flow} />
      </Box>
      <Badge x={CX - 40} y={CY - 170} s={pop(frame, fps, 20, 9) * (1 - 0.3 * away)} size={110}>
        <Padlock open={0} />
      </Badge>
      <Floor x={comp.x} y={comp.y + 210} w={560} />
      <Box x={comp.x} y={comp.y} w={500} h={428} s={pop(frame, fps, 4, 14)} z={2}>
        <Computer frame={frame} glow={0.4 + 0.6 * away}>
          <ConsoleScreen frame={frame} lines={session(L)} typed={ramp(frame, 10, resume + 40)} />
        </Computer>
      </Box>
      {away > 0.5 && <Pulse x={comp.x} y={comp.y - 40} r={240} t={((frame - close) % 40) / 40} color={C.accent} width={4} />}
    </>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useT();
  const s = pop(frame, fps, 0, 12);
  const tag = pop(frame, fps, f(L.t.tagline - L.outroFrom), 12);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{
            position: 'absolute', left: '50%', top: '30%', width: 380 + k * 220, height: 380 + k * 220, borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * Math.sin(frame * 0.05 + k)})`, border: `3px solid ${C.soft}`, opacity: 0.8 - k * 0.22,
          }} />
        ))}
        <Img src={staticFile('terminal-icon.png')} style={{ width: 260, borderRadius: 58, boxShadow: '0 30px 70px rgba(5,54,116,0.28)' }} />
        <div style={{ fontFamily: 'Comfortaa', fontWeight: 700, fontSize: 104, color: C.dark, marginTop: 36 }}>Dotrino Terminal</div>
        <div style={{ fontFamily: 'Quicksand', fontWeight: 700, fontSize: 60, color: C.accent, marginTop: 14, opacity: tag, transform: `translateY(${(1 - tag) * 20}px)` }}>
          {L.tagline}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useT();
  const cur = L.captions.find(([a, b]) => frame >= at(a) && frame < at(b));
  if (!cur || cur[0] >= L.outroFrom) return null;
  const o = interpolate(frame - at(cur[0]), [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 60, display: 'flex', justifyContent: 'center', opacity: o, zIndex: 10 }}>
      <div style={{
        maxWidth: 1480, padding: '18px 36px', borderRadius: 28, background: 'rgba(255,255,255,0.94)',
        boxShadow: '0 8px 30px rgba(5,54,116,0.10)', fontFamily: 'Quicksand', fontWeight: 600, fontSize: 42,
        lineHeight: 1.3, color: C.text, textAlign: 'center',
      }}>{cur[2]}</div>
    </div>
  );
};

const SCENE_COMPONENTS = [SceneAnyDevice, SceneInstall, SceneLinkVault, SceneLinkDevice, SceneOpen, SceneEncrypted];

export const TerminalVideo: React.FC<{ lang: TLang }> = ({ lang }) => (
  <LCtx.Provider value={T[lang]}><TerminalBody /></LCtx.Provider>
);

const TerminalBody: React.FC = () => {
  useFonts();
  const L = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOpacity = interpolate(frame, [INTRO_HOLD + 18, INTRO_HOLD + 42], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scenes = L.scenes.map((to, i) => ({ from: i === 0 ? at(0) - 6 : at(L.scenes[i - 1]), to: at(to) }));
  return (
    <AbsoluteFill>
      <Backdrop />
      {scenes.map((s, i) => {
        const Comp = SCENE_COMPONENTS[i];
        const dur = s.to - s.from + OVERLAP;
        return (
          <Sequence key={i} from={s.from} durationInFrames={dur}>
            <SceneShell dur={dur}>{(fr) => <Comp frame={fr} />}</SceneShell>
          </Sequence>
        );
      })}
      <Sequence from={at(L.outroFrom)}><Outro /></Sequence>
      <Captions />
      {introOpacity > 0 && (
        <AbsoluteFill style={{ background: C.white, opacity: introOpacity, alignItems: 'center', justifyContent: 'center' }}>
          <LogoCard frame={1000} fps={fps} />
        </AbsoluteFill>
      )}
      <Sequence from={AUDIO_START}><Audio src={staticFile(L.audio)} /></Sequence>
    </AbsoluteFill>
  );
};
