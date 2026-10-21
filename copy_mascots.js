const fs = require('fs');
const path = require('path');

const nongJodSource = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\762f25c7-e9ca-41a0-92d6-290c22bfc1ed\\nong_jod_mascot_1792480775321.jpg';
const coupleSource = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\762f25c7-e9ca-41a0-92d6-290c22bfc1ed\\cute_couple_avatar_1792480796712.jpg';

const targetDir = path.join(__dirname, 'public', 'assets');
fs.copyFileSync(nongJodSource, path.join(targetDir, 'nong-jod.png'));
fs.copyFileSync(coupleSource, path.join(targetDir, 'couple-avatar.png'));

console.log('Saved nong-jod.png and couple-avatar.png to public/assets');
