// Lo único que cambia entre idiomas: la voz, el guion y sus tiempos.
// Los tiempos salen del .srt que escribe edge-tts (script/<lang>.srt), en segundos del audio.
export type Lang = 'es' | 'en';

export type LangConfig = {
  audio: string;
  audioLen: number;
  captions: [number, number, string][];
  // Fin de cada una de las 6 escenas; la escena i va de scenes[i-1] a scenes[i].
  scenes: number[];
  welcomeFrom: number;
  vaultWord: string;
  welcomeWord: string;
  // Escena del cifrado: segundos (desde que empieza) en que aparecen el ojo, su tachado y «ni siquiera Dotrino».
  encrypted: { eye: number; slash: [number, number]; notDotrino: number };
};

export const LANGS: Record<Lang, LangConfig> = {
  es: {
    audio: 'narration-es.mp3',
    audioLen: 40.27,
    captions: [
      [0.1, 6.253, 'Dotrino es un ecosistema de aplicaciones que basa la seguridad en la confianza entre dispositivos.'],
      [6.203, 9.185, 'Las cuentas se crean automáticamente.'],
      [9.185, 16.967, 'La información se distribuye únicamente entre dispositivos de confianza y nunca sale de ellos, a menos que tú lo decidas.'],
      [16.967, 22.431, 'Para empezar, elige el dispositivo en el que más confías: será tu Bóveda.'],
      [22.431, 30.087, 'La Bóveda puede ser tu propio teléfono, tu computadora personal, o puede alojarla Dotrino para que esté siempre disponible.'],
      [30.087, 33.959, 'Toda la información está cifrada de extremo a extremo.'],
      [33.959, 38.471, 'Nadie fuera de tus dispositivos puede verla, ni siquiera Dotrino.'],
    ],
    scenes: [6.22, 9.185, 16.967, 22.431, 30.087, 38.471],
    welcomeFrom: 38.471,
    vaultWord: 'Bóveda',
    welcomeWord: 'Bienvenido.',
    encrypted: { eye: 3.9, slash: [4.6, 5.0], notDotrino: 6.4 },
  },
  en: {
    audio: 'narration-en.mp3',
    audioLen: 33.888,
    captions: [
      [0.1, 5.547, 'Dotrino is an ecosystem of apps that builds security on trust between your devices.'],
      [5.497, 7.971, 'Accounts are created automatically.'],
      [7.971, 14.786, 'Your information is shared only between trusted devices, and it never leaves them unless you decide it should.'],
      [14.786, 19.221, 'To get started, choose the device you trust most: it will be your Vault.'],
      [19.221, 26.247, "Your Vault can be your own phone, your personal computer, or Dotrino can host it so it's always available."],
      [26.247, 28.668, 'Everything is end-to-end encrypted.'],
      [28.668, 32.707, 'No one outside your devices can see it, not even Dotrino.'],
    ],
    scenes: [5.52, 7.971, 14.786, 19.221, 26.247, 32.707],
    welcomeFrom: 32.707,
    vaultWord: 'Vault',
    welcomeWord: 'Welcome.',
    encrypted: { eye: 2.45, slash: [3.0, 3.4], notDotrino: 5.0 },
  },
};
