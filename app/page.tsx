"use client";

import { useEffect, useState } from "react";
import CartDrawer from "./CartDrawer";
import { addCartItem } from "@/lib/cart";
import { formatPrice, products } from "@/lib/products";

export default function Home() {
  const [activeProduct, setActiveProduct] = useState(0);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [member, setMember] = useState<{ name: string } | null>(null);

  useEffect(() => { fetch("/api/member/profile").then(async (r) => r.ok ? setMember((await r.json()).member) : null).catch(() => null); }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const addProduct = (product: (typeof products)[number]) => {
    addCartItem({ slug: product.slug, name: product.name, price: product.price, color: product.colors[0], colorName: product.colorNames[0], quantity: 1 });
    showNotice(`${product.name} 已加入購物車`);
  };

  return (
    <main>
      <header className="nav-wrap">
        <a className="brand" href="#top" aria-label="hire Lab. 首頁"><img className="brand-logo" src="/hire-logo.png" alt="hire Lab. 標誌" /> hire Lab.</a>
        <button className="menu-button" aria-label="開啟選單" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "×" : "☰"}</button>
        <div className="nav-actions"><nav className={menuOpen ? "nav open" : "nav"}>
          <a href="/products">全部商品</a><a href="#custom">客製掛繩</a><a href="#proxy">海外代購</a><a href="#story">品牌故事</a>
          {member ? <a className="nav-cta" href="/member">{member.name} 的帳戶</a> : <a className="nav-cta" href="/login">會員登入</a>}
        </nav><CartDrawer /></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>把日常生活編進生活裡<br /><em className="travel-finds">旅行選品</em></h1>
          <p className="hero-text">一條為你而編的掛繩，一件從遠方而來的選物。<br />hire Lab. 讓每次出門，都多一點自己的樣子。</p>
          <div className="hero-actions"><a className="button button-dark" href="#custom">開始客製</a><a className="text-link" href="#shop">逛逛選物 <span>→</span></a></div>
        </div>
        <div className="hero-art" aria-label="hire Lab. 手作掛繩封面照片">
          <div className="sun"></div><div className="arch arch-back"></div><div className="arch arch-front"></div>
          <div className="rope rope-a"></div><div className="rope rope-b"></div><div className="rope rope-c"></div>
          <div className="clip clip-a"></div><div className="clip clip-b"></div>
          <p className="art-note">hire Lab.</p>
        </div>
      </section>

      <section className="marquee" aria-label="品牌特色"><span>客製化手作</span><i>✦</i><span>來自世界的日常選物</span><i>✦</i><span>每一件都值得被好好帶著</span></section>

      <section className="intro section">
        <p className="eyebrow">OUR LITTLE STUDIO</p>
        <div><h2>為日常，留下<br />一點溫柔的<span>個性。</span></h2><p>從手工編織的繩結，到跨越海洋而來的好物，我們相信生活的品味，藏在那些小小卻很貼近自己的選擇裡。</p></div>
      </section>

      <section className="section shop" id="shop">
        <div className="section-head"><div><p className="eyebrow">CURATED FOR YOU</p><h2>本週選物</h2></div><a className="text-link" href="/products">查看全部 <span>→</span></a></div>
        <div className="products">
          {products.map((product, index) => <article className={activeProduct === index ? "product active" : "product"} key={product.name}>
            <a className="product-image" href={`/products/${product.slug}`} onMouseEnter={() => setActiveProduct(index)} aria-label={`查看 ${product.name}`}>
              <div className="product-rope" style={{ background: `linear-gradient(135deg, ${product.colors[0]} 0 33%, ${product.colors[1]} 33% 66%, ${product.colors[2]} 66%)` }}></div>
              <span className="product-number">0{index + 1}</span>
            </a>
            <div className="product-info"><div><p>{product.type}</p><h3><a href={`/products/${product.slug}`}>{product.name}</a></h3></div><strong>{formatPrice(product.price)}</strong></div>
            <button className="add-button" onClick={() => addProduct(product)}>加入購物車</button>
          </article>)}
        </div>
      </section>

      <section className="services section">
        <article className="service custom" id="custom"><div className="service-visual"><div className="tiny-rope"></div><span>01</span></div><p className="eyebrow">MAKE IT YOURS</p><h2>把你的想法<br />編成專屬掛繩</h2><p>選擇繩材、色彩、長度與吊飾，從一個小小的靈感，開始做出只有你才有的配件。</p><button className="button button-dark" onClick={() => showNotice("已開啟客製化掛繩表單入口（原型）")}>設計我的掛繩</button></article>
        <article className="service proxy" id="proxy"><div className="passport"><span>CV</span><b>TRAVEL<br />OBJECTS</b><i>✦</i></div><p className="eyebrow">SHOP BEYOND BORDERS</p><h2>想找的那一件，<br />我們幫你帶回來</h2><p>貼上商品連結、告訴我們你的需求。日本、韓國與美國的日常選物，讓喜歡不再有距離。</p><button className="button button-light" onClick={() => showNotice("已開啟海外代購委託入口（原型）")}>我要委託代購</button></article>
      </section>

      <section className="story section" id="story"><div className="story-image"><div className="story-sun"></div><div className="story-line line-one"></div><div className="story-line line-two"></div><div className="story-line line-three"></div></div><div className="story-copy"><p className="eyebrow">A TINY JOURNEY</p><h2>關於<br />hire Lab.</h2><p>我們相信，每一次選擇都能成為生活的練習。從手作的溫度到世界的靈感，hire Lab. 陪你蒐集每一段值得記得的日常。</p><a className="text-link" href="#top">認識我們 <span>→</span></a></div></section>

      <section className="newsletter"><p className="eyebrow">A NOTE FROM US</p><h2>讓新的靈感，<br />寄到你的信箱。</h2><div className="email-form"><input aria-label="電子郵件" placeholder="your@email.com" type="email"/><button onClick={() => showNotice("謝謝訂閱！我們會寄來最新的手作消息。")} aria-label="訂閱">→</button></div></section>
      <footer><a className="brand" href="#top"><img className="brand-logo" src="/hire-logo.png" alt="hire Lab. 標誌" /> hire Lab.</a><p>Handmade cords & worldly objects.</p><div className="social-links"><a href="https://www.instagram.com/hireee__/" target="_blank" rel="noreferrer" aria-label="Instagram"><img src="/icon-instagram.svg" alt="" /></a><a href="https://line.me/ti/g2/xtWfrPpSaWsik7s0P4Tp1-nQCUC5nC1jVEOL3A?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" target="_blank" rel="noreferrer" aria-label="LINE"><img src="/icon-line.svg" alt="" /></a></div><small>© 2026 hire Lab. Prototype website.</small></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
