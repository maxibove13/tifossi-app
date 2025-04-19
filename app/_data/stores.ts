import { StoreDetails } from '../_types';

// Placeholder data (replace with actual data fetching/logic)
export const storesData: StoreDetails[] = [
  {
    id: 'centro_mvd',
    cityId: 'mvd',
    zoneId: 'centro',
    name: 'Centro',
    address: 'Wilson Ferreira Aldunate 1341, esq. 18 de Julio.',
    hours: 'Lun. a Vier. 11:00 - 19:00 hs.\nSab. 10:00 - 14:00 hs.',
    image: require('../../assets/images/locations/centro.png'), // Updated path
  },
  {
    id: 'plaza_italia_mvd', // New ID
    cityId: 'mvd',
    zoneId: 'plaza_italia', // New Zone ID
    name: 'Plaza Italia Shopping', // New Name
    address: 'Av. Italia XXXX - Piso 3, Local 14', // New Address from screenshot
    hours: 'Lun. a Vier. 11:00 - 19:00 hs.\nSab. 10:00 - 14:00 hs.', // New Hours from screenshot
    image: require('../../assets/images/locations/montevideo.png'), // Using existing Montevideo image
  },
  {
    id: 'punta_del_este_pde', // Updated ID for clarity
    cityId: 'pde',
    zoneId: 'punta_del_este', // Updated Zone ID for clarity
    name: 'Punta del Este', // Updated Name
    address: 'Box Garden, Piso 3 - Parada 2, Playa Mansa.', // Updated Address from screenshot
    hours: 'Lun. a Sab. 12:00 - 16:00 hs. | 20:00 - 00:00 hs.\nDom. 20:00 - 00:00 hs.', // Updated Hours from screenshot
    image: require('../../assets/images/locations/punta_del_este.png'), // Using existing PDE image
  },
  // Add other stores here if needed
];

// Add default export to fix router warnings
const storesDataExport = {
  name: 'StoresData',
  version: '1.0.0',
};

export default storesDataExport;
