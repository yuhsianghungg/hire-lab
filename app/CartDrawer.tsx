"use client";

import { useEffect, useRef, useState } from "react";
import { cartEvent, readCart, removeCartItem, replaceCart, updateCartQuantity, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [reminderOptIn, setReminderOptIn] = useState(false);
  const [reminderDue, setReminderDue] = useState(false);
  const reminderOptInRef = useRef(false);

  const refresh = () => setItems(readCart());
  const syncRemote = async (cartItems: CartItem[], optIn = reminderOptInRef.current) => {
    await fetch("/api/member/cart", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cartItems, reminderOptIn: optIn }) });
  };

  useEffect(() => {
    const initialize = async () => {
      const localItems = readCart();
      setItems(localItems);
      const response = await fetch("/api/member/cart");
      if (!response.ok) return;
      const data = await response.json();
      setLoggedIn(true);
      setReminderOptIn(Boolean(data.reminderOptIn));
      reminderOptInRef.current = Boolean(data.reminderOptIn);
      setReminderDue(Boolean(data.reminderDue));
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
      if (comparable(mergedItems) !== comparable((data.items || []) as CartItem[])) await syncRemote(mergedItems, Boolean(data.reminderOptIn));
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
  const changeReminderPreference = (enabled: boolean) => {
    setReminderOptIn(enabled);
    reminderOptInRef.current = enabled;
    void syncRemote(readCart(), enabled);
  };
  const acknowledgeReminder = () => {
    setReminderDue(false);
    void fetch("/api/member/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "acknowledge_reminder" }) });
  };

  return (
    <div className="cart-widget">
      <button className="cart-trigger" type="button" onClick={() => setOpen(true)} aria-label={`我的購物車，共 ${count} 件商品`}>
        <span aria-hidden="true">🛒</span><b>{count}</b>
      </button>
      {reminderDue && <div className="cart-reminder-popover" role="status"><button type="button" aria-label="關閉提醒" onClick={acknowledgeReminder}>×</button><b>購物車還有商品等著你</b><span>你上次挑選的商品尚未完成購買。</span><button type="button" onClick={() => { setOpen(true); acknowledgeReminder(); }}>查看購物車</button></div>}
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
        {items.length > 0 && <footer><div><span>商品小計</span><strong>{formatPrice(total)}</strong></div>{loggedIn ? <label className="cart-reminder-setting"><input type="checkbox" checked={reminderOptIn} onChange={(event) => changeReminderPreference(event.target.checked)} /><span>購物車超過 24 小時未結帳時提醒我</span></label> : <a className="cart-login-hint" href="/login">登入會員以同步購物車並啟用提醒</a>}<button type="button" onClick={() => window.alert("結帳功能將於商城正式上線後開放。")}>前往結帳</button><small>運費與付款方式將於結帳頁計算</small></footer>}
      </aside>
    </div>
  );
}
