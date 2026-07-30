"use client";

import { useState } from "react";
import { addCartItem } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/products";

export default function ProductPurchase({ product }: { product: Product }) {
  const [color, setColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");

  const addToCart = () => {
    addCartItem({ slug: product.slug, name: product.name, price: product.price, color: product.colors[color], colorName: product.colorNames[color], quantity });
    setNotice(`${product.name}（${product.colorNames[color]}）× ${quantity} 已加入購物車`);
    window.setTimeout(() => setNotice(""), 2800);
  };

  return (
    <>
      <section className="product-detail">
        <div className="detail-gallery">
          <div className="detail-main-visual">
            <span>HANDMADE / 01</span>
            <i style={{ background: `linear-gradient(135deg, ${product.colors[color]} 0 36%, ${product.colors[(color + 1) % product.colors.length]} 36% 68%, ${product.colors[(color + 2) % product.colors.length]} 68%)` }} />
            <b>hire Lab.</b>
          </div>
          <div className="detail-swatches" aria-label="商品配色預覽">
            {product.colors.map((swatch, index) => <button key={swatch} className={color === index ? "active" : ""} style={{ background: swatch }} onClick={() => setColor(index)} aria-label={`選擇${product.colorNames[index]}`} />)}
          </div>
        </div>

        <div className="detail-copy">
          <p className="eyebrow">{product.type.toUpperCase()}</p>
          <h1>{product.name}</h1>
          <strong className="detail-price">{formatPrice(product.price)}</strong>
          <p className="detail-tagline">{product.tagline}</p>
          <p className="detail-description">{product.description}</p>

          <div className="detail-option">
            <div><span>選擇顏色</span><b>{product.colorNames[color]}</b></div>
            <div className="color-options">{product.colors.map((swatch, index) => <button key={swatch} className={color === index ? "active" : ""} onClick={() => setColor(index)}><i style={{ background: swatch }} /><span>{product.colorNames[index]}</span></button>)}</div>
          </div>

          <div className="detail-buy">
            <div className="quantity-control" aria-label="商品數量"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="減少數量">−</button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="增加數量">＋</button></div>
            <button className="detail-add" onClick={addToCart}>加入購物車</button>
          </div>
          <p className="detail-note">此為商品展示與購物車介面，付款功能將於商城正式上線後開放。</p>
        </div>
      </section>

      <section className="product-story">
        <article><p className="eyebrow">WHY YOU'LL LOVE IT</p><h2>喜歡它的理由</h2><ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></article>
        <article><p className="eyebrow">DETAILS & CARE</p><h2>商品規格</h2><dl>{product.specifications.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></article>
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </>
  );
}
