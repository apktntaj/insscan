/** Output port used to suppress duplicate notifications. */
export interface NotificationHistory {
  has(key: string): boolean;
  mark(key: string): void;
}

/** Framework-neutral fallback useful for tests and non-browser applications. */
export function createInMemoryNotificationHistory(): NotificationHistory {
  const notified = new Set<string>();
  return {
    has: (key) => notified.has(key),
    mark: (key) => {
      notified.add(key);
    },
  };
}
