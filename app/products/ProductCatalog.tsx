"use client";

import { useState } from "react";
import {
  formatPrice,
  productCategories,
  products,
  type ProductCategory,
} from "@/lib/products";

type CategoryFilter = "全部商品" | ProductCategory;

export default function ProductCatalog() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("全部商品");
  const filteredProducts =
    activeCategory === "全部商品"
      ? products
      : products.filter((product) => product.type === activeCategory);

  return (
    <>
      <div className="catalog-toolbar">
        <div className="category-filters" aria-label="商品分類">
          {(["全部商品", ...productCategories] as CategoryFilter[]).map((category) => (
            <button
              aria-pressed={activeCategory === category}
              className={activeCategory === category ? "active" : ""}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <small>{filteredProducts.length} 件商品</small>
      </div>

      {filteredProducts.length > 0 ? (
        <section className="catalog-grid" aria-label={`${activeCategory}商品列表`}>
          {filteredProducts.map((product) => {
            const productNumber = products.findIndex((item) => item.slug === product.slug) + 1;

            return (
              <article className={`catalog-card catalog-card-${productNumber}`} key={product.slug}>
                <a className="catalog-visual" href={`/products/${product.slug}`} aria-label={`查看 ${product.name}`}>
                  <span className="catalog-number">0{productNumber}</span>
                  <img src={product.images[0]} alt={`${product.name}－${product.colorNames[0]}`} />
                  <b>VIEW</b>
                </a>
                <div className="catalog-info">
                  <div><p>{product.type}</p><h2><a href={`/products/${product.slug}`}>{product.name}</a></h2></div>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
                <p className="catalog-tagline">{product.tagline}</p>
                <a className="catalog-link" href={`/products/${product.slug}`}>查看商品 <span>→</span></a>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="catalog-empty" aria-live="polite">
          <p className="eyebrow">COMING SOON</p>
          <h2>{activeCategory}</h2>
          <p>此分類目前尚未上架商品，歡迎先看看其他分類。</p>
          <button className="button button-dark" onClick={() => setActiveCategory("全部商品")} type="button">
            查看全部商品
          </button>
        </section>
      )}
    </>
  );
}
