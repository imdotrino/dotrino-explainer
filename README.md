# dotrino-explainer

Fuentes del video «¿Qué es Dotrino?» / «What is Dotrino?» que se muestra en la portada de
[dotrino.com](https://dotrino.com/). Está hecho con [Remotion](https://www.remotion.dev/)
(React → MP4), y cada fotograma sale de este código.

- Publicado en YouTube: [español](https://youtu.be/oDXJWGe3aKI) · [English](https://youtu.be/LAMbrqlUe8M)
- Los MP4 renderizados no van en el repo. Están adjuntos a cada
  [release](https://github.com/imdotrino/dotrino-explainer/releases/latest) y la versión va en
  el nombre del archivo.

## Estructura

| Ruta | Qué es |
|---|---|
| `src/Explainer.tsx` | Las 7 escenas, los subtítulos y el logo inicial con fundido |
| `src/Illustrations.tsx` | Las ilustraciones SVG: aparatos, bóveda, candado, nube de Dotrino… |
| `src/lang.ts` | Lo que cambia por idioma: audio, guion, tiempos y palabras en pantalla |
| `src/Root.tsx` | Composiciones `ExplainerEs` y `ExplainerEn` (1920×1080, 30 fps) |
| `public/` | Logo (`bird.png`), fuentes del tema (Quicksand, Comfortaa) y las narraciones |
| `script/` | Guion aprobado (`es.txt`, `en.txt`) y los tiempos de la voz (`.srt`) |

## Uso

```bash
npm install
npm run studio        # vista previa interactiva
npm run render        # out/dotrino-es.mp4 y out/dotrino-en.mp4
```

## Cambiar el guion o la voz

La narración se genera con [edge-tts](https://github.com/rany2/edge-tts). Voces: `es-EC-AndreaNeural` y
`en-US-AvaNeural`.

```bash
edge-tts --voice es-EC-AndreaNeural --rate=-5% -f script/es.txt \
  --write-media public/narration-es.mp3 --write-subtitles script/es.srt
```

Después pasa los tiempos del `.srt` a `src/lang.ts`: `captions`, el fin de cada escena en
`scenes`, `welcomeFrom` y `audioLen`. Las escenas siguen a la voz, así que no hace falta tocar nada más.

## Licencia

MIT
