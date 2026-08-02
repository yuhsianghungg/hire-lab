"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type QuoteItem = {
  id?: string;
  item_name?: string;
  specifications?: string | null;
  quantity: number;
  unit_price?: number;
  itemName?: string;
  unitPrice?: number;
};

type Quote = {
  id: string;
  quote_number: string;
  name: string;
  email: string;
  title: string;
  description: string | null;
  shipping_fee: number;
  deposit_amount: number;
  total: number;
  status: string;
  revision: number;
  expires_at: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  revision_note: string | null;
  order_id: string | null;
  updated_at: string;
  items: QuoteItem[];
};

type FormItem = { itemName: string; specifications: string; quantity: number; unitPrice: number };
type FormState = {
  email: string;
  title: string;
  description: string;
  shippingFee: number;
  depositAmount: number;
  status: "draft" | "sent" | "cancelled";
  expiresAt: string;
  items: FormItem[];
};

const emptyItem = (): FormItem => ({ itemName: "", specifications: "", quantity: 1, unitPrice: 0 });
const emptyForm = (): FormState => ({ email: "", title: "", description: "", shippingFee: 0, depositAmount: 0, status: "draft", expiresAt: "", items: [emptyItem()] });
const labels: Record<string, string> = { draft: "店家編輯中", sent: "待客戶確認", revision_requested: "客戶要求修改", accepted: "客戶已確認／訂單成立", cancelled: "已取消" };

async function responseData(response: Response) {
  return response.json().catch(() => ({})) as Promise<{ error?: string; quotes?: Quote[] }>;
}

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const total = useMemo(() => form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0) + Number(form.shippingFee || 0), [form.items, form.shippingFee]);

  const load = async () => {
    try {
      const response = await fetch("/api/admin/quotes");
      const data = await responseData(response);
      if (!response.ok) setNotice(data.error || "目前無法讀取報價單。");
      else setQuotes(data.quotes || []);
    } catch { setNotice("目前無法連線，請稍後再試。"); }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/quotes")
      .then(async (response) => ({ response, data: await responseData(response) }))
      .then(({ response, data }) => {
        if (!active) return;
        if (!response.ok) setNotice(data.error || "目前無法讀取報價單。");
        else setQuotes(data.quotes || []);
      })
      .catch(() => { if (active) setNotice("目前無法連線，請稍後再試。"); });
    return () => { active = false; };
  }, []);

  const setItem = (index: number, patch: Partial<FormItem>) => setForm((current) => ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
  }));

  const reset = () => { setForm(emptyForm()); setEditingId(null); };

  const edit = (quote: Quote) => {
    setEditingId(quote.id);
    setForm({
      email: quote.email,
      title: quote.title,
      description: quote.description || "",
      shippingFee: quote.shipping_fee,
      depositAmount: quote.deposit_amount,
      status: quote.status === "cancelled" ? "cancelled" : quote.status === "draft" ? "draft" : "sent",
      expiresAt: quote.expires_at ? quote.expires_at.slice(0, 10) : "",
      items: quote.items.map((item) => ({ itemName: item.item_name || "", specifications: item.specifications || "", quantity: item.quantity, unitPrice: item.unit_price || 0 })),
    });
    setNotice("");
    document.getElementById("quote-editor")?.scrollIntoView({ behavior: "smooth" });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/quotes", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, id: editingId }),
      });
      const data = await responseData(response);
      if (!response.ok) setNotice(data.error || "目前無法儲存報價單。");
      else {
        setNotice(editingId ? "客製訂單內容已更新，版本已遞增。" : form.status === "sent" ? "客製訂單已建立並送至會員中心等待確認。" : "客製訂單草稿已建立。");
        reset();
        await load();
      }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
    finally { setSaving(false); }
  };

  const remove = async (quote: Quote) => {
    if (!window.confirm(`確定刪除草稿 ${quote.quote_number}？`)) return;
    try {
      const response = await fetch("/api/admin/quotes", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: quote.id }) });
      const data = await responseData(response);
      setNotice(response.ok ? "草稿已刪除。" : data.error || "無法刪除草稿。");
      if (response.ok) { if (editingId === quote.id) reset(); await load(); }
    } catch { setNotice("目前無法連線，請稍後再試。"); }
  };

  return <div className="quote-admin">
    <p className="admin-orders-lead">先完成需求討論，再由店家建立專屬報價／客製訂單；客戶確認後，系統才會鎖定內容並建立正式訂單。</p>
    <ol className="custom-order-overview" aria-label="客製訂單建立流程">
      <li className="complete"><span>1</span><div><b>店家與客戶討論</b><small>確認款式、規格與交期</small></div></li>
      <li className="current"><span>2</span><div><b>店家建立訂單</b><small>建立內容與專屬報價</small></div></li>
      <li><span>3</span><div><b>客戶確認訂單</b><small>確認或提出修改需求</small></div></li>
      <li><span>4</span><div><b>訂單建立完成</b><small>鎖定內容並進入製作</small></div></li>
    </ol>
    {notice && <p className="member-notice quote-notice" role="status">{notice}</p>}
    <article className="admin-order-create quote-editor" id="quote-editor">
      <div className="quote-editor-head"><div><p className="eyebrow">CUSTOM ORDER</p><h2>{editingId ? "編輯客製訂單" : "建立客製訂單"}</h2></div>{editingId && <button type="button" onClick={reset}>取消編輯</button>}</div>
      <form onSubmit={submit}>
        <label>會員 Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label>客製訂單名稱<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例：王小姐客製長背帶" required /></label>
        <label>有效期限<input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
        <label className="quote-wide">整體說明<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="記錄材質、配色、交期與討論重點" rows={3} /></label>
        <div className="quote-items quote-wide">
          <div className="quote-items-head"><b>報價項目</b><button type="button" onClick={() => setForm({ ...form, items: [...form.items, emptyItem()] })}>＋ 新增項目</button></div>
          {form.items.map((item, index) => <div className="quote-item-edit" key={index}>
            <input value={item.itemName} onChange={(event) => setItem(index, { itemName: event.target.value })} placeholder="商品／工項名稱" required />
            <input value={item.specifications} onChange={(event) => setItem(index, { specifications: event.target.value })} placeholder="規格與客製內容" />
            <label>數量<input type="number" min="1" value={item.quantity} onChange={(event) => setItem(index, { quantity: Number(event.target.value) })} required /></label>
            <label>單價<input type="number" min="0" value={item.unitPrice} onChange={(event) => setItem(index, { unitPrice: Number(event.target.value) })} required /></label>
            <button type="button" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) })}>移除</button>
          </div>)}
        </div>
        <label>運費<input type="number" min="0" value={form.shippingFee} onChange={(event) => setForm({ ...form, shippingFee: Number(event.target.value) })} /></label>
        <label>訂金<input type="number" min="0" max={total} value={form.depositAmount} onChange={(event) => setForm({ ...form, depositAmount: Number(event.target.value) })} /></label>
        <label>訂單確認狀態<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FormState["status"] })}><option value="draft">儲存草稿</option><option value="sent">送出等待客戶確認</option><option value="cancelled">取消客製訂單</option></select></label>
        <div className="quote-total quote-wide"><span>報價總額（系統計算）</span><strong>NT$ {total.toLocaleString()}</strong></div>
        <button className="button button-dark" disabled={saving}>{saving ? "儲存中…" : editingId ? "儲存新版內容" : form.status === "sent" ? "建立並送出確認" : "建立草稿"}</button>
      </form>
    </article>
    <article className="admin-order-table quote-list">
      <h2>全部客製訂單</h2>
      {quotes.length === 0 ? <p>目前尚未建立客製訂單。</p> : quotes.map((quote) => <section className="quote-admin-card" key={quote.id}>
        <div className="quote-admin-summary"><div><b>{quote.quote_number}</b><h3>{quote.title}</h3><span>{quote.name} · {quote.email}</span></div><div><i className={`quote-status ${quote.status}`}>{labels[quote.status] || quote.status}</i><strong>NT$ {quote.total.toLocaleString()}</strong><small>第 {quote.revision} 版</small></div></div>
        <div className="quote-admin-items">{quote.items.map((item) => <span key={item.id}>{item.item_name} × {item.quantity}／NT$ {((item.unit_price || 0) * item.quantity).toLocaleString()}{item.specifications ? ` · ${item.specifications}` : ""}</span>)}</div>
        {quote.revision_note && <p className="quote-revision-note"><b>會員修改需求</b>{quote.revision_note}</p>}
        <footer><small>{quote.expires_at ? `有效至 ${new Date(quote.expires_at).toLocaleDateString("zh-TW")}` : "未設定有效期限"}</small><div>{quote.status !== "accepted" && <button type="button" onClick={() => edit(quote)}>{quote.status === "revision_requested" ? "修改並重新送出" : "編輯"}</button>}{quote.status === "draft" && <button type="button" className="danger" onClick={() => void remove(quote)}>刪除草稿</button>}</div></footer>
      </section>)}
    </article>
  </div>;
}
