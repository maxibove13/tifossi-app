import { StyleProp, TextStyle, ViewStyle } from 'react-native';

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