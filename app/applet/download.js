const https = require('https');
const fs = require('fs');

https.get('https://ia601406.us.archive.org/2/items/1_20260429_20260429_1230/1.png', (res) => {
  const chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync('1.png', buffer);
    console.log("Downloaded successfully, size: " + buffer.length);
  });
});
