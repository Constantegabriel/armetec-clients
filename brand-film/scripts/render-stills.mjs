// Renders one representative still per scene for both formats into out/stills.
// Usage: npm run stills
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const timeline = JSON.parse(fs.readFileSync(new URL('../src/config/timeline.json', import.meta.url)));
const fps = timeline.fps;
// a strong frame inside each scene (seconds)
const picks = [4.4, 9.4, 13.5, 16.6, 19.4, 23.9, 27.6, 31.5, 34.6, 38.6, 41.9, 45.5, 49.0, 53.0, 56.4, 58.6, 60.6, 63.0, 67.8];
fs.mkdirSync('out/stills', {recursive: true});
execFileSync('npx', ['remotion', 'bundle', '--out-dir=out/bundle'], {stdio: 'inherit'});
for (const comp of ['ArmeTecFilmVertical', 'ArmeTecFilmHorizontal']) {
  for (const s of picks) {
    const frame = Math.round(s * fps);
    execFileSync('npx', ['remotion', 'still', 'out/bundle', comp, `out/stills/${comp}-${String(frame).padStart(4, '0')}.jpg`, `--frame=${frame}`], {stdio: 'inherit'});
  }
}
