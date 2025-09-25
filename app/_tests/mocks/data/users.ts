/**
 * Realistic User Mock Data for Testing
 * Includes Uruguayan addresses, phone numbers, and user profiles
 */

export interface MockAddress {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  number: string;
  apartment?: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  phone?: string;
  isDefault?: boolean;
  addressType?: 'home' | 'work' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  addresses: MockAddress[];
  preferences: {
    favoriteTeams: string[];
    favoriteCategories: string[];
    newsletter: boolean;
    promotions: boolean;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Realistic Uruguayan names
const uruguayanNames = {
  male: [
    'Juan',
    'Carlos',
    'Luis',
    'Fernando',
    'Diego',
    'Pablo',
    'Eduardo',
    'Andrés',
    'Martín',
    'Alejandro',
    'Roberto',
    'Gustavo',
    'Ricardo',
    'Sebastián',
    'Gabriel',
    'Marcelo',
    'Gonzalo',
    'Joaquín',
    'Rodrigo',
    'Nicolás',
    'Mateo',
    'Santiago',
    'Facundo',
    'Agustín',
    'Ignacio',
    'Valentín',
    'Thiago',
    'Bruno',
    'Emilio',
  ],
  female: [
    'María',
    'Ana',
    'Lucía',
    'Carmen',
    'Isabel',
    'Elena',
    'Beatriz',
    'Sofía',
    'Valentina',
    'Camila',
    'Victoria',
    'Esperanza',
    'Magdalena',
    'Francisca',
    'Carolina',
    'Gabriela',
    'Patricia',
    'Monica',
    'Claudia',
    'Laura',
    'Andrea',
    'Fernanda',
    'Natalia',
    'Romina',
    'Florencia',
    'Antonella',
    'Micaela',
    'Belén',
  ],
};

const uruguayanLastNames = [
  'González',
  'Rodríguez',
  'Fernández',
  'López',
  'Martínez',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Torres',
  'Flores',
  'Rivera',
  'Gómez',
  'Díaz',
  'Morales',
  'Herrera',
  'Silva',
  'Castro',
  'Vargas',
  'Ramos',
  'Jiménez',
  'Méndez',
  'Rocha',
  'Suárez',
  'Viera',
  'Olivera',
  'Núñez',
  'Álvarez',
  'Ruiz',
  'Ortega',
  'Delgado',
  'Blanco',
  'Vázquez',
  'Guerrero',
  'Medina',
  'Acosta',
  'Aguilar',
  'Cabrera',
  'Pereira',
  'Machado',
  'Cardoso',
  'Bentancur',
  'Barreto',
  'Techera',
  'Cavani',
  'Godín',
];

// Uruguayan cities and neighborhoods
const uruguayanLocations = {
  montevideo: {
    neighborhoods: [
      'Ciudad Vieja',
      'Centro',
      'Barrio Sur',
      'Cordón',
      'Palermo',
      'Parque Rodó',
      'La Comercial',
      'Tres Cruces',
      'Pocitos',
      'Punta Carretas',
      'Carrasco',
      'Malvín',
      'Buceo',
      'La Blanqueada',
      'Villa Dolores',
      'Unión',
      'Maroñas',
      'Paso de la Arena',
      'Cerro',
      'La Teja',
      'Peñarol',
      'Sayago',
      'Prado',
      'Capurro',
      'Reducto',
      'Brazo Oriental',
      'Jacinto Vera',
      'Larrañaga',
      'Villa Española',
      'Ituzaingó',
      'Flor de Maroñas',
      'Casavalle',
    ],
  },
  interior: [
    { city: 'Salto', department: 'Salto' },
    { city: 'Paysandú', department: 'Paysandú' },
    { city: 'Rivera', department: 'Rivera' },
    { city: 'Maldonado', department: 'Maldonado' },
    { city: 'Tacuarembó', department: 'Tacuarembó' },
    { city: 'Melo', department: 'Cerro Largo' },
    { city: 'Artigas', department: 'Artigas' },
    { city: 'Mercedes', department: 'Soriano' },
    { city: 'Minas', department: 'Lavalleja' },
    { city: 'San José', department: 'San José' },
    { city: 'Durazno', department: 'Durazno' },
    { city: 'Florida', department: 'Florida' },
    { city: 'Treinta y Tres', department: 'Treinta y Tres' },
    { city: 'Rocha', department: 'Rocha' },
    { city: 'Colonia', department: 'Colonia' },
    { city: 'Carmelo', department: 'Colonia' },
    { city: 'Punta del Este', department: 'Maldonado' },
    { city: 'Las Piedras', department: 'Canelones' },
    { city: 'Canelones', department: 'Canelones' },
  ],
};

// Common Uruguayan street names
const uruguayanStreets = [
  'Avenida 18 de Julio',
  'Bulevar Artigas',
  'Avenida Italia',
  'Rambla República Argentina',
  'Avenida Brasil',
  'Constituyente',
  'Colonia',
  '8 de Octubre',
  'Rivera',
  'Yaguarón',
  'Arenal Grande',
  'Canelones',
  'Ejido',
  'Paraguay',
  'Galicia',
  'Tristán Narvaja',
  'Durazno',
  'Cuareim',
  'Andes',
  'Jackson',
  'Mercedes',
  'Paysandú',
  'Maldonado',
  'San José',
  'Zelmar Michelini',
  'Luis Alberto de Herrera',
  'Millán',
  'Propios',
  'Bulevar España',
  'Rondeau',
  'Florida',
  'Cerrito',
  'Julio Herrera y Obes',
  'Doctor Aquiles R. Lanza',
  'Juan Benito Blanco',
  'Francisco Muñoz',
  'Magallanes',
  'Avenida General Flores',
  'Avenida Agraciada',
  'Carlos Vaz Ferreira',
  'Pablo de María',
];

// Companies for work addresses
const uruguayanCompanies = [
  'UTE',
  'ANTEL',
  'Banco República',
  'Banco Santander',
  'ANCAP',
  'OSE',
  'Conaprole',
  'Frigorífico Tacuarembó',
  'Mondelez Uruguay',
  'Coca-Cola Uruguay',
  'Farmashop',
  'Ta-Ta',
  'Tienda Inglesa',
  'Devoto',
  'Macro Mercado',
  'Consultora PwC',
  'Deloitte Uruguay',
  'Tata Consultancy Services',
  'Globant',
  'Hospital de Clínicas',
  'Hospital Británico',
  'Asociación Española',
  'Universidad de la República',
  'Universidad Católica',
  'Universidad ORT',
];

// Generate realistic phone numbers (Uruguayan format)
const generateUruguayanPhone = (): string => {
  const mobile = Math.random() > 0.3; // 70% mobile, 30% landline
  if (mobile) {
    // Mobile: 099 123 456 or 094 123 456
    const prefix = Math.random() > 0.5 ? '099' : '094';
    const number = Math.floor(Math.random() * 900000) + 100000;
    return `+598 ${prefix} ${number.toString().substring(0, 3)} ${number.toString().substring(3)}`;
  } else {
    // Landline: 2 XXX XXXX (Montevideo area code)
    const number = Math.floor(Math.random() * 9000000) + 1000000;
    return `+598 2 ${number.toString().substring(0, 3)} ${number.toString().substring(3, 7)}`;
  }
};

// Generate realistic address
const generateAddress = (userId: number, addressIndex: number): MockAddress => {
  const isMontevideoAddress = Math.random() > 0.3; // 70% Montevideo, 30% interior
  const firstName =
    Math.random() > 0.5
      ? uruguayanNames.male[Math.floor(Math.random() * uruguayanNames.male.length)]
      : uruguayanNames.female[Math.floor(Math.random() * uruguayanNames.female.length)];
  const lastName = uruguayanLastNames[Math.floor(Math.random() * uruguayanLastNames.length)];

  let city: string, state: string | undefined, zipCode: string;

  if (isMontevideoAddress) {
    city =
      uruguayanLocations.montevideo.neighborhoods[
        Math.floor(Math.random() * uruguayanLocations.montevideo.neighborhoods.length)
      ];
    state = 'Montevideo';
    zipCode = `11${Math.floor(Math.random() * 900) + 100}`; // Montevideo postal codes start with 11
  } else {
    const interiorLocation =
      uruguayanLocations.interior[Math.floor(Math.random() * uruguayanLocations.interior.length)];
    city = interiorLocation.city;
    state = interiorLocation.department;
    zipCode = `${Math.floor(Math.random() * 89) + 10}000`; // Interior postal codes
  }

  const street = uruguayanStreets[Math.floor(Math.random() * uruguayanStreets.length)];
  const number = Math.floor(Math.random() * 9999) + 1;
  const hasApartment = Math.random() > 0.6;
  const apartment = hasApartment
    ? `${Math.floor(Math.random() * 20) + 1}${Math.random() > 0.5 ? 'A' : 'B'}`
    : undefined;

  const addressTypes: ('home' | 'work' | 'other')[] = ['home', 'work', 'other'];
  const addressType = addressTypes[Math.floor(Math.random() * addressTypes.length)];

  const company =
    addressType === 'work'
      ? uruguayanCompanies[Math.floor(Math.random() * uruguayanCompanies.length)]
      : undefined;

  const createdDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

  return {
    id: `addr_${userId}_${addressIndex}`,
    firstName,
    lastName,
    company,
    street,
    number: number.toString(),
    apartment,
    city,
    state,
    country: 'Uruguay',
    zipCode,
    phone: generateUruguayanPhone(),
    isDefault: addressIndex === 0, // First address is default
    addressType,
    notes: addressType === 'work' ? 'Horario de oficina: 9-17hs' : undefined,
    createdAt: createdDate.toISOString(),
    updatedAt: createdDate.toISOString(),
  };
};

// Generate mock users
export const userMockData: MockUser[] = [];

const teams = ['nacional', 'penarol', 'defensor', 'wanderers', 'danubio', 'uruguay'];
const categories = ['apparel', 'accessories', 'footwear', 'equipment'];

for (let i = 1; i <= 50; i++) {
  const isWoman = Math.random() > 0.5;
  const firstName = isWoman
    ? uruguayanNames.female[Math.floor(Math.random() * uruguayanNames.female.length)]
    : uruguayanNames.male[Math.floor(Math.random() * uruguayanNames.male.length)];
  const lastName = uruguayanLastNames[Math.floor(Math.random() * uruguayanLastNames.length)];

  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('ñ', 'n')}${i}@${
    Math.random() > 0.5
      ? 'gmail.com'
      : Math.random() > 0.5
        ? 'hotmail.com'
        : Math.random() > 0.5
          ? 'outlook.com'
          : 'yahoo.com'
  }`;

  // Generate 1-3 addresses per user
  const addressCount = Math.floor(Math.random() * 3) + 1;
  const addresses = Array.from({ length: addressCount }, (_, idx) => generateAddress(i, idx));

  const createdDate = new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000); // Up to 2 years ago
  const lastLoginDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Within last 30 days

  const user: MockUser = {
    id: i,
    firstName,
    lastName,
    email,
    phone: generateUruguayanPhone(),
    profilePicture: Math.random() > 0.7 ? `/uploads/profiles/user_${i}_avatar.jpg` : undefined,
    isEmailVerified: Math.random() > 0.1, // 90% verified
    addresses,
    preferences: {
      favoriteTeams: teams.slice(0, Math.floor(Math.random() * 3) + 1), // 1-3 favorite teams
      favoriteCategories: categories.slice(0, Math.floor(Math.random() * 2) + 1), // 1-2 categories
      newsletter: Math.random() > 0.3, // 70% subscribed to newsletter
      promotions: Math.random() > 0.4, // 60% accept promotions
    },
    createdAt: createdDate.toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: lastLoginDate.toISOString(),
  };

  userMockData.push(user);
}

// Add some specific test users with known credentials
const testUsers: MockUser[] = [
  {
    id: 100,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@tifossi.com',
    phone: '+598 099 123 456',
    isEmailVerified: true,
    addresses: [
      {
        id: 'addr_100_0',
        firstName: 'Test',
        lastName: 'User',
        street: 'Avenida 18 de Julio',
        number: '1234',
        apartment: '5A',
        city: 'Centro',
        state: 'Montevideo',
        country: 'Uruguay',
        zipCode: '11100',
        phone: '+598 099 123 456',
        isDefault: true,
        addressType: 'home',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    preferences: {
      favoriteTeams: ['nacional', 'uruguay'],
      favoriteCategories: ['apparel', 'accessories'],
      newsletter: true,
      promotions: true,
    },
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 101,
    firstName: 'Admin',
    lastName: 'Tifossi',
    email: 'admin@tifossi.com',
    phone: '+598 094 987 654',
    profilePicture: '/uploads/profiles/admin_avatar.jpg',
    isEmailVerified: true,
    addresses: [
      {
        id: 'addr_101_0',
        firstName: 'Admin',
        lastName: 'Tifossi',
        company: 'Tifossi Uruguay',
        street: 'Bulevar Artigas',
        number: '5678',
        city: 'Pocitos',
        state: 'Montevideo',
        country: 'Uruguay',
        zipCode: '11300',
        phone: '+598 094 987 654',
        isDefault: true,
        addressType: 'work',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    preferences: {
      favoriteTeams: ['nacional', 'penarol', 'uruguay'],
      favoriteCategories: ['apparel', 'accessories', 'footwear'],
      newsletter: true,
      promotions: false,
    },
    createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 102,
    firstName: 'Regular',
    lastName: 'Usuario',
    email: 'user@tifossi.com',
    phone: '+598 2 555 1234',
    isEmailVerified: false, // Unverified for testing
    addresses: [
      {
        id: 'addr_102_0',
        firstName: 'Regular',
        lastName: 'Usuario',
        street: 'Canelones',
        number: '999',
        city: 'Cordón',
        state: 'Montevideo',
        country: 'Uruguay',
        zipCode: '11200',
        isDefault: true,
        addressType: 'home',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'addr_102_1',
        firstName: 'Regular',
        lastName: 'Usuario',
        company: 'Banco República',
        street: 'Cerrito',
        number: '351',
        city: 'Ciudad Vieja',
        state: 'Montevideo',
        country: 'Uruguay',
        zipCode: '11000',
        phone: '+598 2 1234 5678',
        isDefault: false,
        addressType: 'work',
        notes: 'Entrada por Plaza Independencia',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    preferences: {
      favoriteTeams: ['penarol'],
      favoriteCategories: ['apparel'],
      newsletter: false,
      promotions: true,
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

userMockData.push(...testUsers);

// Utility functions
export const getUserById = (id: number): MockUser | undefined => {
  return userMockData.find((user) => user.id === id);
};

export const getUserByEmail = (email: string): MockUser | undefined => {
  return userMockData.find((user) => user.email.toLowerCase() === email.toLowerCase());
};

export const getRandomUser = (): MockUser => {
  return userMockData[Math.floor(Math.random() * userMockData.length)];
};

export const getUsersByTeam = (team: string): MockUser[] => {
  return userMockData.filter((user) => user.preferences.favoriteTeams.includes(team));
};

export const getUsersFromCity = (city: string): MockUser[] => {
  return userMockData.filter((user) =>
    user.addresses.some((address) => address.city.toLowerCase().includes(city.toLowerCase()))
  );
};

export const getVerifiedUsers = (): MockUser[] => {
  return userMockData.filter((user) => user.isEmailVerified);
};

export const getUnverifiedUsers = (): MockUser[] => {
  return userMockData.filter((user) => !user.isEmailVerified);
};

export const getUsersWithMultipleAddresses = (): MockUser[] => {
  return userMockData.filter((user) => user.addresses.length > 1);
};

// Address utility functions
export const generateNewAddress = (userId: number): MockAddress => {
  const user = getUserById(userId);
  const addressIndex = user ? user.addresses.length : 0;
  return generateAddress(userId, addressIndex);
};

export const validateUruguayanPhone = (phone: string): boolean => {
  // Simple validation for Uruguayan phone numbers
  const phoneRegex = /^\+598\s?(2|09[0-9])\s?\d{3}\s?\d{3,4}$/;
  return phoneRegex.test(phone);
};

export const validateUruguayanZipCode = (zipCode: string): boolean => {
  // Uruguayan postal codes are 5 digits
  const zipRegex = /^\d{5}$/;
  return zipRegex.test(zipCode);
};

export default userMockData;
