const fs = require('fs');
const path = require('path');

const libPath = path.join(__dirname, '..', 'src', 'lib', 'unifiedExerciseLibrary.ts');
let code = fs.readFileSync(libPath, 'utf8');

code = code.replace(/category:\s*"MOBILITY"/g, 'category: "STATIC_STRETCH"');
fs.writeFileSync(libPath, code, 'utf8');
console.log('Fixed category enums in unifiedExerciseLibrary.ts successfully!');
