const fs = require('fs');
let content = fs.readFileSync('src/components/CaissePOS.tsx', 'utf8');

content = content.replace(
  'max-h-[52dvh] overflow-y-auto overscroll-contain md:max-h-none md:overflow-visible',
  'max-h-[52dvh] overflow-y-auto overscroll-contain md:max-h-[40dvh]'
);

fs.writeFileSync('src/components/CaissePOS.tsx', content);
