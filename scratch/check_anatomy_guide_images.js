const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'ai', 'anatomy-guide', 'route.ts'), 'utf8');
const regex = /image:\s*['"](\/anatomy\/[^'"]+)['"]/g;
let match;
const missing = [];
let total = 0;

while ((match = regex.exec(content)) !== null) {
  total++;
  const imgPath = match[1];
  const fullDiskPath = path.join(__dirname, '..', 'public', imgPath.replace(/^\//, ''));
  if (!fs.existsSync(fullDiskPath)) {
    missing.push(imgPath);
  }
}

console.log('Total referenced:', total);
console.log('Missing images on disk:', missing);
