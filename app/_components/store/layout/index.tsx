import StoreHeader from './Header';
import CategoryButtons from './Categories';
import BrandFooter from './Footer';
import StoreLocations from './Locations';
import CategoryShowcase from './CategoryShowcase';

export { 
  StoreHeader,
  CategoryButtons,
  BrandFooter,
  StoreLocations,
  CategoryShowcase,
};

const StoreLayout = {
  StoreHeader,
  CategoryButtons,
  BrandFooter,
  StoreLocations,
  CategoryShowcase,
};

// Ensure this component is not treated as a route
export default StoreLayout;

// Add metadata to help router identification
const metadata = {
  isRoute: false,
  componentType: 'Component'
};