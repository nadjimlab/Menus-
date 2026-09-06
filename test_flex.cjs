const fs = require('fs');
let content = fs.readFileSync('src/components/CaissePOS.tsx', 'utf8');

content = content.replace(
  '<div className="flex-1 overflow-y-auto p-3 space-y-2">',
  '<div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">'
);

fs.writeFileSync('src/components/CaissePOS.tsx', content);
