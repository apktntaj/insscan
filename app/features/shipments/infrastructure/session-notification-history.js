/** Session-scoped browser implementation of the core notification-history port. */
export const sessionNotificationHistory = {
  has(key) {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  },

  mark(key) {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage may be unavailable; notification delivery must still continue.
    }
  },
};
