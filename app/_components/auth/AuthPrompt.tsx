import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../_styles/colors';
import { spacing, radius } from '../../_styles/spacing';
import { fonts, fontSizes, lineHeights } from '../../_styles/typography';

interface ReusableAuthPromptProps {
  message: string;
  loginButtonText?: string;
  signupButtonText?: string;
  onLoginPress?: () => void;
  onSignupPress?: () => void;
  style?: StyleProp<ViewStyle>;
  messageStyle?: StyleProp<TextStyle>;
  loginButtonStyle?: StyleProp<ViewStyle>;
  loginButtonTextStyle?: StyleProp<TextStyle>;
  signupButtonStyle?: StyleProp<ViewStyle>;
  signupButtonTextStyle?: StyleProp<TextStyle>;
}

const ReusableAuthPrompt: React.FC<ReusableAuthPromptProps> = ({
  message,
  loginButtonText = 'Iniciar sesión',
  signupButtonText = 'Registrarse',
  onLoginPress,
  onSignupPress,
  style,
  messageStyle,
  loginButtonStyle,
  loginButtonTextStyle,
  signupButtonStyle,
  signupButtonTextStyle,
}) => {
  const handleLogin = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      router.push('/auth/login');
    }
  };

  const handleSignup = () => {
    if (onSignupPress) {
      onSignupPress();
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/background_image_profile.png')}
      style={[styles.backgroundImage, style]}
      imageStyle={styles.backgroundImageStyle}
    >
      <View style={styles.backgroundOverlay} />
      <View style={styles.authCard}>
        <Text style={[styles.authText, messageStyle]}>{message}</Text>
        <View style={styles.authButtonsContainer}>
          <TouchableOpacity
            style={[styles.loginButton, loginButtonStyle]}
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <Text style={[styles.loginButtonText, loginButtonTextStyle]}>{loginButtonText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.registerButton, signupButtonStyle]}
            onPress={handleSignup}
            activeOpacity={0.7}
          >
            <Text style={[styles.registerButtonText, signupButtonTextStyle]}>
              {signupButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    paddingVertical: spacing.lg,
    width: '100%',
    overflow: 'hidden',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 12, 12, 0.7)',
  },
  authCard: {
    justifyContent: 'space-between',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  authText: {
    fontFamily: fonts.secondary,
    fontWeight: '400',
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.background.offWhite,
    textAlign: 'center',
    width: '100%',
  },
  authButtonsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  loginButton: {
    backgroundColor: colors.background.offWhite25,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontFamily: fonts.secondary,
    fontWeight: '500',
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.background.offWhite,
    textAlign: 'center',
  },
  registerButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontFamily: fonts.secondary,
    fontWeight: '400',
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.background.offWhite,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default ReusableAuthPrompt;
