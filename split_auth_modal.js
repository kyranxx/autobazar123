const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'src/components/AuthModal.tsx');
let content = fs.readFileSync(srcFile, 'utf8');

const outputDir = path.join(__dirname, 'src/components/AuthModal');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Just rename the file for now to avoid compilation conflicts while splitting
fs.renameSync(srcFile, path.join(__dirname, 'src/components/AuthModal.tsx.bak'));

console.log("Renamed AuthModal.tsx to AuthModal.tsx.bak, ready for split (if needed).");
