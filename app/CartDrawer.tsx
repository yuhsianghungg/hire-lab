"use client";

import { useEffect, useState } from "react";
import { cartEvent, readCart, removeCartItem, replaceCart, updateCartQuantity, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  const refresh = () => setItems(readCart());
  const syncRemote = async (cartItems: CartItem[]) => {
    await fetch("/api/member/cart", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cartItems }) });
  };

  useEffect(() => {
    const initialize = async () => {
      const localItems = readCart();
      setItems(localItems);
      const response = await fetch("/api/member/cart");
      if (!response.ok) return;
      const data = await response.json();
      const merged = new Map<string, CartItem>();
      for (const item of (data.items || []) as CartItem[]) merged.set(item.key, item);
      for (const item of localItems) {
        const remote = merged.get(item.key);
        merged.set(item.key, remote ? { ...item, quantity: Math.max(item.quantity, remote.quantity) } : item);
      }
      const mergedItems = [...merged.values()];
      replaceCart(mergedItems, false);
      setItems(mergedItems);
      const comparable = (value: CartItem[]) => JSON.stringify(value.map(({ key, slug, colorName, quantity }) => ({ key, slug, colorName, quantity })).sort((a, b) => a.key.localeCompare(b.key)));
      if (comparable(mergedItems) !== comparable((data.items || []) as CartItem[])) await syncRemote(mergedItems);
    };
    const handleCartChange = () => {
      const current = readCart();
      setItems(current);
      void syncRemote(current);
    };
    void initialize();
    window.addEventListener(cartEvent, handleCartChange);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(cartEvent, handleCartChange);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const changeQuantity = (key: string, quantity: number) => {
    updateCartQuantity(key, quantity);
    refresh();
  };
  const remove = (key: string) => {
    removeCartItem(key);
    refresh();
  };
  return (
    <div className="cart-widget">
      <button className="cart-trigger" type="button" onClick={() => setOpen(true)} aria-label={`我的購物車，共 ${count} 件商品`}>
        <span aria-hidden="true">🛒</span><b>{count}</b>
      </button>
      {open && <div className="cart-overlay" onClick={() => setOpen(false)} />}
      <aside className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open} aria-label="我的購物車">
        <header><div><p className="eyebrow">MY CART</p><h2>我的購物車</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="關閉購物車">×</button></header>
        <div className="cart-items">
          {items.length === 0 ? <div className="cart-empty"><span>🛒</span><h3>購物車還是空的</h3><p>挑一件喜歡的日常配件，<br />讓它陪你一起出門。</p><a href="/products">前往全部商品</a></div> : items.map((item) => (
            <article className="cart-item" key={item.key}>
              <a className="cart-item-visual" href={`/products/${item.slug}`}><i style={{ background: item.color }} /></a>
              <div>
                <a href={`/products/${item.slug}`}><b>{item.name}</b></a>
                <span>{item.colorName}</span>
                <strong>{formatPrice(item.price)}</strong>
                <div className="cart-item-actions">
                  <div><button type="button" onClick={() => changeQuantity(item.key, item.quantity - 1)}>−</button><span>{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.key, item.quantity + 1)}>＋</button></div>
                  <button type="button" onClick={() => remove(item.key)}>移除</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {items.length > 0 && <footer><div><span>商品小計</span><strong>{formatPrice(total)}</strong></div><button type="button" onClick={() => window.alert("結帳功能將於商城正式上線後開放。")}>前往結帳</button><small>運費與付款方式將於結帳頁計算</small></footer>}
      </aside>
    </div>
  );
}
