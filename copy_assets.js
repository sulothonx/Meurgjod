const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'public', 'assets');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const fileMap = {
  'ท้องฟ้าสดใสเหนือทุ่งเขียว.png': 'bg-sky.png',
  'หน้าหลักแอปการเงินคู่โทนพาสเทล.png': 'mockup-ref.png',
  'ChatGPT Image 20 ต.ค. 2569 13_24_54-1.png': 'card-record.png',
  'ChatGPT Image 20 ต.ค. 2569 13_24_56-2.png': 'card-wallet.png',
  'ChatGPT Image 20 ต.ค. 2569 13_24_57-3.png': 'card-health.png',
  'ChatGPT Image 20 ต.ค. 2569 13_24_58-4.png': 'btn-ocr.png',
  'ChatGPT Image 20 ต.ค. 2569 13_24_59-5.png': 'btn-voice.png',
  'ChatGPT Image 20 ต.ค. 2569 13_25_00-6.png': 'btn-summary.png',
  'ChatGPT Image 20 ต.ค. 2569 13_25_01-7.png': 'btn-history.png',
  'ChatGPT Image 20 ต.ค. 2569 13_25_02-8.png': 'btn-budget.png',
  'ChatGPT Image 20 ต.ค. 2569 13_25_04-9.png': 'btn-theme.png'
};

for (const [src, dest] of Object.entries(fileMap)) {
  const srcPath = path.join(__dirname, src);
  const destPath = path.join(targetDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.warn(`File not found: ${src}`);
  }
}
console.log('Asset preparation complete!');
