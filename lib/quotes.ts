export const editableQuoteStatuses = ["draft", "sent", "cancelled"] as const;
export const quoteStatuses = ["draft", "sent", "revision_requested", "accepted", "cancelled"] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];

export type ValidQuoteItem = {
  itemName: string;
  specifications: string;
  quantity: number;
  unitPrice: number;
};

export type ValidQuotePayload = {
  email: string;
  title: string;
  description: string;
  shippingFee: number;
  depositAmount: number;
  total: number;
  status: (typeof editableQuoteStatuses)[number];
  expiresAt: string | null;
  items: ValidQuoteItem[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const nonNegativeInteger = (value: unknown) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};

export function validateQuotePayload(value: unknown): { data?: ValidQuotePayload; error?: string } {
  const body = asRecord(value);
  if (!body) return { error: "報價資料格式不正確。" };

  const email = String(body.email || "").trim().toLowerCase();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const status = String(body.status || "draft");
  const shippingFee = nonNegativeInteger(body.shippingFee);
  const depositAmount = nonNegativeInteger(body.depositAmount);

  if (!email || !email.includes("@")) return { error: "請輸入正確的會員 Email。" };
  if (!title) return { error: "請輸入報價名稱。" };
  if (!editableQuoteStatuses.includes(status as (typeof editableQuoteStatuses)[number])) return { error: "報價狀態不正確。" };
  if (shippingFee === null || depositAmount === null) return { error: "運費與訂金必須是零以上的整數。" };
  if (!Array.isArray(body.items) || body.items.length === 0) return { error: "請至少加入一個報價項目。" };
  if (body.items.length > 30) return { error: "單張報價最多 30 個項目。" };

  const items: ValidQuoteItem[] = [];
  for (const rawItem of body.items) {
    const item = asRecord(rawItem);
    if (!item) return { error: "報價項目格式不正確。" };
    const itemName = String(item.itemName || "").trim();
    const specifications = String(item.specifications || "").trim();
    const quantity = nonNegativeInteger(item.quantity);
    const unitPrice = nonNegativeInteger(item.unitPrice);
    if (!itemName || quantity === null || quantity < 1 || unitPrice === null) return { error: "請完整填寫商品、數量與單價。" };
    items.push({ itemName, specifications, quantity, unitPrice });
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + shippingFee;
  if (!Number.isSafeInteger(total)) return { error: "報價金額超出可接受範圍。" };
  if (depositAmount > total) return { error: "訂金不可高於報價總額。" };

  let expiresAt: string | null = null;
  const rawExpiry = String(body.expiresAt || "").trim();
  if (rawExpiry) {
    const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(rawExpiry) ? `${rawExpiry}T23:59:59+08:00` : rawExpiry;
    const expiry = new Date(dateValue);
    if (Number.isNaN(expiry.getTime())) return { error: "報價有效期限格式不正確。" };
    expiresAt = expiry.toISOString();
    if (status === "sent" && expiry.getTime() <= Date.now()) return { error: "已送出的報價需要設定未來的有效期限。" };
  }

  return {
    data: {
      email,
      title,
      description,
      shippingFee,
      depositAmount,
      total,
      status: status as ValidQuotePayload["status"],
      expiresAt,
      items,
    },
  };
}

export function makeQuoteNumber(timestamp: string) {
  return `HLQ-${timestamp.slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
}

export function makeOrderNumber(timestamp: string) {
  return `HL-${timestamp.slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
}
