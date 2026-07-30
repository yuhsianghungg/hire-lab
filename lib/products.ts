export const productCategories = ["長背帶", "腕繩", "吊飾", "眼鏡掛繩"] as const;

export type ProductCategory = (typeof productCategories)[number];

export type Product = {
  slug: string;
  name: string;
  type: ProductCategory;
  price: number;
  colors: string[];
  colorNames: string[];
  tagline: string;
  description: string;
  features: string[];
  specifications: { label: string; value: string }[];
};

export const products: Product[] = [
  {
    slug: "sora-phone-lanyard",
    name: "Sora 手機掛繩",
    type: "長背帶",
    price: 680,
    colors: ["#E9A98D", "#D76E60", "#F1D8B3"],
    colorNames: ["朝霞粉", "陶土橘", "燕麥米"],
    tagline: "把雙手空出來，把喜歡的顏色帶著走。",
    description: "以柔韌繩材手工編製，適合日常通勤、旅行與散步。可調式長度讓手機自然落在最順手的位置，輕盈配色也能成為穿搭的一部分。",
    features: ["手工編製，每件紋理略有不同", "長度可調，適合斜背與頸掛", "附透明手機夾片，可搭配多數手機殼"],
    specifications: [
      { label: "尺寸", value: "全長約 120–145 cm，可調式" },
      { label: "材質", value: "聚酯繩、合金五金、TPU 夾片" },
      { label: "製作時間", value: "付款後約 5–7 個工作天" },
      { label: "照護方式", value: "局部手洗、陰乾，避免長時間浸泡" },
    ],
  },
  {
    slug: "nami-camera-wrist-strap",
    name: "Nami 相機手腕繩",
    type: "腕繩",
    price: 880,
    colors: ["#829B87", "#D6C790", "#EFE5D8"],
    colorNames: ["鼠尾草綠", "日光黃", "霧白"],
    tagline: "讓每一次按下快門，都多一份安穩。",
    description: "為小型相機與隨身底片機設計的手腕繩。柔軟繩身貼合手腕，活動式收束環能快速調整鬆緊，兼顧安全與拿取速度。",
    features: ["活動式收束環，單手即可調整", "加強縫線與耐磨連接環", "適用小型相機、底片機與隨身攝影設備"],
    specifications: [
      { label: "尺寸", value: "繩長約 32 cm" },
      { label: "材質", value: "聚酯繩、植鞣皮標、合金五金" },
      { label: "建議承重", value: "1.5 kg 以下" },
      { label: "照護方式", value: "以微濕軟布輕拭，置於陰涼處乾燥" },
    ],
  },
  {
    slug: "lune-keychain",
    name: "Lune 鑰匙圈",
    type: "吊飾",
    price: 380,
    colors: ["#7F6C9D", "#E7B7C3", "#F2E8DC"],
    colorNames: ["暮色紫", "花瓣粉", "暖沙米"],
    tagline: "小小一圈，替每天出門留下溫柔記號。",
    description: "以短版編繩與圓形扣環組成，能收納鑰匙、門禁卡或作為包袋吊飾。尺寸輕巧，仍保留 hire Lab. 手作編織的層次與觸感。",
    features: ["輕巧短繩，方便從包中快速取用", "可作為鑰匙圈或包袋吊飾", "手工配色，每批色澤可能略有差異"],
    specifications: [
      { label: "尺寸", value: "含五金全長約 18 cm" },
      { label: "材質", value: "棉質混紡繩、合金扣環" },
      { label: "重量", value: "約 35 g" },
      { label: "照護方式", value: "避免接觸香水、海水與清潔劑" },
    ],
  },
];

export const formatPrice = (price: number) => `NT$ ${price.toLocaleString("zh-TW")}`;

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);
