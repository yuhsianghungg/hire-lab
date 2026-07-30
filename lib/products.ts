export const productCategories = ["長背帶", "腕繩", "吊飾", "眼鏡掛繩"] as const;

export type ProductCategory = (typeof productCategories)[number];

export type Product = {
  slug: string;
  name: string;
  type: ProductCategory;
  price: number;
  colors: string[];
  colorNames: string[];
  images: string[];
  tagline: string;
  description: string;
  features: string[];
  specifications: { label: string; value: string }[];
};

export const products: Product[] = [
  {
    slug: "fireworks-lanyard",
    name: "煙花",
    type: "長背帶",
    price: 1450,
    colors: ["#D86C94", "#A7ADB2", "#D87943", "#496D58", "#B87982"],
    colorNames: ["繽紛彩", "太空銀", "暖橘", "森林綠", "乾燥玫瑰"],
    images: [
      "/fireworks-colorful.jpg",
      "/fireworks-space-silver.jpg",
      "/fireworks-warm-orange.jpg",
      "/fireworks-forest-green.jpg",
      "/fireworks-dried-rose.jpg",
    ],
    tagline: "像煙花盛開，把每一種色彩編進日常。",
    description: "以多種質感紗線、繩結與蓬鬆球飾層層手工編製，每一段都有獨特的色彩與觸感。可斜背或肩背使用，讓手機掛繩也成為穿搭中最有個性的亮點。",
    features: ["多種紗線與繩結手工混編", "五款配色，每件紋理略有不同", "雙端金屬扣，可搭配手機夾片或小包"],
    specifications: [
      { label: "款式", value: "長背帶，雙端金屬扣" },
      { label: "材質", value: "混合紗線、棉繩、合金五金" },
      { label: "製作方式", value: "全手工編製" },
      { label: "照護方式", value: "建議局部輕柔清潔並自然陰乾，避免勾扯紗線" },
    ],
  },
];

export const formatPrice = (price: number) => `NT$ ${price.toLocaleString("zh-TW")}`;

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);
