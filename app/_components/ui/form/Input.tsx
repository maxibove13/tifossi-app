import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  startIcon?: keyof typeof Ionicons.glyphMap;
  endIcon?: keyof typeof Ionicons.glyphMap;
  onEndIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = ({
  label,
  error,
  helper,
  startIcon,
  endIcon,
  onEndIconPress,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, error && styles.labelError]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {startIcon && (
          <Ionicons
            name={startIcon}
            size={20}
            color={error ? '#AD3026' : isFocused ? '#0C0C0C' : '#707070'}
            style={styles.startIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            startIcon && styles.inputWithStartIcon,
            endIcon && styles.inputWithEndIcon,
          ]}
          placeholderTextColor="#909090"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {endIcon && (
          <Ionicons
            name={endIcon}
            size={20}
            color={error ? '#AD3026' : isFocused ? '#0C0C0C' : '#707070'}
            style={styles.endIcon}
            onPress={onEndIconPress}
          />
        )}
      </View>

      {(error || helper) && (
        <Text style={[styles.helper, error && styles.error]}>{error || helper}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#0C0C0C',
    marginBottom: 4,
  },
  labelError: {
    color: '#AD3026',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  inputContainerFocused: {
    borderColor: '#0C0C0C',
  },
  inputContainerError: {
    borderColor: '#AD3026',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#0C0C0C',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWithStartIcon: {
    paddingLeft: 8,
  },
  inputWithEndIcon: {
    paddingRight: 8,
  },
  startIcon: {
    marginLeft: 12,
  },
  endIcon: {
    marginRight: 12,
  },
  helper: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    color: '#707070',
    marginTop: 4,
  },
  error: {
    color: '#AD3026',
  },
});

export default Input;
