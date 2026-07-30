import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/products";
import ProductDetail from "./ProductDetail";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  return product ? { title: `${product.name}｜hire Lab.`, description: product.description } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <main className="store-page product-page">
      <header className="store-header">
        <a className="brand" href="/" aria-label="hire Lab. 首頁"><img className="brand-logo" src="/hire-logo.png" alt="hire Lab. 標誌" /> hire Lab.</a>
        <nav><a href="/">首頁</a><a href="/products">全部商品</a><a href="/member">會員中心</a></nav>
      </header>
      <nav className="breadcrumbs" aria-label="麵包屑"><a href="/">首頁</a><span>/</span><a href="/products">全部商品</a><span>/</span><b>{product.name}</b></nav>
      <ProductDetail product={product} />
      <section className="detail-back"><p className="eyebrow">KEEP EXPLORING</p><h2>繼續尋找你的日常配件</h2><a className="button button-dark" href="/products">返回全部商品</a></section>
      <footer className="store-footer"><a className="brand" href="/"><img className="brand-logo" src="/hire-logo.png" alt="hire Lab. 標誌" /> hire Lab.</a><p>Handmade cords & worldly objects.</p><a href="/products">全部商品 ↑</a></footer>
    </main>
  );
}
