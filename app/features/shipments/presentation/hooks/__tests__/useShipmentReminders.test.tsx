/** @jest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { createShipment } from "@core/shipments/domain/shipment";
import { createInMemoryNotificationHistory } from "@core/shipments/ports/notification-history";
import type { NotificationPermissionState, NotificationService } from "@core/shipments/ports/notification-service";
import { useShipmentReminders } from "../useShipmentReminders";

const shipment = createShipment({ id: 1, shipmentNumber: "CONAUG26001", blNumber: "BL-1", shipperName: "SHIPPER", consigneeName: "CONSIGNEE", eta: "2026-08-29" });
const due = [{ shipmentId: 1, reason: "eta_tomorrow" as const, targetDate: "2026-08-29", daysOverdue: 0 }];

function service(initial: NotificationPermissionState) {
  let permission = initial;
  const adapter: NotificationService = {
    getPermission: () => permission,
    requestPermission: jest.fn(async () => { permission = "granted"; return true; }),
    notify: jest.fn(() => true),
  };
  return adapter;
}

describe("useShipmentReminders", () => {
  test("does not prompt or notify when denied", () => {
    const adapter = service("denied");
    renderHook(() => useShipmentReminders({ shipments: [shipment], dueReminders: due, notificationService: adapter, history: createInMemoryNotificationHistory() }));
    expect(adapter.requestPermission).not.toHaveBeenCalled();
    expect(adapter.notify).not.toHaveBeenCalled();
  });

  test("notifies once after explicit permission and deduplicates", async () => {
    const adapter = service("default");
    const history = createInMemoryNotificationHistory();
    const hook = renderHook(() => useShipmentReminders({ shipments: [shipment], dueReminders: due, notificationService: adapter, history }));
    await act(async () => { await hook.result.current.enableNotifications(); });
    await waitFor(() => expect(adapter.notify).toHaveBeenCalledTimes(1));
    hook.rerender();
    expect(adapter.notify).toHaveBeenCalledTimes(1);
  });
});
