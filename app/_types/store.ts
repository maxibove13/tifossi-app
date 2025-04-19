import { ImageSourcePropType } from 'react-native';

// Define the structure for store details
export interface StoreDetails {
  id: string;
  cityId: string; // Link to City ID
  zoneId: string; // Link to Zone ID
  name: string; // Store name or identifier within the zone
  address: string;
  hours: string;
  image: ImageSourcePropType; // Use ImageSourcePropType for require()
}

// Add default export to fix router warnings
const storeTypesExport = {
  name: 'StoreTypes',
  version: '1.0.0',
};

export default storeTypesExport;
