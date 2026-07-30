import { formatPrice, products } from "@/lib/products";

export const metadata = {
  title: "全部商品｜hire Lab.",
  description: "瀏覽 hire Lab. 手工掛繩、相機配件與日常小物。",
};

export default function ProductsPage() {
  return (
    <main className="store-page">
      <header className="store-header">
        <a className="brand" href="/" aria-label="hire Lab. 首頁"><img className="brand-logo" src="/hire-logo.png" alt="hire Lab. 標誌" /> hire Lab.</a>
        <nav><a href="/">首頁</a><a className="active" href="/products">全部商品</a><a href="/member">會員中心</a></nav>
      </header>

      <section className="catalog-hero">
        <div><p className="eyebrow">ALL OBJECTS</p><h1>全部商品</h1></div>
        <p>從日常掛繩到隨身小物，<br />每一件都由我們慢慢配色、親手完成。</p>
      </section>

      <div className="catalog-toolbar">
        <span>全部商品</span>
        <small>{products.length} 件商品</small>
      </div>

      <section className="catalog-grid" aria-label="商品列表">
        {products.map((product, index) => (
          <article className="catalog-card" key={product.slug}>
            <a className="catalog-visual" href={`/products/${product.slug}`} aria-label={`查看 ${product.name}`}>
              <span className="catalog-number">0{index + 1}</span>
              <i style={{ background: `linear-gradient(135deg, ${product.colors[0]} 0 33%, ${product.colors[1]} 33% 66%, ${product.colors[2]} 66%)` }} />
              <b>VIEW</b>
            </a>
            <div className="catalog-info">
              <div><p>{product.type}</p><h2><a href={`/products/${product.slug}`}>{product.name}</a></h2></div>
              <strong>{formatPrice(product.price)}</strong>
            </div>
            <p className="catalog-tagline">{product.tagline}</p>
            <a className="catalog-link" href={`/products/${product.slug}`}>查看商品 <span>→</span></a>
          </article>
        ))}
      </section>

      <footer className="store-footer"><a className="brand" href="/"><img className="brand-logo" src="/hire-logo.png" alt="hire Lab. 標誌" /> hire Lab.</a><p>Handmade cords & worldly objects.</p><a href="/">返回首頁 ↑</a></footer>
    </main>
  );
}
