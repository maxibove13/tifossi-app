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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { spacing } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';

// Import authStore and custom components
import { useAuthStore } from '../_stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import ReusableAuthPrompt from '../_components/auth/AuthPrompt';
import SplashScreen from '../_components/splash/SplashScreen';

const backgroundImage = require('../../assets/images/background_image_profile.png');

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

  // This will handle the logout process after the splash screen appears
  useEffect(() => {
    const performLogout = async () => {
      if (showSplashScreen) {
        try {
          // Give the splash screen some time to appear
          await new Promise((resolve) => setTimeout(resolve, 300));
          // Perform logout
          await logout();
          // Navigate to the home screen
          router.replace('/(home)');
        } catch {
          // Hide splash screen and show error
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
          // Show the splash screen and trigger the logout process
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

      {/* Show the splash screen as a modal during logout */}
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

export default function ProfileScreen() {
  const { isLoggedIn, user } = useAuthStore(
    useShallow((state) => ({
      isLoggedIn: state.isLoggedIn,
      user: state.user,
    }))
  );

  // Only show change password for email/password users (not OAuth)
  const isEmailUser = !user?.metadata?.provider || user.metadata.provider === 'email';

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <ImageBackground
          source={backgroundImage}
          style={styles.profileCardBackground}
          imageStyle={styles.backgroundImageStyle}
        >
          <View style={styles.backgroundOverlay} />
          <LoggedInProfileCard />
        </ImageBackground>
      ) : (
        <ReusableAuthPrompt message="Aún no iniciaste sesión." style={styles.authPromptStyle} />
      )}

      {isLoggedIn && (
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
        </View>
      )}
    </View>
  );
}

type Styles = {
  container: ViewStyle;
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
  authPromptStyle: ViewStyle;
  logoutButtonContainer: ViewStyle;
  logoutButton: ViewStyle;
  logoutButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  profileCardBackground: {
    paddingVertical: spacing.lg, // Adjusted padding for logged out view
    paddingHorizontal: spacing.lg,
    position: 'relative',
    paddingBottom: spacing.xxl, // Add more padding at the bottom for the dev button
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
    color: '#E1E1E1',
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
  authPromptStyle: {
    marginVertical: spacing.lg,
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
});
