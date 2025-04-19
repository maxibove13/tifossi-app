import { Product } from '../_types/product';
import { ProductLabel } from '../_types/product-status';

// Define the default return policy
export const defaultReturnPolicy =
  'Si no estás satisfecho con tu compra, puedes devolver el producto sin usar dentro de los 30 días posteriores a la compra con el ticket original y el embalaje intacto.';

export const products: Product[] = [
  {
    id: 'tiffosi-fast',
    image: require('../../assets/images/products/product_socks_1.png'),
    title: 'Tiffosi Fast',
    price: 590,
    label: ProductLabel.NEW,
    shortDescription: {
      line1: 'Tecnología de secado rápido.',
      line2: 'Tejido suelto de alta confortabilidad.',
    },
    longDescription: [
      'Tiffosi Fast es un producto diseñado para el deportista moderno.',
      'Tecnología de secado rápido que mantiene tus pies frescos durante toda la actividad.',
      'Disponible en múltiples colores para combinar con tu estilo personal.',
      'Diseño ergonómico que se adapta perfectamente al pie proporcionando mayor comodidad.',
      'Material de alta durabilidad resistente al desgaste por uso frecuente.',
    ],
    warranty: '6 meses',
    returnPolicy: defaultReturnPolicy,
    dimensions: {
      height: '12cm',
      width: '8cm',
    },
    colors: [
      {
        colorName: 'Blanco',
        quantity: 10,
        hex: '#FAFAFA',
        images: {
          main: require('../../assets/images/products/white-sock-1.png'),
          additional: [
            require('../../assets/images/products/white-sock-2.png'),
            require('../../assets/images/products/white-sock-3.png'),
          ],
        },
      },
      {
        colorName: 'Negro',
        quantity: 8,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/sock-color-2.png'),
          additional: [],
        },
      },
      {
        colorName: 'Naranja',
        quantity: 5,
        hex: '#FFBA54',
        images: {
          main: require('../../assets/images/products/sock-color-3.png'),
          additional: [],
        },
      },
      {
        colorName: 'Verde',
        quantity: 12,
        hex: '#70BF73',
        images: {
          main: require('../../assets/images/products/sock-color-5.png'),
          additional: [],
        },
      },
      {
        colorName: 'Amarillo',
        quantity: 7,
        hex: '#FFF27C',
        images: {
          main: require('../../assets/images/products/sock-color-4.png'),
          additional: [],
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: false },
    ],
  },
  {
    id: 'classic-socks',
    image: require('../../assets/images/products/product_socks_2.png'),
    title: 'Classic Socks',
    price: 590,
    label: ProductLabel.FEATURED,
    shortDescription: {
      line1: 'Tecnología de secado rápido.',
      line2: 'Máxima comodidad y durabilidad.',
    },
    longDescription: [
      'Classic Socks ofrece máxima comodidad y durabilidad.',
      'Tecnología de secado rápido que mantiene tus pies secos durante todo el día.',
      'Tejido suelto que brinda mayor confortabilidad y reduce la presión sobre los pies.',
    ],
    colors: [
      {
        colorName: 'Verde',
        quantity: 10,
        hex: '#70BF73',
        images: {
          main: require('../../assets/images/products/product_socks_2.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: false },
    ],
  },
  {
    id: 'socks-v2',
    image: require('../../assets/images/products/product_socks_0.png'),
    title: 'Socks V2',
    price: 590,
    label: ProductLabel.NEW,
    isCustomizable: true,
    shortDescription: {
      line1: 'Calcetines versátiles y personalizables.',
      line2: 'Diseñados para máximo rendimiento deportivo.',
    },
    longDescription: [
      'Socks V2 representa nuestra línea más avanzada de calcetines deportivos.',
      'Tecnología de secado rápido para máximo confort durante actividades intensas.',
      'Tejido suelto que brinda mayor confortabilidad sin sacrificar sujeción.',
      'Completamente personalizables con tus colores y diseños preferidos.',
    ],
    colors: [
      {
        colorName: 'Blanco',
        quantity: 10,
        hex: '#FAFAFA',
        images: {
          main: require('../../assets/images/products/product_socks_0.png'),
        },
      },
      {
        colorName: 'Negro',
        quantity: 10,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/product_socks_0.png'),
        },
      },
    ],
    sizes: [
      { value: 'XS', available: false },
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: true },
    ],
  },
  {
    id: 'regular-black',
    image: require('../../assets/images/products/product_bag_0.png'),
    title: 'Regular Black',
    price: 990,
    label: ProductLabel.FEATURED,
    shortDescription: {
      line1: 'Diseño moderno y versátil.',
      line2: 'Material resistente al uso diario.',
    },
    longDescription: [
      'Regular Black ofrece el equilibrio perfecto entre estilo y funcionalidad.',
      'Diseño moderno y versátil que se adapta a cualquier ocasión.',
      'Disponible en múltiples opciones de color para complementar tu estilo personal.',
      'Fabricado con materiales premium resistentes al uso diario intensivo.',
      'Interior espacioso con compartimentos organizados para todos tus objetos esenciales.',
    ],
    colors: [
      {
        colorName: 'Blanco',
        quantity: 10,
        hex: '#FAFAFA',
        images: {
          main: require('../../assets/images/products/sock-color-1.png'),
        },
      },
      {
        colorName: 'Negro',
        quantity: 10,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/sock-color-2.png'),
          additional: [require('../../assets/images/products/white-sock-2.png')],
        },
      },
      {
        colorName: 'Naranja',
        quantity: 10,
        hex: '#FFBA54',
        images: {
          main: require('../../assets/images/products/sock-color-3.png'),
          additional: [
            require('../../assets/images/products/white-sock-2.png'),
            require('../../assets/images/products/white-sock-3.png'),
          ],
        },
      },
      {
        colorName: 'Amarillo',
        quantity: 10,
        hex: '#FFF27C',
        images: {
          main: require('../../assets/images/products/sock-color-4.png'),
        },
      },
      {
        colorName: 'Verde',
        quantity: 10,
        hex: '#70BF73',
        images: {
          main: require('../../assets/images/products/sock-color-5.png'),
          additional: [require('../../assets/images/products/white-sock-3.png')],
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: false },
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
    shortDescription: {
      line1: 'Mochila espaciosa y personalizable.',
      line2: 'Máxima versatilidad para tu día a día.',
    },
    longDescription: [
      'Mochila SQ ofrece la máxima versatilidad para tu día a día.',
      'Amplio espacio interior con múltiples compartimentos para una organización óptima.',
      'Diseño resistente a las inclemencias del tiempo para proteger tus pertenencias.',
      'Completamente personalizable con tus colores, parches o iniciales favoritas.',
    ],
    colors: [
      {
        colorName: 'Gris',
        quantity: 12,
        hex: '#9E9E9E',
        images: {
          main: require('../../assets/images/products/product_bag_1.png'),
        },
      },
    ],
  },
  {
    id: 'buzo-oversize',
    image: require('../../assets/images/products/product_sweater.png'),
    title: 'Buzo Oversize',
    price: 1590,
    discountedPrice: 1190,
    isCustomizable: true,
    shortDescription: {
      line1: 'Sudadera estilo oversize con máxima comodidad.',
      line2: 'Diseño amplio que proporciona libertad de movimiento.',
    },
    longDescription: [
      'Buzo Oversize combina estilo urbano con funcionalidad deportiva.',
      'Diseño amplio que proporciona total libertad de movimiento y un look desenfadado.',
      'Tejido de alta calidad con interior suave para máximo confort durante todo el día.',
      'Disponible en varios colores y completamente personalizable.',
    ],
    colors: [
      {
        colorName: 'Blanco',
        quantity: 10,
        hex: '#FAFAFA',
        images: {
          main: require('../../assets/images/products/product_sweater.png'),
        },
      },
      {
        colorName: 'Negro',
        quantity: 10,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/product_sweater.png'),
        },
      },
    ],
    sizes: [
      { value: 'XS', available: true },
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: false },
    ],
  },
  {
    id: 'neceser-ball',
    image: require('../../assets/images/products/product_bag_2.png'),
    title: 'Neceser Ball',
    price: 590,
    discountedPrice: 390,
    label: ProductLabel.NEW,
    shortDescription: {
      line1: 'Neceser redondo compacto en oferta.',
      line2: 'Pequeño por fuera, espacioso por dentro.',
    },
    longDescription: [
      'Neceser Ball es la solución perfecta para tus artículos de cuidado personal.',
      'Su forma redonda ofrece un diseño innovador y cómodo de transportar.',
      'Pequeño por fuera pero espacioso por dentro para todos tus esenciales.',
      'Fabricado con material de alta resistencia al agua y rasgaduras.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 10,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/product_bag_2.png'),
        },
      },
    ],
  },
  {
    id: 'mochila-classic',
    image: require('../../assets/images/products/product_bag_3.png'),
    title: 'Mochila Classic',
    price: 590,
    shortDescription: {
      line1: 'Mochila clásica de diseño atemporal.',
      line2: 'Fabricada con materiales resistentes y duraderos.',
    },
    longDescription: [
      'Mochila Classic combina la esencia del diseño tradicional con toques modernos.',
      'Proporciona espacio suficiente para tus objetos cotidianos con un estilo sobrio.',
      'Su diseño atemporal garantiza que nunca pase de moda, convirtiéndola en una inversión duradera.',
      'Fabricada con materiales resistentes para acompañarte en todas tus aventuras.',
    ],
    colors: [
      {
        colorName: 'Gris',
        quantity: 8,
        hex: '#9E9E9E',
        images: {
          main: require('../../assets/images/products/product_bag_3.png'),
        },
      },
    ],
  },
  {
    id: 'cap-v3',
    image: require('../../assets/images/products/product_cap_black.png'),
    title: 'Cap V3',
    price: 590,
    shortDescription: {
      line1: 'Gorra urbana de estilo contemporáneo.',
      line2: 'Material transpirable para máxima comodidad.',
    },
    longDescription: [
      'Cap V3 representa la tercera generación de nuestras populares gorras urbanas.',
      'Diseño contemporáneo con un ajuste cómodo para todos los tamaños de cabeza.',
      'El material transpirable garantiza comodidad incluso en los días más calurosos.',
      'Un accesorio versátil que complementa cualquier conjunto casual o deportivo.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 12,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/product_cap_black.png'),
        },
      },
    ],
  },
  {
    id: 'relaxed-classic',
    image: require('../../assets/images/products/product_shirt_black_relaxed.png'),
    title: 'Relaxed Classic',
    price: 590,
    shortDescription: {
      line1: 'Camisa de corte relajado para máximo confort.',
      line2: 'Tejido de alta calidad que mantiene su forma.',
    },
    longDescription: [
      'Relaxed Classic es nuestra camisa insignia de corte holgado y casual.',
      'Diseñada para proporcionar la máxima comodidad sin sacrificar el estilo.',
      'Tejido de alta calidad que mantiene su forma incluso después de múltiples lavados.',
      'Perfecta para ocasiones informales o para un look elegante pero relajado en la oficina.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 15,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/product_shirt_black_relaxed.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: true },
    ],
  },
  {
    id: 'regular-shirt',
    image: require('../../assets/images/products/product_shirt_black_regular.png'),
    title: 'Regular Shirt',
    price: 790,
    shortDescription: {
      line1: 'Camisa de corte regular para uso diario.',
      line2: 'Un básico imprescindible en cualquier armario.',
    },
    longDescription: [
      'Regular Shirt ofrece el equilibrio perfecto entre comodidad y elegancia.',
      'Su corte clásico se adapta a cualquier tipo de cuerpo y ocasión.',
      'Fabricada con algodón de primera calidad que garantiza durabilidad y transpirabilidad.',
      'Un básico imprescindible en cualquier armario que combina con todo tipo de prendas.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 20,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/product_shirt_black_regular.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: false },
    ],
  },
  {
    id: 'white-shirt',
    image: require('../../assets/images/products/product_shirt_white.png'),
    title: 'White Shirt',
    price: 790,
    shortDescription: {
      line1: 'Camisa blanca elegante y versátil.',
      line2: 'Perfecta para ocasiones formales e informales.',
    },
    longDescription: [
      'White Shirt es la pieza elegante y atemporal que todo guardarropa necesita.',
      'Confeccionada con tejido premium que garantiza un acabado impecable y duradero.',
      'Su diseño versátil la hace perfecta tanto para ocasiones formales como informales.',
      'El corte estudiado proporciona un ajuste cómodo y favorecedor para cualquier silueta.',
    ],
    colors: [
      {
        colorName: 'Blanco',
        quantity: 18,
        hex: '#FAFAFA',
        images: {
          main: require('../../assets/images/products/product_shirt_white.png'),
        },
      },
    ],
    sizes: [
      { value: 'XS', available: false },
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: true },
    ],
  },
  {
    id: 't-shirt-black',
    image: require('../../assets/images/products/product_t_shirt_black.png'),
    title: 'T-Shirt Black',
    price: 690,
    shortDescription: {
      line1: 'Camiseta negra esencial para todo guardarropa.',
      line2: 'Confeccionada con algodón orgánico de alta densidad.',
    },
    longDescription: [
      'T-Shirt Black es la camiseta básica que nunca pasa de moda.',
      'Confeccionada con algodón orgánico de alta densidad para mayor durabilidad.',
      'Su color negro profundo mantiene su intensidad lavado tras lavado.',
      'Versátil y combinable con cualquier prenda para un look casual o deportivo.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 25,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/product_t_shirt_black.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
      { value: 'XL', available: true },
    ],
  },
  {
    id: 'backpack-pro',
    image: require('../../assets/images/products/product_bag_4.png'),
    title: 'Backpack Pro',
    price: 1290,
    shortDescription: {
      line1: 'Mochila premium con características profesionales.',
      line2: 'Compartimentos especiales para dispositivos electrónicos.',
    },
    longDescription: [
      'Backpack Pro está diseñada para profesionales y viajeros exigentes.',
      'Cuenta con compartimentos especiales para dispositivos electrónicos y documentos importantes.',
      'Fabricada con materiales resistentes al agua y al desgaste para una durabilidad excepcional.',
      'Sistema ergonómico de correas que distribuye el peso de forma óptima para mayor comodidad.',
      'Ideal para el uso diario en entornos profesionales o viajes de negocios.',
    ],
    colors: [
      {
        colorName: 'Gris',
        quantity: 15,
        hex: '#9E9E9E',
        images: {
          main: require('../../assets/images/products/product_bag_4.png'),
        },
      },
    ],
  },
  {
    id: 'neceserr',
    image: require('../../assets/images/products/product_bag_5.png'),
    title: 'Neceser Globo',
    price: 590,
    discountedPrice: 390,
    label: ProductLabel.NEW,
    isCustomizable: true,
    shortDescription: {
      line1: 'Neceser compacto y funcional para todos tus viajes.',
      line2: 'Diseño práctico y organizado para tus artículos personales.',
    },
    longDescription: [
      'El Neceser Globo ha sido diseñado para viajeros exigentes que necesitan organización y practicidad.',
      'Su diseño compacto permite guardarlo fácilmente en maletas o mochilas sin ocupar demasiado espacio.',
      'Fabricado con materiales de alta resistencia que garantizan durabilidad y protección de tus artículos personales.',
      'Cuenta con múltiples compartimentos organizados para mantener todos tus productos de higiene y belleza en perfecto orden.',
      'Ideal tanto para viajes cortos como para largas estancias, adaptándose a todas tus necesidades.',
      'El cierre resistente al agua protege el contenido de salpicaduras y pequeños derrames.',
    ],
    warranty: '3 meses',
    returnPolicy: defaultReturnPolicy,
    dimensions: {
      height: '25cm',
      width: '18cm',
      depth: '10cm',
    },
    colors: [
      {
        colorName: 'Negro',
        quantity: 15,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/neceser9-1.png'),
          additional: [
            require('../../assets/images/products/neceser9-3.png'),
            require('../../assets/images/products/neceser9-4.png'),
          ],
        },
      },
    ],
  },
  {
    id: 'backpack-travel',
    image: require('../../assets/images/products/product_bag_6.png'),
    title: 'Backpack Travel',
    price: 1490,
    shortDescription: {
      line1: 'Mochila espaciosa diseñada para viajes largos.',
      line2: 'Sistema ergonómico para máxima comodidad en travesías.',
    },
    longDescription: [
      'Backpack Travel es tu compañera ideal para aventuras y viajes extensos.',
      'Diseño de gran capacidad con múltiples bolsillos y compartimentos para una organización perfecta.',
      'Sistema de compresión que permite ajustar el volumen según tus necesidades.',
      'Materiales impermeables y costuras reforzadas que protegen tus pertenencias en cualquier clima.',
      'Correas acolchadas y soporte lumbar para distribuir el peso de forma óptima en largas caminatas.',
    ],
    colors: [
      {
        colorName: 'Gris',
        quantity: 10,
        hex: '#9E9E9E',
        images: {
          main: require('../../assets/images/products/product_bag_6.png'),
        },
      },
    ],
  },
];

export const getHighlightedProducts = () => products.slice(0, 3);
export const getFeaturedProduct = () => products[products.length - 2];
export const getRecommendedProducts = () => products.slice(3, 9);
export const getRelatedProducts = () => products.slice(9, 15);
export const getTrendingProducts = () =>
  [
    products.find((p) => p.id === 'regular-shirt'),
    products.find((p) => p.id === 'relaxed-classic'),
    products.find((p) => p.id === 'white-shirt'),
    products.find((p) => p.id === 'cap-v3'),
  ].filter((p): p is Product => p !== undefined);
export const getNewReleases = () => products.slice(0, 4);
export const getProductById = (id: string) => products.find((p) => p.id === id);

// Add the function for Lanzamientos & Oportunidades
export const getLaunchAndOpportunityProducts = (): Product[] => {
  const ids = ['socks-v2', 'regular-black', 'mochila-sq', 'buzo-oversize'];
  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
};

const ProductData = {
  products,
  getHighlightedProducts,
  getFeaturedProduct,
  getRecommendedProducts,
  getRelatedProducts,
  getTrendingProducts,
  getNewReleases,
  getProductById,
  getLaunchAndOpportunityProducts,
};

export default ProductData;
