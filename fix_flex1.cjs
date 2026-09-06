const fs = require('fs');
let content = fs.readFileSync('src/components/CaissePOS.tsx', 'utf8');

content = content.replace(
  '<div className="flex-1 overflow-y-auto p-3 grid',
  '<div className="flex-1 min-h-0 overflow-y-auto p-3 grid'
);
content = content.replace(
  '<div className="flex-1 overflow-y-auto p-4 space-y-3">',
  '<div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">'
);
content = content.replace(
  '<div className="flex-1 overflow-y-auto p-4 space-y-4">',
  '<div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">'
);

fs.writeFileSync('src/components/CaissePOS.tsx', content);
