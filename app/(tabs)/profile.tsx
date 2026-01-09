import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Alert,
  Modal,
  Linking,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { spacing, radius, components } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';
import Input from '../_components/ui/form/Input';
import { useAuthStore } from '../_stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import SplashScreen from '../_components/splash/SplashScreen';
import { APPLE_AUTH_ERRORS_ES } from '../_types/auth';
import { UnknownError } from '../_types/ui';

const GoogleLogo = require('../../assets/icons/google-logo.png');
const AppleLogo = require('../../assets/icons/apple-logo.png');

const backgroundImage = require('../../assets/images/background_image_profile.png');

function getErrorMessage(error: UnknownError): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Error desconocido. Intenta nuevamente.';
}

interface ProfileListItemProps {
  IconComponent: React.FC<any>;
  text: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const ProfileListItem: React.FC<ProfileListItemProps> = ({
  IconComponent,
  text,
  onPress,
  style,
  textStyle,
}) => (
  <TouchableOpacity style={[styles.listItemContainer, style]} onPress={onPress}>
    <Text style={[styles.listItemText, textStyle]}>{text}</Text>
    <IconComponent width={24} height={24} stroke={colors.primary} strokeWidth={1.2} />
  </TouchableOpacity>
);

const LogoutButton = () => {
  const logout = useAuthStore((state) => state.logout);
  const [showSplashScreen, setShowSplashScreen] = useState(false);

  useEffect(() => {
    const performLogout = async () => {
      if (showSplashScreen) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          await logout();
          router.replace('/(home)');
        } catch {
          setShowSplashScreen(false);
          Alert.alert('Error', 'No se pudo cerrar sesión. Intenta nuevamente.');
        }
      }
    };

    if (showSplashScreen) {
      performLogout();
    }
  }, [showSplashScreen, logout]);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => {
          setShowSplashScreen(true);
        },
      },
    ]);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.logoutButtonContainer}
        onPress={handleLogout}
        disabled={showSplashScreen}
      >
        <View style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          <Feather name="log-out" size={24} color={colors.error} />
        </View>
      </TouchableOpacity>

      {showSplashScreen && (
        <Modal transparent={false} visible={true} animationType="fade">
          <SplashScreen onComplete={() => {}} />
        </Modal>
      )}
    </>
  );
};

const DeleteAccountButton = () => {
  const { user } = useAuthStore(useShallow((state) => ({ user: state.user })));
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplashScreen, setShowSplashScreen] = useState(false);

  // Provider detection - used for UI decision (show password modal or not)
  const provider = user?.metadata?.provider || 'email';

  const handleDeletePress = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción es irreversible. Se eliminarán tus datos personales. El historial de pedidos se mantendrá de forma anónima por razones legales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Cuenta',
          style: 'destructive',
          onPress: () => (provider === 'email' ? setShowPasswordModal(true) : performDeletion()),
        },
      ]
    );
  };

  const performDeletion = async (passwordInput?: string) => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteAccount(passwordInput);

    if (result.success) {
      setShowSplashScreen(true);
      setTimeout(() => router.replace('/(home)'), 500);
    } else {
      setIsDeleting(false);
      if (result.error === 'cancelled') return;
      setError(result.error || 'Error al eliminar la cuenta');
      if (!showPasswordModal) {
        Alert.alert('Error', result.error || 'No se pudo eliminar la cuenta');
      }
    }
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) {
      setError('Por favor, ingresa tu contraseña');
      return;
    }
    performDeletion(password);
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setError(null);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.deleteAccountButtonContainer}
        onPress={handleDeletePress}
        disabled={isDeleting}
      >
        <View style={styles.deleteAccountButton}>
          <Text style={styles.deleteAccountButtonText}>Eliminar Cuenta</Text>
          <Feather name="trash-2" size={24} color={colors.error} />
        </View>
      </TouchableOpacity>

      {/* Password confirmation modal for email users */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Eliminación</Text>
            <Text style={styles.modalDescription}>Ingresa tu contraseña para confirmar.</Text>

            <Input
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              error={error || undefined}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeModal}
                disabled={isDeleting}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDeleteButton,
                  (isDeleting || !password.trim()) && styles.disabledButton,
                ]}
                onPress={handlePasswordSubmit}
                disabled={isDeleting || !password.trim()}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.background.offWhite} />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showSplashScreen && (
        <Modal transparent={false} visible={true} animationType="fade">
          <SplashScreen onComplete={() => {}} />
        </Modal>
      )}
    </>
  );
};

const LoggedInProfileCard = () => {
  const currentUser = useAuthStore((state) => state.user);

  const displayName = currentUser?.name || 'Usuario';
  const displayEmail = currentUser?.email || '';
  const profilePicture = currentUser?.profilePicture;

  return (
    <View style={styles.profileCard}>
      {profilePicture ? (
        <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
      ) : (
        <View style={styles.profileIconContainer}>
          <Feather name="user" size={32} color={colors.secondary} />
        </View>
      )}
      <Text style={styles.userName}>{displayName}</Text>
      {displayEmail ? <Text style={styles.userEmail}>{displayEmail}</Text> : null}
    </View>
  );
};

const LoggedOutLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appleError, setAppleError] = useState<string | null>(null);

  const login = useAuthStore((state: any) => state.login);
  const loginWithGoogle = useAuthStore((state: any) => state.loginWithGoogle);
  const loginWithApple = useAuthStore((state: any) => state.loginWithApple);
  const isLoading = useAuthStore((state: any) => state.isLoading);
  const authError = useAuthStore((state: any) => state.error);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      setIsSubmitting(false);
      return;
    }
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login({ email, password });

      if (result.needsEmailVerification) {
        router.push({
          pathname: '/auth/verification-code',
          params: { email },
        });
      }
    } catch (error: UnknownError) {
      setError(getErrorMessage(error) || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithGoogle();

      if (result.needsEmailVerification) {
        router.push({
          pathname: '/auth/verification-code',
          params: { email: result.user?.email || '' },
        });
      }
    } catch (error: UnknownError) {
      const errorMessage = getErrorMessage(error);

      if (
        errorMessage.includes('cancel') ||
        errorMessage.includes('Cancel') ||
        errorMessage.includes('cancelado') ||
        errorMessage.includes('dismissed')
      ) {
        return;
      }

      setError(errorMessage || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    setAppleError(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithApple();

      if (result.needsEmailVerification) {
        router.push({
          pathname: '/auth/verification-code',
          params: { email: result.user?.email || '' },
        });
      }
    } catch (error: UnknownError) {
      const errorObj = error && typeof error === 'object' ? (error as any) : {};
      const errorCode = errorObj?.code || errorObj?.name || 'unknown-error';
      const errorMessage = getErrorMessage(error) || APPLE_AUTH_ERRORS_ES.ERROR_UNKNOWN;

      if (
        errorCode.includes('canceled') ||
        errorCode.includes('cancel') ||
        errorMessage.includes('cancelado')
      ) {
        return;
      }

      setAppleError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.loginScrollView}
      contentContainerStyle={styles.loginScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Frame 191: Form Section */}
      <View style={styles.formSection}>
        {/* Frame 249: Inputs + Buttons with 32px gap */}
        <View style={styles.inputsAndButtonsContainer}>
          {/* Frame 246: Inputs */}
          <View style={styles.inputsContainer}>
            <Input
              placeholder="Correo Electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              error={
                (error && error.includes('correo')) || (authError && authError.includes('email'))
                  ? (error ?? authError ?? undefined)
                  : undefined
              }
            />
            <Input
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              error={
                (error && error.includes('contraseña')) ||
                (authError && authError.includes('password'))
                  ? (error ?? authError ?? undefined)
                  : undefined
              }
            />
          </View>

          {/* General error message */}
          {((error &&
            !error.includes('correo') &&
            !error.includes('contraseña') &&
            !error.includes('Por favor, completa')) ||
            (authError && !authError.includes('email') && !authError.includes('password'))) && (
            <Text style={styles.errorText}>{error || authError}</Text>
          )}
          {appleError && <Text style={styles.errorText}>{appleError}</Text>}

          {/* Frame 245: Button + Forgot Password */}
          <View style={styles.buttonAndForgotContainer}>
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isSubmitting || isLoading}
              style={styles.primaryButtonWrapper}
            >
              <LinearGradient
                colors={
                  isSubmitting || isLoading
                    ? colors.button.disabledGradient
                    : colors.button.defaultGradient
                }
                style={styles.primaryButton}
              >
                {isSubmitting || isLoading ? (
                  <ActivityIndicator size="small" color={colors.background.offWhite} />
                ) : (
                  <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => router.push('/auth/forgot-password')}
              activeOpacity={0.7}
              disabled={isSubmitting || isLoading}
            >
              <View style={styles.underlinedTextContainer}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                <View style={styles.textUnderline} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
        </View>

        {/* Frame 190: Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
            onPress={handleGoogleLogin}
            activeOpacity={0.7}
            disabled={isSubmitting || isLoading}
          >
            <Text style={styles.socialButtonText}>Continuar con Google</Text>
            <Image source={GoogleLogo} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, (isSubmitting || isLoading) && styles.disabledButton]}
              onPress={handleAppleLogin}
              activeOpacity={0.7}
              disabled={isSubmitting || isLoading}
            >
              <Text style={styles.socialButtonText}>Continuar con Apple</Text>
              <Image source={AppleLogo} style={{ width: 15, height: 20 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Frame 247: Register Section */}
      <View style={styles.registerSection}>
        <Text style={styles.registerPromptText}>¿No tienes una cuenta?</Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/signup')}
          activeOpacity={0.7}
          disabled={isSubmitting || isLoading}
          style={{ marginTop: spacing.sm }}
        >
          <View style={styles.underlinedTextContainer}>
            <Text style={styles.registerLinkText}>Regístrate</Text>
            <View style={styles.textUnderline} />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default function ProfileScreen() {
  const { isLoggedIn, user } = useAuthStore(
    useShallow((state) => ({
      isLoggedIn: state.isLoggedIn,
      user: state.user,
    }))
  );

  const isEmailUser = !user?.metadata?.provider || user.metadata.provider === 'email';

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <LoggedOutLoginForm />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage}
        style={styles.profileCardBackground}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.backgroundOverlay} />
        <LoggedInProfileCard />
      </ImageBackground>

      <View style={styles.actionButtonsContainer}>
        <ProfileListItem
          IconComponent={() => <Feather name="package" size={24} color={colors.primary} />}
          text="Mis Pedidos"
          onPress={() => router.push('/profile/orders')}
        />
        <ProfileListItem
          IconComponent={() => <Feather name="map-pin" size={24} color={colors.primary} />}
          text="Direcciones de Envío"
          onPress={() => router.push('/profile/addresses')}
        />
        {isEmailUser && (
          <ProfileListItem
            IconComponent={() => <Feather name="lock" size={24} color={colors.primary} />}
            text="Cambiar Contraseña"
            onPress={() => router.push('/profile/change-password')}
          />
        )}
        <ProfileListItem
          IconComponent={() => <Feather name="shield" size={24} color={colors.primary} />}
          text="Política de Privacidad"
          onPress={() => {
            const privacyUrl =
              Constants.expoConfig?.extra?.privacyPolicyUrl ||
              'https://tifossi-strapi-backend.onrender.com/privacy.html';
            Linking.openURL(privacyUrl).catch(() => {
              Alert.alert('Error', 'No se pudo abrir la política de privacidad.');
            });
          }}
        />
        <LogoutButton />
        <DeleteAccountButton />
      </View>
    </View>
  );
}

type Styles = {
  container: ViewStyle;
  loginScrollView: ViewStyle;
  loginScrollContent: ViewStyle;
  formSection: ViewStyle;
  inputsAndButtonsContainer: ViewStyle;
  inputsContainer: ViewStyle;
  buttonAndForgotContainer: ViewStyle;
  errorText: TextStyle;
  primaryButtonWrapper: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  forgotPasswordButton: ViewStyle;
  forgotPasswordText: TextStyle;
  underlinedTextContainer: ViewStyle;
  textUnderline: ViewStyle;
  dividerContainer: ViewStyle;
  divider: ViewStyle;
  socialButtonsContainer: ViewStyle;
  socialButton: ViewStyle;
  socialButtonText: TextStyle;
  disabledButton: ViewStyle;
  registerSection: ViewStyle;
  registerPromptText: TextStyle;
  registerLinkText: TextStyle;
  profileCardBackground: ViewStyle;
  backgroundImageStyle: ImageStyle;
  backgroundOverlay: ViewStyle;
  profileCard: ViewStyle;
  profilePicture: ImageStyle;
  profileIconContainer: ViewStyle;
  userName: TextStyle;
  userEmail: TextStyle;
  actionButtonsContainer: ViewStyle;
  listItemContainer: ViewStyle;
  listItemText: TextStyle;
  logoutButtonContainer: ViewStyle;
  logoutButton: ViewStyle;
  logoutButtonText: TextStyle;
  deleteAccountButtonContainer: ViewStyle;
  deleteAccountButton: ViewStyle;
  deleteAccountButtonText: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  modalDescription: TextStyle;
  modalButtons: ViewStyle;
  modalCancelButton: ViewStyle;
  modalCancelButtonText: TextStyle;
  modalDeleteButton: ViewStyle;
  modalDeleteButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.antiflash,
  },
  loginScrollView: {
    flex: 1,
  },
  loginScrollContent: {
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl, // 32px gap between formSection and registerSection (Frame 248)
  },
  formSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg, // 16px gap (Frame 191)
  },
  inputsAndButtonsContainer: {
    gap: spacing.xxl, // 32px gap between inputs and buttons (Frame 249)
  },
  inputsContainer: {
    gap: spacing.sm, // 8px gap between inputs (Frame 246)
  },
  buttonAndForgotContainer: {
    gap: spacing.sm, // 8px gap between button and forgot password (Frame 245)
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    textAlign: 'center',
  },
  primaryButtonWrapper: {
    width: '100%',
  },
  primaryButton: {
    height: components.button.height,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.background.offWhite,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm, // 8px vertical padding for 40px total height
    paddingHorizontal: spacing.lg,
  },
  forgotPasswordText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.tertiary,
  },
  underlinedTextContainer: {
    alignSelf: 'center',
  },
  textUnderline: {
    height: 1,
    backgroundColor: colors.tertiary,
    marginTop: 0,
  },
  dividerContainer: {
    paddingHorizontal: spacing.lg, // Inner padding for divider (total 16+16=32px horizontal inset)
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider, // #CAC4D0
  },
  socialButtonsContainer: {
    gap: spacing.sm,
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: components.button.height,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  socialButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    color: colors.primary,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerSection: {
    alignItems: 'center',
  },
  registerPromptText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.sm,
    color: colors.tertiary,
  },
  registerLinkText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.sm,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.tertiary,
  },
  profileCardBackground: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    position: 'relative',
    paddingBottom: spacing.xxl,
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 12, 12, 0.72)',
  },
  profileCard: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  profilePicture: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.border,
  },
  profileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontFamily: fonts.primary,
    fontWeight: '500',
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.background.light,
    textAlign: 'center',
  },
  userEmail: {
    fontFamily: fonts.secondary,
    fontWeight: '400',
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text.lightGray,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    gap: 0,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemText: {
    fontFamily: fonts.secondary,
    fontWeight: '400',
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.primary,
    textAlign: 'left',
  },
  logoutButtonContainer: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  logoutButtonText: {
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.error,
    textAlign: 'left',
  },
  deleteAccountButtonContainer: {
    marginTop: spacing.md,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  deleteAccountButtonText: {
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.error,
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.offWhite,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.primary,
    fontWeight: '500',
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.primary,
    textAlign: 'center',
  },
  modalDescription: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.tertiary,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    height: components.button.height,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  modalDeleteButton: {
    flex: 1,
    height: components.button.height,
    borderRadius: radius.xxl,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteButtonText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.background.offWhite,
  },
});
