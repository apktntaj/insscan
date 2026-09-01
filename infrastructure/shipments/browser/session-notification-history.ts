import type { NotificationHistory } from "@core/shipments/ports/notification-history";

export const sessionNotificationHistory: NotificationHistory = {
  has(key) {
    try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
  },
  mark(key) {
    try { sessionStorage.setItem(key, "1"); } catch { /* In-app reminders remain available. */ }
  },
};
