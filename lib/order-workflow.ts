export const orderStatuses = ["pending", "making", "shipped", "delivered", "completed", "cancelled"] as const;
export const orderProgressStatuses = ["pending", "making", "shipped", "delivered", "completed"] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "訂單已成立",
  making: "製作中",
  shipped: "運送中",
  delivered: "已抵達",
  completed: "訂單完成",
  cancelled: "已取消",
};

export const nextOrderStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "making",
  making: "shipped",
  shipped: "delivered",
  delivered: "completed",
};

export const nextOrderActionLabels: Partial<Record<OrderStatus, string>> = {
  pending: "開始製作",
  making: "標記為運送中",
  shipped: "標記為已抵達",
  delivered: "完成訂單",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && orderStatuses.includes(value as OrderStatus);
}

export function isAllowedOrderTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return true;
  if (next === "cancelled") return current === "pending" || current === "making";
  return nextOrderStatus[current] === next;
}
