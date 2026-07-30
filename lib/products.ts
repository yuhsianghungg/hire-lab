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
  imageOnlyOptions?: boolean;
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
  {
    slug: "between-lines-lanyard",
    name: "行間",
    type: "長背帶",
    price: 1550,
    colors: ["#C9A5A7", "#A59076", "#8C2346", "#607A91", "#77A99A"],
    colorNames: ["晨霧粉", "燕麥棕", "莓果紅", "暮光藍", "薄荷綠"],
    images: [
      "/between-lines-misty-pink.jpg",
      "/between-lines-oat-brown.jpg",
      "/between-lines-berry-red.jpg",
      "/between-lines-twilight-blue.jpg",
      "/between-lines-mint-green.jpg",
    ],
    tagline: "讓色彩與繩結，在行走之間留下自己的節奏。",
    description: "以連續環形繩結構成帶身主體，再混搭編繩、流蘇紗線與木質細節。豐富的手工層次在肩上自然延伸，讓日常攜帶多一份柔軟而鮮明的個性。",
    features: ["立體環形繩結，呈現鮮明手作層次", "五款配色，各自搭配不同編繩細節", "雙端金屬扣，可搭配手機夾片或小包"],
    specifications: [
      { label: "款式", value: "長背帶，雙端金屬扣" },
      { label: "材質", value: "棉繩、混合紗線、木質配件、合金五金" },
      { label: "製作方式", value: "全手工編製" },
      { label: "照護方式", value: "建議局部輕柔清潔並自然陰乾，避免拉扯繩結與流蘇" },
    ],
  },
  {
    slug: "pet-wrist-strap",
    name: "寵物客製",
    type: "腕繩",
    price: 850,
    colors: ["#E8E2D6", "#D9D0B9", "#4A4A4D", "#F0EDE6", "#5B332C", "#232527"],
    colorNames: ["款式 01", "款式 02", "款式 03", "款式 04", "款式 05", "款式 06"],
    images: [
      "/pet-wrist-bichon.jpg",
      "/pet-wrist-westie.jpg",
      "/pet-wrist-black-white-poodle.jpg",
      "/pet-wrist-white-shiba.jpg",
      "/pet-wrist-chihuahua.jpg",
      "/pet-wrist-black-poodle.jpg",
    ],
    imageOnlyOptions: true,
    tagline: "把毛孩可愛的模樣，輕輕牽在手邊。",
    description: "以柔軟紗線塑造立體寵物臉龐，再結合手工繞線與蓬鬆花紗，製成輕巧好握的腕繩。每款動物都有不同表情與配色，能掛在手機、相機或隨身小包上。",
    features: ["六款立體寵物造型可選", "柔軟腕繩與蓬鬆花紗手工組合", "單端金屬扣，方便搭配手機、相機與小包"],
    specifications: [
      { label: "款式", value: "短版腕繩，單端金屬扣" },
      { label: "材質", value: "混合紗線、棉繩、合金五金" },
      { label: "製作方式", value: "全手工編製與造型" },
      { label: "照護方式", value: "建議局部輕柔清潔並自然陰乾，避免壓扁或拉扯立體造型" },
    ],
  },
];

export const formatPrice = (price: number) => `NT$ ${price.toLocaleString("zh-TW")}`;

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);
