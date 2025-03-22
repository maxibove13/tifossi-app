import { Product } from '../types/product';
import { ProductLabel } from '../types/product-status';

export const products: Product[] = [
  {
    id: 'tiffosi-fast',
    image: require('../../assets/images/products/product_socks_1.png'),
    title: 'Tiffosi Fast',
    price: 590,
    label: ProductLabel.NEW,
    description: [
      'Tecnología de secado rápido.',
      'Tejido suelto que brinda mayor confortabilidad.',
    ],
    colors: [
      { color: '#0C0C0C', quantity: 10 },
    ],
  },
  {
    id: 'classic-socks',
    image: require('../../assets/images/products/product_socks_2.png'),
    title: 'Classic Socks',
    price: 590,
    label: ProductLabel.FEATURED,
    description: [
      'Tecnología de secado rápido.',
      'Tejido suelto que brinda mayor confortabilidad.',
    ],
    colors: [
      { color: '#4CAF50', quantity: 10 },
    ],
  },
  {
    id: 'socks-v2',
    image: require('../../assets/images/products/product_socks_0.png'),
    title: 'Socks V2',
    price: 590,
    label: ProductLabel.NEW,
    isCustomizable: true,
    description: [
      'Tecnología de secado rápido.',
      'Tejido suelto que brinda mayor confortabilidad.',
    ],
    colors: [
      { color: '#FAFAFA', quantity: 10 },
      { color: '#0C0C0C', quantity: 10 },
    ],
  },
  {
    id: 'regular-black',
    image: require('../../assets/images/products/product_bag_0.png'),
    title: 'Regular Black',
    price: 990,
    label: ProductLabel.FEATURED,
    colors: [
      { color: '#FAFAFA', quantity: 10 },
      { color: '#0C0C0C', quantity: 10 },
      { color: '#FFBA54', quantity: 10 },
      { color: '#FFF27C', quantity: 10 },
    ],
  },
  {
    id: 'mochila-sq',
    image: require('../../assets/images/products/product_bag_1.png'),
    title: 'Mochila SQ',
    price: 1190,
    discountedPrice: 890,
    label: ProductLabel.OPPORTUNITY,
    isCustomizable: true,
  },
  {
    id: 'buzo-oversize',
    image: require('../../assets/images/products/product_sweater.png'),
    title: 'Buzo Oversize',
    price: 1590,
    discountedPrice: 1190,
    isCustomizable: true,
    colors: [
      { color: '#FAFAFA', quantity: 10 },
      { color: '#0C0C0C', quantity: 10 },
    ],
  },
  {
    id: 'neceser-ball',
    image: require('../../assets/images/products/product_bag_2.png'),
    title: 'Neceser Ball',
    price: 590,
    discountedPrice: 390,
    label: ProductLabel.SALE,
  },
  {
    id: 'mochila-classic',
    image: require('../../assets/images/products/product_bag_3.png'),
    title: 'Mochila Classic',
    price: 590,
  },
  {
    id: 'cap-v3',
    image: require('../../assets/images/products/product_cap_black.png'),
    title: 'Cap V3',
    price: 590,
  },
  {
    id: 'relaxed-classic',
    image: require('../../assets/images/products/product_shirt_black_relaxed.png'),
    title: 'Relaxed Classic',
    price: 590,
  },
  {
    id: 'regular-shirt',
    image: require('../../assets/images/products/product_shirt_black_regular.png'),
    title: 'Regular Shirt',
    price: 790,
  },
  {
    id: 'white-shirt',
    image: require('../../assets/images/products/product_shirt_white.png'),
    title: 'White Shirt',
    price: 790,
  },
  {
    id: 't-shirt-black',
    image: require('../../assets/images/products/product_t_shirt_black.png'),
    title: 'T-Shirt Black',
    price: 690,
  },
  {
    id: 'backpack-pro',
    image: require('../../assets/images/products/product_bag_4.png'),
    title: 'Backpack Pro',
    price: 1290,
  },
  {
    id: 'neceserr',
    image: require('../../assets/images/products/product_bag_5.png'),
    title: 'Neceser Globo',
    price: 1490,
    label: ProductLabel.NEW,
    isCustomizable: true,
    description: [
      'Diseño compacto y funcional',
      'Material resistente y duradero',
      'Compartimentos organizados',
    ],
  },
  {
    id: 'backpack-travel',
    image: require('../../assets/images/products/product_bag_6.png'),
    title: 'Backpack Travel',
    price: 1490,
  },
];

export const getHighlightedProducts = () => products.slice(0, 3);
export const getFeaturedProduct = () => products[products.length - 2];
export const getRecommendedProducts = () => products.slice(4, 7);
export const getTrendingProducts = () => [
  products.find(p => p.id === 'regular-shirt'),
  products.find(p => p.id === 'relaxed-classic'),
  products.find(p => p.id === 'white-shirt'),
  products.find(p => p.id === 'cap-v3'),
].filter((p): p is Product => p !== undefined);
export const getNewReleases = () => products.slice(0, 4);
export const getProductById = (id: string) => products.find(p => p.id === id);

const ProductData = {
  products,
  getHighlightedProducts,
  getFeaturedProduct,
  getRecommendedProducts,
  getTrendingProducts,
  getNewReleases,
  getProductById,
};

export default ProductData; 