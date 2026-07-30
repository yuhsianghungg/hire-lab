export type CartItem = {
  key: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  colorName: string;
  quantity: number;
};

const storageKey = "hire-lab-cart";
export const cartEvent = "hire-lab-cart-updated";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(cartEvent));
}

export function addCartItem(item: Omit<CartItem, "key">) {
  const key = `${item.slug}:${item.colorName}`;
  const items = readCart();
  const existing = items.find((current) => current.key === key);
  if (existing) existing.quantity += item.quantity;
  else items.push({ ...item, key });
  saveCart(items);
}

export function updateCartQuantity(key: string, quantity: number) {
  const items = readCart()
    .map((item) => item.key === key ? { ...item, quantity } : item)
    .filter((item) => item.quantity > 0);
  saveCart(items);
}

export function removeCartItem(key: string) {
  saveCart(readCart().filter((item) => item.key !== key));
}
