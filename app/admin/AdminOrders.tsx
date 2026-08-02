"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminQuotes from "./AdminQuotes";

type Order = { id: string; order_number: string; name: string; email: string; item_summary: string; total: number; status: string; tracking_number?: string };
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

const statuses = [["pending", "待確認"], ["making", "製作中"], ["shipped", "已出貨"], ["delivered", "已完成"], ["cancelled", "已取消"]];
const roles = [["member", "一般會員"], ["admin", "系統管理員"]];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [carts, setCarts] = useState<TrackedCart[]>([]);
  const [section, setSection] = useState<"quotes" | "orders" | "carts" | "members">("quotes");
  const [notice, setNotice] = useState("");

  const loadOrders = () => fetch("/api/admin/orders").then((response) => response.json()).then((data) => data.error ? setNotice(data.error) : setOrders(data.orders || []));
  const loadCarts = () => fetch("/api/admin/carts").then((response) => response.json()).then((data) => data.error ? setNotice(data.error) : setCarts(data.carts || []));
  const loadMembers = () => fetch("/api/admin/members").then((response) => response.json()).then((data) => data.error ? setNotice(data.error) : setMembers(data.members || []));

  useEffect(() => { loadOrders(); loadCarts(); loadMembers(); }, []);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const data = await response.json();
    setNotice(response.ok ? "訂單已建立。" : data.error);
    if (response.ok) { formElement.reset(); loadOrders(); loadCarts(); }
  };
  const updateOrder = async (order: Order) => {
    const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: order.id, status: order.status, trackingNumber: order.tracking_number }) });
    const data = await response.json();
    setNotice(response.ok ? "訂單已更新。" : data.error);
    if (response.ok) { loadOrders(); loadCarts(); }
  };
  const updateMember = async (member: Member) => {
    const response = await fetch("/api/admin/members", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: member.id, role: member.role, status: member.status }) });
    const data = await response.json();
    setNotice(response.ok ? "會員權限已更新。" : data.error);
    if (response.ok) loadMembers();
  };
  const title = section === "quotes" ? "專屬報價" : section === "orders" ? "訂單管理" : section === "carts" ? "未結帳購物車" : "會員權限";

  return (
    <main className="admin-orders">
      <header>
        <Link className="brand" href="/"><Image className="brand-logo" src="/hire-logo.png" alt="hire Lab." width={40} height={40} />hire Lab.</Link>
        <div>
          <button className={section === "quotes" ? "active" : ""} onClick={() => setSection("quotes")}>專屬報價</button>
          <button className={section === "orders" ? "active" : ""} onClick={() => setSection("orders")}>訂單管理</button>
          <button className={section === "carts" ? "active" : ""} onClick={() => setSection("carts")}>購物車追蹤</button>
          <button className={section === "members" ? "active" : ""} onClick={() => setSection("members")}>會員權限</button>
          <a href="/member">會員中心</a>
        </div>
      </header>
      <section>
        <p className="eyebrow">STUDIO ADMIN · ADMIN</p>
        <h1>{title}</h1>
        {notice && <p className="member-notice">{notice}</p>}

        {section === "quotes" && <AdminQuotes />}

        {section === "orders" && <>
          <p className="admin-orders-lead">建立訂單並更新製作、出貨與物流狀態。</p>
          <article className="admin-order-create">
            <h2>建立訂單</h2>
            <form onSubmit={create}>
              <input name="email" type="email" placeholder="會員 Email" required />
              <input name="itemSummary" placeholder="商品或服務內容" required />
              <input name="total" type="number" min="0" placeholder="訂單金額" required />
              <select name="status">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <input name="trackingNumber" placeholder="物流單號（選填）" />
              <button className="button button-dark">建立訂單</button>
            </form>
          </article>
          <article className="admin-order-table">
            <h2>全部訂單</h2>
            {orders.length === 0 ? <p>目前尚未建立訂單。</p> : orders.map((order) => <div className="admin-order-row" key={order.id}><div><b>{order.order_number}</b><span>{order.name} · {order.email}</span><small>{order.item_summary} · NT$ {order.total.toLocaleString()}</small></div><select value={order.status} onChange={(event) => setOrders(orders.map((item) => item.id === order.id ? { ...item, status: event.target.value } : item))}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input value={order.tracking_number || ""} placeholder="物流單號" onChange={(event) => setOrders(orders.map((item) => item.id === order.id ? { ...item, tracking_number: event.target.value } : item))} /><button onClick={() => updateOrder(order)}>儲存</button></div>)}
          </article>
        </>}

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
    </main>
  );
}
