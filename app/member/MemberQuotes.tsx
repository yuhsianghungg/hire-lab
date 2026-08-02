"use client";

import { useEffect, useState } from "react";

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

const labels: Record<string, string> = { sent: "待你確認", revision_requested: "已提出修改", accepted: "已接受／訂單已建立", cancelled: "已取消" };

export default function MemberQuotes({ onOpenOrders }: { onOpenOrders: () => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/member/quotes");
      const data = await response.json().catch(() => ({})) as { error?: string; quotes?: Quote[] };
      if (!response.ok) setNotice(data.error || "目前無法讀取報價。");
      else setQuotes(data.quotes || []);
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/member/quotes")
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) as { error?: string; quotes?: Quote[] } }))
      .then(({ response, data }) => {
        if (!active) return;
        if (!response.ok) setNotice(data.error || "目前無法讀取報價。");
        else setQuotes(data.quotes || []);
      })
      .catch(() => { if (active) setNotice("目前無法連線，請稍後再試。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const act = async (quote: Quote, action: "accept" | "request_revision") => {
    if (action === "accept" && !window.confirm(`確定接受 ${quote.quote_number}，並以 NT$ ${quote.total.toLocaleString()} 建立正式訂單？`)) return;
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
        setNotice(action === "accept" ? `報價已接受，正式訂單 ${data.orderNumber || ""} 已建立。` : "修改需求已送出，我們更新報價後會再通知你確認。");
        await load();
      }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setActing(null); }
  };

  return <section className="member-panel member-quotes">
    <div className="member-panel-head"><div><p className="eyebrow">PRIVATE QUOTES</p><h2>專屬報價</h2></div><span>客製服務</span></div>
    {notice && <p className="member-notice quote-notice" role="status">{notice}</p>}
    {loading ? <p>讀取報價中…</p> : quotes.length === 0 ? <p className="member-muted">目前沒有需要確認的專屬報價。</p> : <div className="member-quote-list">{quotes.map((quote) => {
      const expired = quote.expired;
      return <article className="member-quote-card" key={quote.id}>
        <header><div><small>{quote.quote_number} · 第 {quote.revision} 版</small><h3>{quote.title}</h3></div><i className={`quote-status ${expired && quote.status === "sent" ? "expired" : quote.status}`}>{expired && quote.status === "sent" ? "已過期" : labels[quote.status] || quote.status}</i></header>
        {quote.description && <p>{quote.description}</p>}
        <div className="member-quote-items">{quote.items.map((item) => <div key={item.id}><div><b>{item.item_name}</b>{item.specifications && <small>{item.specifications}</small>}</div><span>{item.quantity} × NT$ {item.unit_price.toLocaleString()}</span><strong>NT$ {(item.quantity * item.unit_price).toLocaleString()}</strong></div>)}</div>
        <dl><div><dt>運費</dt><dd>NT$ {quote.shipping_fee.toLocaleString()}</dd></div>{quote.deposit_amount > 0 && <div><dt>預收訂金</dt><dd>NT$ {quote.deposit_amount.toLocaleString()}</dd></div>}<div className="member-quote-total"><dt>報價總額</dt><dd>NT$ {quote.total.toLocaleString()}</dd></div></dl>
        <footer><small>{quote.expires_at ? `有效期限：${new Date(quote.expires_at).toLocaleDateString("zh-TW")}` : "此報價未設定有效期限"}</small>{quote.status === "sent" && !expired && <div className="member-quote-actions"><button className="button button-dark" disabled={acting !== null} onClick={() => void act(quote, "accept")}>{acting === `${quote.id}:accept` ? "建立訂單中…" : "接受報價並建立訂單"}</button><label>需要調整？<textarea value={notes[quote.id] || ""} onChange={(event) => setNotes({ ...notes, [quote.id]: event.target.value })} placeholder="請說明希望修改的內容" rows={3} /><button disabled={acting !== null || (notes[quote.id] || "").trim().length < 2} onClick={() => void act(quote, "request_revision")}>{acting === `${quote.id}:request_revision` ? "送出中…" : "提出修改需求"}</button></label></div>}{quote.status === "revision_requested" && quote.revision_note && <p className="quote-revision-note"><b>你提出的修改需求</b>{quote.revision_note}</p>}{quote.status === "accepted" && <button className="quote-order-link" type="button" onClick={onOpenOrders}>查看正式訂單 →</button>}</footer>
      </article>;
    })}</div>}
  </section>;
}
