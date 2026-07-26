"use client";

import { useState } from "react";

const orders = [
  { id: "CV-260726-018", customer: "林小姐", item: "Sora 手機掛繩 × 1", amount: "NT$ 680", status: "待確認", tone: "pending" },
  { id: "CV-260726-017", customer: "陳先生", item: "客製掛繩委託", amount: "NT$ 1,280", status: "製作中", tone: "making" },
  { id: "CV-260725-016", customer: "Yuki", item: "Nami 相機手腕繩 × 2", amount: "NT$ 1,760", status: "已出貨", tone: "shipped" },
  { id: "CV-260725-015", customer: "王小姐", item: "海外代購委託", amount: "NT$ 3,450", status: "待報價", tone: "quote" },
];

export default function AdminPage() {
  const [activeNav, setActiveNav] = useState("總覽");
  const [notice, setNotice] = useState("");

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/"><span>HL</span><b>hire Lab.</b></a>
        <p className="admin-kicker">STUDIO ADMIN</p>
        <nav className="admin-nav" aria-label="後台選單">
          {["總覽", "訂單管理", "商品管理", "客製委託", "代購委託", "客戶名單"].map((item) => (
            <button key={item} className={activeNav === item ? "active" : ""} onClick={() => { setActiveNav(item); item !== "總覽" && showNotice(`${item} 模組即將開放`); }}>
              {item === "總覽" ? "◉" : "○"}<span>{item}</span>
            </button>
          ))}
        </nav>
        <div className="admin-side-bottom"><a href="/">↗ 查看商店</a><button onClick={() => showNotice("已安全登出（示範）")}>登出</button></div>
      </aside>

      <section className="admin-content">
        <header className="admin-header"><div><p className="eyebrow">SATURDAY, JULY 26</p><h1>早安，Sean。</h1></div><div className="admin-avatar" aria-label="Sean 的帳號">S</div></header>

        <section className="admin-hero-card"><div><p className="eyebrow">TODAY AT A GLANCE</p><h2>讓每一筆喜歡，<br /><em>好好被帶著前進。</em></h2><p>今天有 3 筆訂單與 2 個新委託需要你的留意。</p><button onClick={() => showNotice("已前往待處理訂單（示範）")}>查看待處理項目 <span>→</span></button></div><div className="admin-hero-art"><i></i><i></i><i></i><b>✦</b></div></section>

        <section className="admin-stats" aria-label="營運摘要">
          <article><p>本月營收</p><strong>NT$ 48,620</strong><small className="up">↑ 12.4% <span>較上月</span></small></article>
          <article><p>待處理訂單</p><strong>08</strong><small>其中 3 筆需確認</small></article>
          <article><p>客製化委託</p><strong>14</strong><small>5 件製作中</small></article>
          <article><p>代購進行中</p><strong>06</strong><small>2 件待報價</small></article>
        </section>

        <section className="admin-section-head"><div><p className="eyebrow">RECENT ORDERS</p><h2>最近訂單</h2></div><button className="admin-link" onClick={() => showNotice("訂單管理模組即將開放")}>查看全部 <span>→</span></button></section>
        <section className="orders-card"><div className="orders-row orders-label"><span>訂單編號</span><span>客戶</span><span>品項</span><span>金額</span><span>狀態</span></div>{orders.map((order) => <button className="orders-row order" key={order.id} onClick={() => showNotice(`開啟 ${order.id}（示範）`)}><span className="order-id">{order.id}</span><span>{order.customer}</span><span>{order.item}</span><strong>{order.amount}</strong><span><i className={`status ${order.tone}`}>{order.status}</i></span></button>)}</section>
        {notice && <div className="admin-toast" role="status">{notice}</div>}
      </section>
    </main>
  );
}
