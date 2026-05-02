const fs = require('fs');
const path = require('path');

const folders = [
  "KARNAMEREKA - Tante Kesepian (Multitrack)",
  "Ghea Indrawari - Teramini (Multitrack)",
  "DRAGONFORCE - Through the Fire and Flames (Multitrack)",
  "Dewi (Multitrack)",
  "Dewa 19 - Aku Milikmu (Multitrack)",
  "Avenged Sevenfold - Cosmic (Multitrack)"
];

const difficulties = [
  { name: 'easy', speed: 600 },
  { name: 'normal', speed: 600 },
  { name: 'hard', speed: 800 },
  { name: 'extreme', speed: 900 }
];

folders.forEach(folder => {
  const dir = path.join(__dirname, 'public', 'beatmaps', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  difficulties.forEach(diff => {
    const filePath = path.join(dir, `drum_${diff.name}.json`);
    const content = {
      track: "placeholder",
      instrument: "drum",
      difficulty: diff.name,
      bpm: 120,
      speed: diff.speed,
      total_notes: 0,
      hold_notes: 0,
      tap_notes: 0,
      beatmap: []
    };
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Created ${filePath}`);
  });
});
