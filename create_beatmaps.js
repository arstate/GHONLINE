import fs from 'fs';
import path from 'path';

const SONGS = [
  "Ghea Indrawari - Teramini (Multitrack)",
  "KARNAMEREKA - Tante Kesepian (Multitrack)",
  "Dewi (Multitrack)",
  "Threesixty - Dewi (Pop Punk Cover) (Multitrack)",
  "DRAGONFORCE - Through the Fire and Flames (Multitrack)",
  "Avenged Sevenfold - Cosmic (Multitrack)",
  "Dewa 19 - Aku Milikmu (Multitrack)"
];
const DIFFS = ["easy", "normal", "hard", "extreme"];

for (const song of SONGS) {
  const dir = path.join(process.cwd(), 'public', 'beatmaps', song);
  fs.mkdirSync(dir, { recursive: true });
  for (const diff of DIFFS) {
    const file = path.join(dir, `guitar_${diff}.json`);
    fs.writeFileSync(file, JSON.stringify({ bpm: 120, speed: 600, beatmap: [] }, null, 2));
  }
}
console.log('Beatmaps created');
