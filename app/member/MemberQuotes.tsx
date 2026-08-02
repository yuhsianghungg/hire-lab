"use client";

import { useCallback, useEffect, useState } from "react";
import OrderProgress from "@/app/components/OrderProgress";
import QuoteConfirmationProgress from "@/app/components/QuoteConfirmationProgress";
import { orderStatusLabels, type OrderStatus } from "@/lib/order-workflow";

type QuoteItem = { id: string; item_name: string; specifications: string | null; quantity: number; unit_price: number };
type Quote = {
  id: string;
  quote_number: string;
  title: string;
  description: string | null;
  shipping_fee: number;
  deposit_amount: number;
  total: number;
  status: string;
  revision: number;
  expires_at: string | null;
  revision_note: string | null;
  order_id: string | null;
  updated_at: string;
  expired: boolean;
  items: QuoteItem[];
};

type MemberOrder = {
  id: string;
  order_number: string;
  item_summary: string;
  total: number;
  status: OrderStatus;
  tracking_number: string | null;
  quote_id: string | null;
  created_at: string;
  history: { status: string; created_at: string }[];
};

const labels: Record<string, string> = { sent: "待你確認訂單", revision_requested: "修改需求已送出", accepted: "已確認／訂單已成立", cancelled: "已取消" };

function MemberOrderProgress({ order }: { order: MemberOrder }) {
  return <section className="member-order-card member-quote-order" aria-label={`訂單 ${order.order_number} 製作進度`}>
    <header><div><small>ORDER PROGRESS</small><b>{order.order_number}</b><span>{order.item_summary}</span><small>建立日期：{new Date(order.created_at).toLocaleDateString("zh-TW")}</small></div><div><strong>NT$ {order.total.toLocaleString()}</strong><i className={`status ${order.status}`}>{orderStatusLabels[order.status]}</i></div></header>
    <OrderProgress status={order.status} history={order.history} />
    {order.tracking_number && <p className="member-tracking"><span>物流單號</span><b>{order.tracking_number}</b></p>}
  </section>;
}

export default function MemberQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<MemberOrder[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [quoteResponse, orderResponse] = await Promise.all([
        fetch("/api/member/quotes", { cache: "no-store" }),
        fetch("/api/member/orders", { cache: "no-store" }),
      ]);
      const quoteData = await quoteResponse.json().catch(() => ({})) as { error?: string; quotes?: Quote[] };
      const orderData = await orderResponse.json().catch(() => ({})) as { error?: string; orders?: MemberOrder[] };
      if (!quoteResponse.ok || !orderResponse.ok) throw new Error(quoteData.error || orderData.error || "目前無法同步報價與訂單。");
      setQuotes(quoteData.quotes || []);
      setOrders(orderData.orders || []);
      setLastSyncedAt(new Date());
    } catch (error) { setNotice(error instanceof Error ? error.message : "目前無法連線，請稍後再試。"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const refresh = () => { if (document.visibilityState === "visible") void load(true); };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);

  const act = async (quote: Quote, action: "accept" | "request_revision" | "decline") => {
    if (action === "accept" && !window.confirm(`請再次確認 ${quote.quote_number} 的內容與總額 NT$ ${quote.total.toLocaleString()}。確認後將建立正式訂單，是否繼續？`)) return;
    if (action === "decline" && !window.confirm(`確定拒絕 ${quote.quote_number}？拒絕後如需重新報價，請再與我們聯絡。`)) return;
    setActing(`${quote.id}:${action}`);
    setNotice("");
    try {
      const response = await fetch("/api/member/quotes", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: quote.id, action, note: notes[quote.id] || "" }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; orderNumber?: string };
      if (!response.ok) setNotice(data.error || "目前無法更新報價。");
      else {
        setNotice(action === "accept" ? `訂單已確認，正式訂單 ${data.orderNumber || ""} 建立完成。店家開始製作後，你可在下方查看即時進度。` : action === "decline" ? "這份客製訂單已拒絕；如有新的需求，歡迎再與我們聯絡。" : "修改需求已送出，店家更新內容後會再通知你確認。");
        await load(true);
      }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setActing(null); }
  };

  const linkedOrderIds = new Set(quotes.flatMap((quote) => quote.order_id ? [quote.order_id] : []));
  const unlinkedOrders = orders.filter((order) => !linkedOrderIds.has(order.id));

  return <section className="member-panel member-quotes">
    <div className="member-panel-head"><div><p className="eyebrow">CUSTOM ORDER</p><h2>客製訂單確認</h2></div><div className="member-sync-controls"><small>{lastSyncedAt ? `同步於 ${lastSyncedAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "尚未同步"}</small><button type="button" disabled={loading || refreshing} onClick={() => void load(true)}>{refreshing ? "同步中…" : "重新同步"}</button></div></div>
    {notice && <p className="member-notice quote-notice" role="status">{notice}</p>}
    {loading ? <p>同步客製訂單中…</p> : quotes.length === 0 && unlinkedOrders.length === 0 ? <p className="member-muted">目前沒有客製訂單。</p> : <div className="member-quote-list">{quotes.map((quote) => {
      const expired = quote.expired;
      const order = orders.find((candidate) => candidate.id === quote.order_id);
      return <article className="member-quote-card" key={quote.id}>
        <header><div><small>{quote.quote_number} · 第 {quote.revision} 版</small><h3>{quote.title}</h3></div><i className={`quote-status ${expired && quote.status === "sent" ? "expired" : quote.status}`}>{expired && quote.status === "sent" ? "已過期" : labels[quote.status] || quote.status}</i></header>
        <QuoteConfirmationProgress status={quote.status} hasOrder={Boolean(order)} />
        {quote.description && <p>{quote.description}</p>}
        <div className="member-quote-items">{quote.items.map((item) => <div key={item.id}><div><b>{item.item_name}</b>{item.specifications && <small>{item.specifications}</small>}</div><span>{item.quantity} × NT$ {item.unit_price.toLocaleString()}</span><strong>NT$ {(item.quantity * item.unit_price).toLocaleString()}</strong></div>)}</div>
        <dl><div><dt>運費</dt><dd>NT$ {quote.shipping_fee.toLocaleString()}</dd></div>{quote.deposit_amount > 0 && <div><dt>預收訂金</dt><dd>NT$ {quote.deposit_amount.toLocaleString()}</dd></div>}<div className="member-quote-total"><dt>報價總額</dt><dd>NT$ {quote.total.toLocaleString()}</dd></div></dl>
        {(quote.status === "sent" && !expired || quote.status === "revision_requested" && quote.revision_note) && <footer>{quote.status === "sent" && !expired && <div className="member-quote-actions"><div><button className="button button-dark" disabled={acting !== null} onClick={() => void act(quote, "accept")}>{acting === `${quote.id}:accept` ? "確認建立中…" : "確認訂單"}</button><button className="quote-decline" disabled={acting !== null} onClick={() => void act(quote, "decline")}>{acting === `${quote.id}:decline` ? "處理中…" : "拒絕這份訂單"}</button></div><label>需要調整？<textarea value={notes[quote.id] || ""} onChange={(event) => setNotes({ ...notes, [quote.id]: event.target.value })} placeholder="請說明希望修改的內容" rows={3} /><button disabled={acting !== null || (notes[quote.id] || "").trim().length < 2} onClick={() => void act(quote, "request_revision")}>{acting === `${quote.id}:request_revision` ? "送出中…" : "提出修改需求"}</button></label></div>}{quote.status === "revision_requested" && quote.revision_note && <p className="quote-revision-note"><b>你提出的修改需求</b>{quote.revision_note}</p>}</footer>}
        {quote.status === "accepted" && (order ? <MemberOrderProgress order={order} /> : <p className="member-muted">正式訂單正在同步，請按「重新同步」更新。</p>)}
      </article>;
    })}{unlinkedOrders.map((order) => <article className="member-quote-card member-standalone-order" key={order.id}><MemberOrderProgress order={order} /></article>)}</div>}
  </section>;
}
