"use client";

import { useCallback, useEffect, useState } from "react";
import type { Shipment } from "@core/shipments/domain/shipment";
import type { NotificationHistory } from "@core/shipments/ports/notification-history";
import type { NotificationPermissionState, NotificationService } from "@core/shipments/ports/notification-service";
import type { DueReminder } from "@core/shipments/use-cases/evaluate-due-reminders";

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function useShipmentReminders({ shipments, dueReminders, notificationService, history }: {
  shipments: readonly Shipment[];
  dueReminders: readonly DueReminder[];
  notificationService: NotificationService;
  history: NotificationHistory;
}) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(() => notificationService.getPermission());

  useEffect(() => {
    const permission = notificationService.getPermission();
    setNotificationPermission(permission);
    if (permission !== "granted") return;
    const byId = new Map(shipments.filter((shipment) => shipment.id !== null).map((shipment) => [shipment.id, shipment]));
    const date = localDateKey(new Date());
    for (const reminder of dueReminders) {
      const shipment = byId.get(reminder.shipmentId);
      if (!shipment) continue;
      const key = `${reminder.shipmentId}:${reminder.reason}:${date}`;
      if (history.has(key)) continue;
      if (notificationService.notify(shipment, reminder.reason)) history.mark(key);
    }
  }, [dueReminders, history, notificationService, shipments]);

  const enableNotifications = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(notificationService.getPermission());
    return granted;
  }, [notificationService]);

  return { notificationPermission, enableNotifications };
}
