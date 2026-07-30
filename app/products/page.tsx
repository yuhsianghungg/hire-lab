import ProductCatalog from "./ProductCatalog";

export const metadata = {
  title: "全部商品｜hire Lab.",
  description: "瀏覽 hire Lab. 長背帶、腕繩、吊飾與眼鏡掛繩。",
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

      <ProductCatalog />

      <footer className="store-footer"><a className="brand" href="/"><img className="brand-logo" src="/hire-logo.png" alt="hire Lab. 標誌" /> hire Lab.</a><p>Handmade cords & worldly objects.</p><a href="/">返回首頁 ↑</a></footer>
    </main>
  );
}
