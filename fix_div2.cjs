const fs = require('fs');
let content = fs.readFileSync('src/components/AdminOrdersModal.tsx', 'utf8');

content = content.replace(/            <\/div>\n        \{\/\* Tab 1: LIVE ORDERS \(KDS\) \*\/\}/g, `            </div>\n          </div>\n        </div>\n        {/* Tab 1: LIVE ORDERS (KDS) */}`);

fs.writeFileSync('src/components/AdminOrdersModal.tsx', content);
