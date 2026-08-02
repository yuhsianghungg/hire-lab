"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminQuotes, { type AdminOrderRecord } from "./AdminQuotes";
import { orderStatusLabels, type OrderStatus } from "@/lib/order-workflow";

type Order = AdminOrderRecord;
type Member = { id: string; name: string; email: string; role: "member" | "admin"; status: "active" | "suspended"; created_at: string };
type TrackedCart = {
  id: string;
  name: string;
  email: string | null;
  status: string;
  updated_at: string;
  total: number;
  items: { name: string; color_name: string; quantity: number; price: number }[];
};

const roles = [["member", "一般會員"], ["admin", "系統管理員"]];

export default function AdminOrders({ embedded = false }: { embedded?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [carts, setCarts] = useState<TrackedCart[]>([]);
  const [section, setSection] = useState<"orders" | "carts" | "members">("orders");
  const [notice, setNotice] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [lastOrdersSyncedAt, setLastOrdersSyncedAt] = useState<Date | null>(null);

  const loadOrders = useCallback(async (quiet = false) => {
    if (quiet) setRefreshingOrders(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { error?: string; orders?: Order[] };
      if (!response.ok) setNotice(data.error || "目前無法同步訂單。");
      else { setOrders(data.orders || []); setLastOrdersSyncedAt(new Date()); }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setRefreshingOrders(false); }
  }, []);
  const loadCarts = useCallback(() => fetch("/api/admin/carts", { cache: "no-store" }).then((response) => response.json()).then((data) => data.error ? setNotice(data.error) : setCarts(data.carts || [])).catch(() => setNotice("目前無法同步購物車。")), []);
  const loadMembers = useCallback(() => fetch("/api/admin/members", { cache: "no-store" }).then((response) => response.json()).then((data) => data.error ? setNotice(data.error) : setMembers(data.members || [])).catch(() => setNotice("目前無法同步會員資料。")), []);

  useEffect(() => {
    const initial = window.setTimeout(() => { void loadOrders(); void loadCarts(); void loadMembers(); }, 0);
    const refresh = () => { if (document.visibilityState === "visible") void loadOrders(true); };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [loadCarts, loadMembers, loadOrders]);

  const updateOrder = async (order: Order, status: OrderStatus = order.status) => {
    if (status === "cancelled" && !window.confirm(`確定取消訂單 ${order.order_number}？`)) return;
    setUpdatingOrder(order.id);
    try {
      const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: order.id, status, trackingNumber: order.tracking_number }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      setNotice(response.ok ? status === order.status ? "物流資料已儲存。" : `訂單已更新為「${orderStatusLabels[status]}」。` : data.error || "目前無法更新訂單。");
      if (response.ok) { await loadOrders(true); await loadCarts(); }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setUpdatingOrder(null); }
  };
  const updateMember = async (member: Member) => {
    const response = await fetch("/api/admin/members", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: member.id, role: member.role, status: member.status }) });
    const data = await response.json();
    setNotice(response.ok ? "會員權限已更新。" : data.error);
    if (response.ok) loadMembers();
  };
  const title = section === "orders" ? "訂單管理" : section === "carts" ? "未結帳購物車" : "會員權限";
  const navigation = <>
    <button className={section === "orders" ? "active" : ""} onClick={() => { setSection("orders"); void loadOrders(true); }}>訂單管理</button>
    <button className={section === "carts" ? "active" : ""} onClick={() => setSection("carts")}>購物車追蹤</button>
    <button className={section === "members" ? "active" : ""} onClick={() => setSection("members")}>會員權限</button>
  </>;

  const workspace = <>
      <section>
        <p className="eyebrow">STUDIO ADMIN · ADMIN</p>
        <h1>{title}</h1>
        {notice && <p className="member-notice">{notice}</p>}

        {section === "orders" && <AdminQuotes
          orders={orders}
          updatingOrder={updatingOrder}
          refreshingOrders={refreshingOrders}
          lastOrdersSyncedAt={lastOrdersSyncedAt}
          onRefreshOrders={() => loadOrders(true)}
          onUpdateOrder={updateOrder}
          onTrackingChange={(id, trackingNumber) => setOrders((current) => current.map((order) => order.id === id ? { ...order, tracking_number: trackingNumber } : order))}
        />}

        {section === "carts" && <article className="admin-order-table admin-cart-table">
          <div className="admin-cart-summary"><div><b>{carts.length}</b><span>有商品的會員購物車</span></div><div><b>{carts.reduce((sum, cart) => sum + cart.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}</b><span>購物車商品總數</span></div><div><b>NT$ {carts.reduce((sum, cart) => sum + cart.total, 0).toLocaleString()}</b><span>購物車商品總額</span></div></div>
          <h2>會員購物車內容</h2>
          {carts.length === 0 ? <p>目前沒有可追蹤的會員購物車。</p> : carts.map((cart) => <div className="admin-cart-row" key={cart.id}>
            <div className="admin-cart-owner"><b>{cart.name}</b><span>{cart.email || "聯絡資訊僅限 Admin"}</span><small>更新：{new Date(cart.updated_at).toLocaleString("zh-TW")}</small></div>
            <div className="admin-cart-products">{cart.items.map((item) => <span key={`${item.name}-${item.color_name}`}>{item.name}／{item.color_name} × {item.quantity}</span>)}</div>
            <strong>NT$ {cart.total.toLocaleString()}</strong>
            <i className={`admin-cart-status ${cart.status}`}>{cart.status === "converted" ? "已轉換訂單" : "購物車中"}</i>
          </div>)}
        </article>}

        {section === "members" && <article className="admin-order-table">
          <h2>會員與角色</h2>
          {members.map((member) => <div className="admin-member-row" key={member.id}><div><b>{member.name}</b><span>{member.email}</span></div><select value={member.role} onChange={(event) => setMembers(members.map((item) => item.id === member.id ? { ...item, role: event.target.value as Member["role"] } : item))}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={member.status} onChange={(event) => setMembers(members.map((item) => item.id === member.id ? { ...item, status: event.target.value as Member["status"] } : item))}><option value="active">啟用</option><option value="suspended">停權</option></select><button onClick={() => updateMember(member)}>儲存權限</button></div>)}
        </article>}
      </section>
  </>;

  if (embedded) return <div className="admin-orders admin-orders-embedded"><nav className="admin-embedded-nav" aria-label="管理後台功能">{navigation}</nav>{workspace}</div>;

  return <main className="admin-orders"><header><Link className="brand" href="/"><Image className="brand-logo" src="/hire-logo.png" alt="hire Lab." width={40} height={40} />hire Lab.</Link><div>{navigation}<a href="/member">會員中心</a></div></header>{workspace}</main>;
}
