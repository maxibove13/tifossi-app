/**
 * Realistic Product Mock Data for Testing
 * Matches the Strapi schema with comprehensive product data
 */

export interface MockProductAttributes {
  name: string;
  slug: string;
  shortDescription: {
    line1: string;
    line2: string;
  };
  longDescription: string | string[];
  price: number;
  discountPrice?: number;
  category: string;
  subcategory: string;
  sport: string;
  team: string;
  images: {
    data: {
      id: string;
      attributes: {
        url: string;
        alternativeText: string;
        width?: number;
        height?: number;
      };
    }[];
  };
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  isNew: boolean;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface MockProduct {
  id: string;
  attributes: MockProductAttributes;
}

// Uruguayan football teams and sports
const uruguayanTeams = {
  futbol: [
    'nacional',
    'penarol',
    'defensor',
    'wanderers',
    'danubio',
    'montevideo-city',
    'cerro',
    'boston-river',
  ],
  basketball: ['aguada', 'malvin', 'goes', 'trouville'],
  rugby: ['old-christians', 'carrasco-polo', 'champagnat'],
};

const categories = [
  {
    id: 'apparel',
    name: 'Ropa',
    subcategories: ['jerseys', 'shorts', 'pants', 'jackets', 'training'],
  },
  {
    id: 'accessories',
    name: 'Accesorios',
    subcategories: ['caps', 'scarves', 'bags', 'keychains', 'flags'],
  },
  { id: 'footwear', name: 'Calzado', subcategories: ['cleats', 'casual', 'training'] },
  { id: 'equipment', name: 'Equipamiento', subcategories: ['balls', 'gloves', 'protective'] },
];

const sizes = {
  apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  footwear: ['38', '39', '40', '41', '42', '43', '44', '45', '46'],
  accessories: ['Único'],
};

const colors = [
  'Azul',
  'Blanco',
  'Rojo',
  'Negro',
  'Amarillo',
  'Verde',
  'Celeste',
  'Naranja',
  'Violeta',
  'Rosa',
  'Gris',
  'Dorado',
  'Plateado',
];

// Generate realistic product descriptions
const getProductDescription = (
  team: string,
  category: string,
  subcategory: string
): {
  shortDescription: { line1: string; line2: string };
  longDescription: string;
} => {
  const teamNames: Record<string, string> = {
    nacional: 'Nacional',
    penarol: 'Peñarol',
    defensor: 'Defensor Sporting',
    wanderers: 'Montevideo Wanderers',
    danubio: 'Danubio FC',
    'montevideo-city': 'Montevideo City',
    cerro: 'Cerro',
    'boston-river': 'Boston River',
    aguada: 'Club Aguada',
    malvin: 'Club Malvin',
    goes: 'Club Goes',
    trouville: 'Trouville',
    'old-christians': 'Old Christians',
    'carrasco-polo': 'Carrasco Polo',
    champagnat: 'Champagnat',
  };

  const descriptions: Record<
    string,
    Record<string, { line1: string; line2: string; long: string }>
  > = {
    jerseys: {
      default: {
        line1: 'Camiseta oficial',
        line2: 'Temporada 2024',
        long: 'Camiseta oficial de alta calidad fabricada con materiales premium. Diseño auténtico con tecnología Dri-FIT para mantenerte seco y cómodo durante el juego. Incluye el escudo bordado del club y patrocinadores oficiales.',
      },
    },
    caps: {
      default: {
        line1: 'Gorra oficial',
        line2: 'Ajuste perfecto',
        long: 'Gorra oficial del club con bordado de alta calidad. Fabricada con materiales resistentes y transpirables. Cierre ajustable para el máximo confort. Perfecta para mostrar tu pasión por el equipo.',
      },
    },
    scarves: {
      default: {
        line1: 'Bufanda oficial',
        line2: 'Para los hinchas',
        long: 'Bufanda oficial tejida con los colores distintivos del club. Material suave y cálido, ideal para los partidos en el estadio. Diseño tradicional con flecos en los extremos.',
      },
    },
    cleats: {
      default: {
        line1: 'Botines profesionales',
        line2: 'Máximo rendimiento',
        long: 'Botines de fútbol profesionales diseñados para el máximo rendimiento en el campo. Suela optimizada para césped natural y artificial. Construcción liviana pero resistente.',
      },
    },
  };

  const categoryDesc = descriptions[subcategory]?.default || descriptions.jerseys.default;
  const teamName = teamNames[team] || team.charAt(0).toUpperCase() + team.slice(1);

  return {
    shortDescription: {
      line1: `${categoryDesc.line1} ${teamName}`,
      line2: categoryDesc.line2,
    },
    longDescription: `${categoryDesc.long} ${teamName === team ? '' : ` Producto oficial de ${teamName}.`} Ideal para hinchas y coleccionistas.`,
  };
};

// Generate mock products
export const productMockData: MockProduct[] = [];

let productId = 1;

// Generate products for each team and category combination
uruguayanTeams.futbol.slice(0, 4).forEach((team) => {
  categories.forEach((category) => {
    category.subcategories.slice(0, 2).forEach((subcategory) => {
      const { shortDescription, longDescription } = getProductDescription(
        team,
        category.id,
        subcategory
      );

      // Create 1-2 products per team/category/subcategory combination
      const productCount = Math.random() > 0.6 ? 2 : 1;

      for (let i = 0; i < productCount; i++) {
        const basePrice = Math.floor(Math.random() * 150) + 30; // 30-180 USD
        const hasDiscount = Math.random() > 0.7;
        const discountPrice = hasDiscount
          ? Math.floor(basePrice * (0.7 + Math.random() * 0.2))
          : undefined;

        const isNew = Math.random() > 0.8;
        const isFeatured = Math.random() > 0.85;
        const stock = Math.floor(Math.random() * 50) + 1;

        const productSizes =
          category.id === 'footwear'
            ? sizes.footwear.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 6) + 4)
            : category.id === 'accessories'
              ? sizes.accessories
              : sizes.apparel.slice(
                  Math.floor(Math.random() * 2),
                  Math.floor(Math.random() * 4) + 3
                );

        const productColors = colors.slice(0, Math.floor(Math.random() * 4) + 1);

        // Generate images
        const imageCount = Math.floor(Math.random() * 4) + 1;
        const images = Array.from({ length: imageCount }, (_, imgIdx) => ({
          id: `img-${productId}-${imgIdx + 1}`,
          attributes: {
            url: `/uploads/products/${team}/${subcategory}/${productId}_${imgIdx + 1}.jpg`,
            alternativeText: `${shortDescription.line1} - Vista ${imgIdx + 1}`,
            width: 800,
            height: 800,
          },
        }));

        const variant = i > 0 ? ` ${i === 1 ? 'Alternativa' : 'Tercera'}` : '';
        const createdDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);

        productMockData.push({
          id: productId.toString(),
          attributes: {
            name: `${shortDescription.line1}${variant}`,
            slug: `${team}-${subcategory}-${productId}`,
            shortDescription: {
              line1: `${shortDescription.line1}${variant}`,
              line2: shortDescription.line2,
            },
            longDescription,
            price: basePrice,
            discountPrice,
            category: category.id,
            subcategory,
            sport: 'futbol',
            team,
            images: {
              data: images,
            },
            sizes: productSizes,
            colors: productColors,
            stock,
            featured: isFeatured,
            isNew,
            status: 'active' as const,
            createdAt: createdDate.toISOString(),
            updatedAt: createdDate.toISOString(),
          },
        });

        productId++;
      }
    });
  });
});

// Add some basketball and rugby products
['basketball', 'rugby'].forEach((sport) => {
  const teams = uruguayanTeams[sport as keyof typeof uruguayanTeams];
  teams.slice(0, 2).forEach((team) => {
    const { shortDescription, longDescription } = getProductDescription(team, 'apparel', 'jerseys');

    const basePrice = Math.floor(Math.random() * 100) + 40;
    const hasDiscount = Math.random() > 0.8;
    const discountPrice = hasDiscount ? Math.floor(basePrice * 0.8) : undefined;

    productMockData.push({
      id: productId.toString(),
      attributes: {
        name: `${shortDescription.line1} ${sport === 'basketball' ? 'Básquet' : 'Rugby'}`,
        slug: `${team}-${sport}-jersey-${productId}`,
        shortDescription: {
          line1: `${shortDescription.line1} ${sport === 'basketball' ? 'Básquet' : 'Rugby'}`,
          line2: `Temporada 2024`,
        },
        longDescription: `${longDescription} Especializada para ${sport === 'basketball' ? 'básquetbol' : 'rugby'}.`,
        price: basePrice,
        discountPrice,
        category: 'apparel',
        subcategory: 'jerseys',
        sport,
        team,
        images: {
          data: [
            {
              id: `img-${productId}-1`,
              attributes: {
                url: `/uploads/products/${team}/${sport}/jersey_1.jpg`,
                alternativeText: `Camiseta ${team} ${sport}`,
                width: 800,
                height: 800,
              },
            },
          ],
        },
        sizes: sizes.apparel,
        colors: colors.slice(0, 2),
        stock: Math.floor(Math.random() * 30) + 5,
        featured: Math.random() > 0.9,
        isNew: Math.random() > 0.7,
        status: 'active' as const,
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    productId++;
  });
});

// Add some special/limited edition products
const specialProducts = [
  {
    name: 'Camiseta Retro Nacional 1988',
    team: 'nacional',
    description: 'Edición limitada conmemorativa del campeonato de 1988',
    price: 120,
    isNew: false,
    featured: true,
  },
  {
    name: 'Camiseta Centenario Peñarol',
    team: 'penarol',
    description: 'Edición especial por el centenario del club',
    price: 150,
    discountPrice: 120,
    isNew: true,
    featured: true,
  },
  {
    name: 'Kit Completo Selección Uruguay',
    team: 'uruguay',
    description: 'Kit oficial de la Selección Nacional',
    price: 200,
    discountPrice: 160,
    isNew: true,
    featured: true,
  },
];

specialProducts.forEach((special) => {
  const images = Array.from({ length: 3 }, (_, imgIdx) => ({
    id: `special-img-${productId}-${imgIdx + 1}`,
    attributes: {
      url: `/uploads/products/special/${special.team}/kit_${imgIdx + 1}.jpg`,
      alternativeText: `${special.name} - Vista ${imgIdx + 1}`,
      width: 800,
      height: 800,
    },
  }));

  productMockData.push({
    id: productId.toString(),
    attributes: {
      name: special.name,
      slug: `special-${special.team}-${productId}`,
      shortDescription: {
        line1: special.name,
        line2: 'Edición limitada',
      },
      longDescription: `${special.description}. Producto de colección con certificado de autenticidad. Material premium y acabados de lujo.`,
      price: special.price,
      discountPrice: special.discountPrice,
      category: 'apparel',
      subcategory: 'jerseys',
      sport: 'futbol',
      team: special.team,
      images: {
        data: images,
      },
      sizes: sizes.apparel,
      colors: ['Azul', 'Blanco', 'Celeste'],
      stock: Math.floor(Math.random() * 10) + 2, // Limited stock for special items
      featured: special.featured,
      isNew: special.isNew,
      status: 'active' as const,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  productId++;
});

// Add some out of stock products for testing
const outOfStockProducts = productMockData.slice(0, 3).map((product) => ({
  ...product,
  id: `${productId++}`,
  attributes: {
    ...product.attributes,
    name: `${product.attributes.name} (Agotado)`,
    stock: 0,
    status: 'active' as const,
  },
}));

productMockData.push(...outOfStockProducts);

// Utility functions for tests
export const getProductsByCategory = (category: string): MockProduct[] => {
  return productMockData.filter((product) => product.attributes.category === category);
};

export const getProductsByTeam = (team: string): MockProduct[] => {
  return productMockData.filter((product) => product.attributes.team === team);
};

export const getFeaturedProducts = (): MockProduct[] => {
  return productMockData.filter((product) => product.attributes.featured);
};

export const getNewProducts = (): MockProduct[] => {
  return productMockData.filter((product) => product.attributes.isNew);
};

export const getDiscountedProducts = (): MockProduct[] => {
  return productMockData.filter((product) => product.attributes.discountPrice);
};

export const getRandomProduct = (): MockProduct => {
  return productMockData[Math.floor(Math.random() * productMockData.length)];
};

export const searchProducts = (query: string): MockProduct[] => {
  const searchTerm = query.toLowerCase();
  return productMockData.filter(
    (product) =>
      product.attributes.name.toLowerCase().includes(searchTerm) ||
      product.attributes.shortDescription.line1.toLowerCase().includes(searchTerm) ||
      product.attributes.shortDescription.line2.toLowerCase().includes(searchTerm) ||
      product.attributes.team.toLowerCase().includes(searchTerm) ||
      product.attributes.category.toLowerCase().includes(searchTerm)
  );
};

export default productMockData;
