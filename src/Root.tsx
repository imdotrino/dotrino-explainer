import { Composition } from 'remotion';
import { Explainer, totalFrames, FPS } from './Explainer';
import { TerminalVideo, terminalFrames } from './TerminalVideo';

export const Root = () => (
  <>
    <Composition id="ExplainerEs" component={Explainer} defaultProps={{ lang: 'es' as const }}
      durationInFrames={totalFrames('es')} fps={FPS} width={1920} height={1080} />
    <Composition id="ExplainerEn" component={Explainer} defaultProps={{ lang: 'en' as const }}
      durationInFrames={totalFrames('en')} fps={FPS} width={1920} height={1080} />
    <Composition id="TerminalEs" component={TerminalVideo} defaultProps={{ lang: 'es' as const }}
      durationInFrames={terminalFrames('es')} fps={FPS} width={1920} height={1080} />
    <Composition id="TerminalEn" component={TerminalVideo} defaultProps={{ lang: 'en' as const }}
      durationInFrames={terminalFrames('en')} fps={FPS} width={1920} height={1080} />
  </>
);
