const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let token = "";
for (let i = 0; i < 8; i++) token += chars[Math.floor(Math.random() * chars.length)];
const now = new Date();
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const ym = `${nextMonth.getFullYear()}${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
console.log(`PSR-${ym}-${token}`);