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

const labels: Record<string, string> = { sent: "待你確認訂單", revision_requested: "修改需求已送出", accepted: "已確認／訂單已成立", cancelled: "已取消" };

export default function MemberQuotes({ onOrderCreated, onOpenOrders }: { onOrderCreated: () => void; onOpenOrders: () => void }) {
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
        await load();
        if (action === "accept") onOrderCreated();
      }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setActing(null); }
  };

  return <section className="member-panel member-quotes">
    <div className="member-panel-head"><div><p className="eyebrow">CUSTOM ORDER</p><h2>客製訂單確認</h2></div><span>專屬報價</span></div>
    <ol className="custom-order-overview member-order-overview" aria-label="客製訂單確認流程">
      <li className="complete"><span>1</span><div><b>店家與客戶討論</b><small>需求與規格確認</small></div></li>
      <li className="complete"><span>2</span><div><b>店家建立訂單</b><small>建立專屬內容與價格</small></div></li>
      <li className="current"><span>3</span><div><b>客戶確認訂單</b><small>確認或提出修改需求</small></div></li>
      <li><span>4</span><div><b>訂單建立完成</b><small>確認後進入製作流程</small></div></li>
    </ol>
    {notice && <p className="member-notice quote-notice" role="status">{notice}</p>}
    {loading ? <p>讀取客製訂單中…</p> : quotes.length === 0 ? <p className="member-muted">目前沒有需要確認的客製訂單。</p> : <div className="member-quote-list">{quotes.map((quote) => {
      const expired = quote.expired;
      return <article className="member-quote-card" key={quote.id}>
        <header><div><small>{quote.quote_number} · 第 {quote.revision} 版</small><h3>{quote.title}</h3></div><i className={`quote-status ${expired && quote.status === "sent" ? "expired" : quote.status}`}>{expired && quote.status === "sent" ? "已過期" : labels[quote.status] || quote.status}</i></header>
        {quote.description && <p>{quote.description}</p>}
        <div className="member-quote-items">{quote.items.map((item) => <div key={item.id}><div><b>{item.item_name}</b>{item.specifications && <small>{item.specifications}</small>}</div><span>{item.quantity} × NT$ {item.unit_price.toLocaleString()}</span><strong>NT$ {(item.quantity * item.unit_price).toLocaleString()}</strong></div>)}</div>
        <dl><div><dt>運費</dt><dd>NT$ {quote.shipping_fee.toLocaleString()}</dd></div>{quote.deposit_amount > 0 && <div><dt>預收訂金</dt><dd>NT$ {quote.deposit_amount.toLocaleString()}</dd></div>}<div className="member-quote-total"><dt>報價總額</dt><dd>NT$ {quote.total.toLocaleString()}</dd></div></dl>
        <footer><small>{quote.expires_at ? `確認期限：${new Date(quote.expires_at).toLocaleDateString("zh-TW")}` : "此客製訂單未設定確認期限"}</small>{quote.status === "sent" && !expired && <div className="member-quote-actions"><div><button className="button button-dark" disabled={acting !== null} onClick={() => void act(quote, "accept")}>{acting === `${quote.id}:accept` ? "確認建立中…" : "確認訂單"}</button><button className="quote-decline" disabled={acting !== null} onClick={() => void act(quote, "decline")}>{acting === `${quote.id}:decline` ? "處理中…" : "拒絕這份訂單"}</button></div><label>需要調整？<textarea value={notes[quote.id] || ""} onChange={(event) => setNotes({ ...notes, [quote.id]: event.target.value })} placeholder="請說明希望修改的內容" rows={3} /><button disabled={acting !== null || (notes[quote.id] || "").trim().length < 2} onClick={() => void act(quote, "request_revision")}>{acting === `${quote.id}:request_revision` ? "送出中…" : "提出修改需求"}</button></label></div>}{quote.status === "revision_requested" && quote.revision_note && <p className="quote-revision-note"><b>你提出的修改需求</b>{quote.revision_note}</p>}{quote.status === "accepted" && <button className="quote-order-link" type="button" onClick={onOpenOrders}>查看製作進度 →</button>}</footer>
      </article>;
    })}</div>}
  </section>;
}
