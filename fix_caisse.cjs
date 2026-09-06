const fs = require('fs');
let content = fs.readFileSync('src/components/CaissePOS.tsx', 'utf8');

// Ensure min-h-0 is on the ticket items list
content = content.replace(
  '<div className="flex-1 overflow-y-auto p-3 space-y-2">',
  '<div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">'
);

// Fix the bottom bar to never overflow and not have weird scrolling on desktop
content = content.replace(
  'p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-[#141416] shrink-0 space-y-3 max-h-[52dvh] overflow-y-auto overscroll-contain md:max-h-none md:overflow-visible',
  'p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-[#141416] shrink-0 space-y-3 max-h-[60vh] overflow-y-auto overscroll-contain'
);

fs.writeFileSync('src/components/CaissePOS.tsx', content);
