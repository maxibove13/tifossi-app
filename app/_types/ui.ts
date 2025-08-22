import { StyleProp, TextStyle, ViewStyle, LayoutChangeEvent } from 'react-native';

// Base component props
export interface BaseComponentProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Text component props
export interface TextComponentProps {
  style?: StyleProp<TextStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  onPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'text' | 'outlined';
  size?: 'small' | 'medium' | 'large';
}

export interface IconProps extends BaseComponentProps {
  size?: number;
  color?: string;
}

export interface FormControlProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface InputProps extends FormControlProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export type Orientation = 'horizontal' | 'vertical';

// React Native Event Types
export type RNLayoutChangeEvent = LayoutChangeEvent;
// export type RNNativeSyntheticEvent<T = {}> = NativeSyntheticEvent<T>; // Commented out - unused

// Error types for better error handling
export interface ErrorWithMessage {
  message: string;
  code?: string | number;
  details?: unknown;
}

export type UnknownError = Error | ErrorWithMessage | string | unknown;

// Test Component Types
export interface TestCartItem {
  id: string;
  product: {
    title?: string;
    name?: string;
    [key: string]: unknown;
  };
  quantity: number;
  price: number;
  productId?: string;
  variantId?: string;
  addedAt?: string;
  [key: string]: unknown;
}

export interface CartItemProps {
  item: TestCartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export interface CartSummaryProps {
  items: TestCartItem[];
  tax: number;
  shipping: number;
  onCheckout: () => void;
}

export interface EmptyCartProps {
  onStartShopping: () => void;
}

export interface CartScreenProps {
  items?: TestCartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export interface CartBadgeProps {
  itemCount: number;
}

// Generic Test Component Types
export interface BasicProductProps {
  product: {
    id: string;
    title?: string;
    name?: string;
    price: number;
    originalPrice?: number;
    [key: string]: unknown;
  };
  onPress: () => void;
  onFavorite?: (id: string) => void;
}

export interface SearchInputProps {
  onSearch: (query: string) => void;
  value: string;
}

export interface FormWithValidationProps {
  onSubmit: (data: any) => void;
}

export interface CategoryItemProps {
  title: string;
  count: number;
  isActive?: boolean;
  onPress: () => void;
}

export interface AccessibleButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  testID?: string;
}

// Additional test component types
export interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface SelectDropdownProps {
  value: string;
  placeholder: string;
  options: Array<{ label: string; value: string }>;
  onSelect: (value: string) => void;
}

export interface RadioGroupProps {
  value: string;
  options: Array<{ label: string; value: string }>;
  onSelect: (value: string) => void;
}

export interface CheckboxGroupProps {
  values: string[];
  options: Array<{ label: string; value: string }>;
  onToggle: (value: string) => void;
}

export interface SwipeableProductCardProps {
  product: BasicProductProps['product'];
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
}

export interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface KeyboardShortcutProps {
  onSearch: () => void;
  onHome: () => void;
  onCart: () => void;
}

// Add default export to fix router warnings
const uiTypes = {
  name: 'UITypes',
  version: '1.0.0',
};

export default uiTypes;
