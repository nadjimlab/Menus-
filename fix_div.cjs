const fs = require('fs');
let content = fs.readFileSync('src/components/AdminOrdersModal.tsx', 'utf8');

// Find the stray </div>
content = content.replace(/            <\/div>\n        <\/div>\n\n        \{\/\* Tab 1: LIVE ORDERS \(KDS\) \*\/\}/g, `            </div>\n\n        {/* Tab 1: LIVE ORDERS (KDS) */}`);

fs.writeFileSync('src/components/AdminOrdersModal.tsx', content);
