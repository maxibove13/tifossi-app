import { Product } from './product';

export type RootTabParamList = {
  home: undefined;
  product: { product: Product };
  favorites: undefined;
  cart: undefined;
  profile: undefined;
  tiffosiExplore: undefined;
};

export type RootStackParamList = {
  '(tabs)': undefined;
  '(home)': undefined;
  cart: undefined;
  product: { product: Product };
  'not-found': undefined;
};

export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export interface NavigationItem {
  label: string;
  icon: any;
  onPress: () => void;
  badge?: number;
}

export interface CategoryNavigationItem {
  id: string;
  name: string;
  isActive?: boolean;
  onPress: () => void;
}