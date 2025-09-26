import { Product } from '../_types/product';
import { ProductStatus, isLabelCategory, hasStatus } from '../_types/product-status';
import { CATEGORY_IDS, MODEL_IDS, DEFAULTS } from '../_types/constants';

export const defaultReturnPolicy = DEFAULTS.RETURN_POLICY;

// Products data with explicit model IDs
export const products: Product[] = [
  {
    id: 'tiffosi-fast',
    frontImage: require('../../assets/images/products/product_socks_1.png'),
    title: 'Tiffosi Fast',
    categoryId: 'medias',
    modelId: 'fast',
    price: 590,
    statuses: [ProductStatus.NEW, ProductStatus.HIGHLIGHTED],
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
    frontImage: require('../../assets/images/products/product_socks_2.png'),
    title: 'Classic Socks',
    categoryId: 'medias',
    modelId: 'classic',
    price: 590,
    statuses: [ProductStatus.FEATURED, ProductStatus.HIGHLIGHTED],
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
    frontImage: require('../../assets/images/products/product_socks_0.png'),
    title: 'Socks V2',
    categoryId: 'medias',
    modelId: 'sport',
    price: 590,
    statuses: [ProductStatus.NEW, ProductStatus.HIGHLIGHTED],
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
    frontImage: require('../../assets/images/products/product_bag_0.png'),
    title: 'Regular Black',
    categoryId: 'bolsos',
    modelId: 'regular_bag',
    price: 990,
    statuses: [ProductStatus.FEATURED],
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
    frontImage: require('../../assets/images/products/product_bag_1.png'),
    title: 'Mochila SQ',
    categoryId: 'mochilas',
    modelId: 'standard',
    price: 1190,
    discountedPrice: 890,
    statuses: [ProductStatus.OPPORTUNITY],
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
    frontImage: require('../../assets/images/products/product_sweater.png'),
    title: 'Buzo Oversize',
    categoryId: 'buzos',
    modelId: 'oversize_buzo',
    price: 1590,
    discountedPrice: 1190,
    statuses: [ProductStatus.OPPORTUNITY],
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
    frontImage: require('../../assets/images/products/product_bag_2.png'),
    title: 'Neceser Ball',
    categoryId: 'neceser',
    modelId: 'ball',
    price: 590,
    discountedPrice: 390,
    statuses: [ProductStatus.NEW],
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
    frontImage: require('../../assets/images/products/product_bag_3.png'),
    title: 'Mochila Classic',
    categoryId: 'mochilas',
    modelId: 'standard',
    price: 590,
    statuses: [ProductStatus.RECOMMENDED],
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
    frontImage: require('../../assets/images/products/product_cap_black.png'),
    title: 'Cap V3',
    categoryId: 'gorros',
    modelId: 'cap',
    price: 590,
    statuses: [ProductStatus.POPULAR],
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
    frontImage: require('../../assets/images/products/product_shirt_black_relaxed.png'),
    title: 'Relaxed Classic',
    categoryId: 'remeras',
    modelId: 'relaxed',
    price: 590,
    statuses: [ProductStatus.POPULAR],
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
    frontImage: require('../../assets/images/products/product_shirt_black_regular.png'),
    title: 'Regular Shirt',
    categoryId: 'remeras',
    modelId: 'regular',
    price: 790,
    statuses: [ProductStatus.POPULAR],
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
    frontImage: require('../../assets/images/products/product_shirt_white.png'),
    title: 'White Shirt',
    categoryId: 'remeras',
    modelId: 'regular',
    price: 790,
    statuses: [ProductStatus.POPULAR],
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
    frontImage: require('../../assets/images/products/product_t_shirt_black.png'),
    title: 'T-Shirt Black',
    categoryId: 'remeras',
    modelId: 'tshirt',
    price: 690,
    statuses: [ProductStatus.RECOMMENDED],
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
    frontImage: require('../../assets/images/products/product_bag_4.png'),
    title: 'Backpack Pro',
    categoryId: 'mochilas',
    modelId: 'premium',
    price: 1290,
    statuses: [ProductStatus.OPPORTUNITY],
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
    frontImage: require('../../assets/images/products/product_bag_5.png'),
    title: 'Neceser Globo',
    categoryId: 'neceser',
    modelId: 'globo',
    price: 590,
    discountedPrice: 390,
    statuses: [ProductStatus.NEW],
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
    frontImage: require('../../assets/images/products/product_bag_6.png'),
    title: 'Backpack Travel',
    categoryId: 'mochilas',
    modelId: 'travel',
    price: 1490,
    statuses: [ProductStatus.OPPORTUNITY],
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
  {
    id: 'mochila-gold',
    frontImage: require('../../assets/images/products/mochila-gold.png'),
    videoSource: '/uploads/mochila_gold_video.mp4',
    title: 'Mochila Gold',
    categoryId: 'mochilas',
    modelId: 'premium',
    price: 1890,
    statuses: [ProductStatus.APP_EXCLUSIVE, ProductStatus.HIGHLIGHTED],
    shortDescription: {
      line1: 'Mochila premium con detalles dorados.',
      line2: 'Diseño elegante para destacar en cualquier ocasión.',
    },
    longDescription: [
      'Mochila Gold es nuestra propuesta más exclusiva y elegante.',
      'Confeccionada con materiales premium y detalles en tonos dorados que la convierten en un accesorio único.',
      'Cuenta con múltiples compartimentos interiores para una organización perfecta de tus pertenencias.',
      'Correas ergonómicas que garantizan comodidad incluso en largas jornadas.',
      'Resistente al agua y al desgaste diario sin perder su aspecto lujoso.',
    ],
    warranty: '12 meses',
    returnPolicy: defaultReturnPolicy,
    dimensions: {
      height: '45cm',
      width: '30cm',
      depth: '15cm',
    },
    colors: [
      {
        colorName: 'Dorado',
        quantity: 8,
        hex: '#D4AF37',
        images: {
          main: require('../../assets/images/products/mochila-gold.png'),
        },
      },
    ],
    sizes: [{ value: 'Único', available: true }],
  },
  {
    id: 'mochila-black',
    frontImage: require('../../assets/images/products/mochila-black.png'),
    videoSource: '/uploads/mochila_black_video.mp4',
    title: 'Mochila Black',
    categoryId: 'mochilas',
    modelId: 'premium',
    price: 1690,
    statuses: [ProductStatus.APP_EXCLUSIVE],
    shortDescription: {
      line1: 'Mochila negra de diseño minimalista y versátil.',
      line2: 'Perfecta para uso diario y viajes cortos.',
    },
    longDescription: [
      'Mochila Black combina elegancia y funcionalidad con su diseño minimalista.',
      'Material resistente al agua y rasguños para proteger tus pertenencias en cualquier situación.',
      'Interior espacioso con compartimentos organizados para dispositivos electrónicos y objetos personales.',
      'Sistema de correas acolchadas que distribuyen el peso de forma óptima para mayor comodidad.',
      'Versátil para uso diario en la ciudad o escapadas de fin de semana.',
    ],
    warranty: '12 meses',
    returnPolicy: defaultReturnPolicy,
    dimensions: {
      height: '42cm',
      width: '28cm',
      depth: '14cm',
    },
    colors: [
      {
        colorName: 'Negro',
        quantity: 15,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/mochila-black.png'),
        },
      },
    ],
    sizes: [{ value: 'Único', available: true }],
  },
  // Additional products from the explore screen that need to be accessible
  {
    id: 'explore-campera-deportiva',
    title: 'Campera Deportiva',
    categoryId: 'buzos',
    modelId: 'campera',
    price: 1890,
    statuses: [ProductStatus.NEW, ProductStatus.APP_EXCLUSIVE],
    frontImage: require('../../assets/images/products/campera-deportiva.png'),
    shortDescription: {
      line1: 'Campera deportiva de alto rendimiento.',
      line2: 'Material de primera calidad con tecnología térmica.',
    },
    longDescription: [
      'Campera deportiva diseñada para atletas de alto rendimiento.',
      'Material premium que proporciona aislamiento térmico sin sacrificar la transpirabilidad.',
      'Diseño ergonómico que permite total libertad de movimiento durante la actividad física.',
      'Bolsillos estratégicamente ubicados para mantener tus pertenencias seguras durante el ejercicio.',
      'Acabado resistente al agua que te protege durante condiciones climáticas adversas.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 12,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/campera-deportiva.png'),
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
    id: 'explore-antideslizantes-1',
    title: 'Antideslizantes',
    categoryId: 'medias',
    modelId: 'antideslizante',
    price: 490,
    statuses: [ProductStatus.RECOMMENDED],
    frontImage: require('../../assets/images/products/antideslizantes-1.png'),
    shortDescription: {
      line1: 'Calcetines antideslizantes para mayor agarre.',
      line2: 'Perfectos para entrenamientos de alta intensidad.',
    },
    longDescription: [
      'Los calcetines antideslizantes proporcionan un agarre excepcional en cualquier superficie.',
      'Ideales para prácticas deportivas donde la tracción es fundamental como yoga, pilates o fútbol sala.',
      'Fabricados con materiales transpirables que mantienen tus pies secos durante toda la actividad.',
      'Diseño anatómico que se adapta perfectamente al pie para mayor comodidad y rendimiento.',
      'La tecnología antisudor evita malos olores incluso después de entrenamientos intensos.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 20,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/antideslizantes-1.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
  },
  {
    id: 'explore-antideslizantes-2',
    title: 'Antideslizantes V2',
    categoryId: 'medias',
    modelId: 'antideslizante',
    price: 490,
    statuses: [ProductStatus.RECOMMENDED],
    frontImage: require('../../assets/images/products/antideslizantes-2.png'),
    shortDescription: {
      line1: 'Segunda generación de calcetines con mejor agarre.',
      line2: 'Diseño mejorado para mayor durabilidad.',
    },
    longDescription: [
      'Los Antideslizantes V2 representan la evolución de nuestros populares calcetines deportivos.',
      'Tecnología de agarre mejorada que proporciona estabilidad en cualquier tipo de superficie.',
      'Tejido reforzado en puntos estratégicos para extender significativamente su vida útil.',
      'Mayor densidad de puntos de silicona en la planta para un agarre sin precedentes.',
      'Perfectos para deportes indoor y actividades que requieren máxima tracción sin calzado.',
    ],
    colors: [
      {
        colorName: 'Gris',
        quantity: 15,
        hex: '#9E9E9E',
        images: {
          main: require('../../assets/images/products/antideslizantes-2.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
  },
  {
    id: 'explore-tiffosi-antideslizante-1',
    title: 'Tiffosi Antideslizante',
    categoryId: 'medias',
    modelId: 'antideslizante',
    price: 550,
    statuses: [ProductStatus.RECOMMENDED],
    frontImage: require('../../assets/images/products/tiffosi-antideslizante-1.png'),
    shortDescription: {
      line1: 'Calcetines premium con tecnología antideslizante.',
      line2: 'La mejor opción para deportes de alta exigencia.',
    },
    longDescription: [
      'Tiffosi Antideslizante representa lo último en tecnología de calcetines deportivos.',
      'Combina el diseño exclusivo de Tiffosi con una funcionalidad superior para deportistas exigentes.',
      'El patrón antideslizante cubre toda la planta del pie proporcionando un agarre incomparable.',
      'Materiales de primera calidad que garantizan durabilidad sin sacrificar comodidad.',
      'Recomendados por atletas profesionales por su rendimiento excepcional en competiciones.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 18,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/tiffosi-antideslizante-1.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
  },
  {
    id: 'explore-shinguards-1',
    title: 'Shinguards Pro',
    categoryId: 'canilleras',
    modelId: 'pro',
    price: 790,
    isCustomizable: true,
    statuses: [ProductStatus.NEW],
    frontImage: require('../../assets/images/products/shinguards-1.png'),
    shortDescription: {
      line1: 'Espinilleras profesionales con protección avanzada.',
      line2: 'Personalizables con tu nombre o número.',
    },
    longDescription: [
      'Las Shinguards Pro ofrecen protección de nivel profesional para futbolistas exigentes.',
      'Desarrolladas con tecnología de absorción de impactos para garantizar máxima seguridad durante el juego.',
      'Estructura ligera que no compromete la movilidad ni velocidad en el campo.',
      'Sistema de ventilación que mantiene tus piernas frescas incluso en los partidos más intensos.',
      'Completamente personalizables con tu nombre, número o iniciales para un toque único.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 15,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/shinguards-1.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
  },
  {
    id: 'explore-shinguards-2',
    title: 'Shinguards Lite',
    categoryId: 'canilleras',
    modelId: 'lite',
    price: 690,
    statuses: [ProductStatus.FEATURED],
    frontImage: require('../../assets/images/products/shinguards-2.png'),
    shortDescription: {
      line1: 'Espinilleras ultraligeras para máxima velocidad.',
      line2: 'Protección efectiva sin sacrificar agilidad.',
    },
    longDescription: [
      'Shinguards Lite está diseñado para jugadores que priorizan la velocidad y agilidad.',
      'Su construcción ultraligera minimiza el peso sin comprometer la protección necesaria.',
      'Material flexible que se adapta a la forma de tu pierna para un ajuste perfecto.',
      'Sistema de sujeción que mantiene las espinilleras en su lugar durante todo el partido.',
      'Diseño minimalista ideal para jugadores ofensivos que necesitan máxima libertad de movimiento.',
    ],
    colors: [
      {
        colorName: 'Blanco',
        quantity: 10,
        hex: '#FAFAFA',
        images: {
          main: require('../../assets/images/products/shinguards-2.png'),
        },
      },
    ],
    sizes: [
      { value: 'S', available: true },
      { value: 'M', available: true },
      { value: 'L', available: true },
    ],
  },
  {
    id: 'explore-shirt-os-black-1',
    title: 'Shirt OS Black',
    categoryId: 'remeras',
    modelId: 'oversize',
    price: 890,
    statuses: [ProductStatus.FEATURED],
    frontImage: require('../../assets/images/products/shirt-os-black-1.png'),
    shortDescription: {
      line1: 'Camisa oversize de corte moderno.',
      line2: 'Estilo urbano con máxima comodidad.',
    },
    longDescription: [
      'Shirt OS Black representa la esencia del estilo urbano contemporáneo.',
      'Corte oversize que proporciona una silueta moderna y relajada, perfecta para el día a día.',
      'Fabricada con algodón premium que garantiza suavidad y durabilidad excepcionales.',
      'Diseño minimalista que facilita combinaciones infinitas con el resto de tu guardarropa.',
      'Los detalles sutiles en el acabado le otorgan un toque de distinción a una prenda aparentemente simple.',
    ],
    colors: [
      {
        colorName: 'Negro',
        quantity: 25,
        hex: '#0C0C0C',
        images: {
          main: require('../../assets/images/products/shirt-os-black-1.png'),
          additional: [
            require('../../assets/images/products/shirt-os-black-2.png'),
            require('../../assets/images/products/shirt-os-black-3.png'),
          ],
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
];

export const getHighlightedProducts = () => {
  // First try to find products specifically marked with HIGHLIGHTED status
  const highlightedProducts = products.filter((product) =>
    hasStatus(product.statuses, ProductStatus.HIGHLIGHTED)
  );

  // If we find any highlighted products, return those
  if (highlightedProducts.length > 0) {
    return highlightedProducts;
  }

  // Otherwise, fall back to the original behavior of returning the first 3 products
  return products.slice(0, 3);
};
export const getFeaturedProduct = () => {
  const featuredProducts = products.filter((product) =>
    hasStatus(product.statuses, ProductStatus.FEATURED)
  );
  return featuredProducts.length > 0 ? featuredProducts[0] : null;
};
export const getRecommendedProducts = () =>
  products.filter((product) => hasStatus(product.statuses, ProductStatus.RECOMMENDED));
export const getRelatedProducts = () => products.slice(9, 15);
export const getTrendingProducts = () =>
  products.filter((product) => hasStatus(product.statuses, ProductStatus.POPULAR));
export const getNewReleases = () =>
  products.filter((product) => hasStatus(product.statuses, ProductStatus.NEW));
export const getProductById = (id: string) => products.find((p) => p.id === id);

// Get products with the OPPORTUNITY status
export const getLaunchAndOpportunityProducts = (): Product[] => {
  return products.filter((product) => hasStatus(product.statuses, ProductStatus.OPPORTUNITY));
};

/**
 * Get products for TiffosiExplore screen - exclusively showing products with the APP_EXCLUSIVE status
 * @returns Array of products with the APP_EXCLUSIVE status
 */
export const getTiffosiExploreProducts = (): Product[] => {
  // Only return products marked with the APP_EXCLUSIVE status
  return products.filter((p) => hasStatus(p.statuses, ProductStatus.APP_EXCLUSIVE));
};

/**
 * Get products by category ID or by label-based category
 * @param categoryId The category ID to filter by
 * @returns Array of products matching the category
 */
export const getProductsByCategory = (categoryId: string): Product[] => {
  // Return all products for the "todo" category
  if (categoryId === CATEGORY_IDS.ALL) {
    return products;
  }

  // Check if this categoryId represents a status-based category
  if (isLabelCategory(categoryId)) {
    // This is a status category - filter products that have this status
    const status = categoryId as ProductStatus;
    return products.filter((product) => hasStatus(product.statuses, status));
  }

  // Regular product categories
  return products.filter((product) => product.categoryId === categoryId);
};

// Removed getProductsByCategoryAndTag - replaced by getProductsByCategoryAndModel

// Removed getTagsForCategory - replaced by model-based functions

// No need for model assignment anymore since we explicitly define models for each product

/**
 * Get products filtered by both category and model
 * @param categoryId The category ID to filter by
 * @param modelId The model ID to filter by
 * @returns Array of products matching both category and model
 */
export const getProductsByCategoryAndModel = (categoryId: string, modelId: string): Product[] => {
  // First get products by category
  const categoryProducts = getProductsByCategory(categoryId);

  // Return all category products if model is 'all'
  if (modelId === MODEL_IDS.ALL) {
    return categoryProducts;
  }

  // Further filter by model
  return categoryProducts.filter((product) => product.modelId === modelId);
};

/**
 * Get all unique model IDs used by products in a category
 * @param categoryId The category ID to get models for
 * @returns Array of unique model IDs used in the category
 * @deprecated Use ModelsData.getModelsByCategory instead which returns full model objects
 */
export const getModelsForCategory = (categoryId: string): string[] => {
  if (categoryId === CATEGORY_IDS.ALL) {
    return []; // No models for 'todo' category
  }

  const categoryProducts = getProductsByCategory(categoryId);
  const uniqueModels = new Set<string>();

  categoryProducts.forEach((product) => {
    if (product.modelId) {
      uniqueModels.add(product.modelId);
    }
  });

  return Array.from(uniqueModels);
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
  getTiffosiExploreProducts,
  getProductsByCategory,
  getProductsByCategoryAndModel,
  getModelsForCategory,
};

export default ProductData;
