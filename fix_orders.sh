#!/bin/bash
sed -i -e '/const staffToken = typeof window !== '\''undefined'\'' ? localStorage.getItem(STAFF_SESSION_STORAGE_KEY) : null;/d' src/context/OrderContext.tsx
sed -i -e '/if (staffToken && SUPABASE_URL) {/,/    } else if (supabase) {/d' src/context/OrderContext.tsx
sed -i -e 's/    } else if (supabase) {/    } else {/' src/context/OrderContext.tsx
