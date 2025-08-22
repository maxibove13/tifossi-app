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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spacing, radius } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights, fontWeights } from '../_styles/typography';

// Import SVGs as React components
import MapPinIcon from '../../assets/icons/map-pin.svg';
import CarAutoIcon from '../../assets/icons/car-auto.svg';
import CreditCardIcon from '../../assets/icons/credit-card.svg';

// Import authStore and custom components
import { useAuthStore } from '../_stores/authStore';
import ReusableAuthPrompt from '../_components/auth/AuthPrompt';
import ProfilePictureEditor from '../_components/auth/ProfilePictureEditor';
import SplashScreen from '../_components/splash/SplashScreen';

const backgroundImage = require('../../assets/images/background_image_profile.png');

interface User {
  name: string;
  email: string;
  profilePicture: string | null;
}

const user: User = {
  name: 'Sebastian T. Gonzalez',
  email: 'tgonzalezsebastian@gmail.com',
  profilePicture: null,
};

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

// Logged-in Profile Card Content
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
  const { currentUser, updateProfilePicture, isUploadingProfilePicture } = useAuthStore(
    (state) => ({
      currentUser: state.user,
      updateProfilePicture: state.updateProfilePicture,
      isUploadingProfilePicture: state.isUploadingProfilePicture,
    })
  );
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Use Firebase auth user data or fallback to mock user
  const displayName = currentUser?.name || user.name;
  const displayEmail = currentUser?.email || user.email;
  // Get profile picture from auth state, local state, or fallback
  const displayProfilePicture = currentUser?.profilePicture || profileImage || user.profilePicture;

  const handleProfilePictureChange = async (imageUri: string | null) => {
    if (!imageUri) {
      setProfileImage(null);
      return;
    }

    try {
      // Update profile picture through Firebase auth service
      await updateProfilePicture(imageUri);
      setProfileImage(imageUri);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la imagen de perfil.');
    }
  };

  return (
    <View style={styles.profileCard}>
      <ProfilePictureEditor
        currentImage={displayProfilePicture}
        size={80}
        onImageChange={handleProfilePictureChange}
      />
      {isUploadingProfilePicture && (
        <Text style={styles.uploadingText}>Actualizando imagen...</Text>
      )}
      <Text style={styles.userName}>{displayName}</Text>
      <Text style={styles.userEmail}>{displayEmail}</Text>
    </View>
  );
};

export default function ProfileScreen() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn); // Ensure isLoggedIn is part of authStore state

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
        <>
          <ReusableAuthPrompt message="Aún no iniciaste sesión." style={styles.authPromptStyle} />
        </>
      )}

      {/* Render action buttons only if logged in */}
      {isLoggedIn && (
        <View style={styles.actionButtonsContainer}>
          <ProfileListItem
            IconComponent={MapPinIcon}
            text="Direcciones de envío"
            onPress={() => {}}
          />
          <ProfileListItem
            IconComponent={CarAutoIcon}
            text="Compras realizadas"
            onPress={() => {}}
          />
          <ProfileListItem
            IconComponent={CreditCardIcon}
            text="Métodos de pago"
            onPress={() => {}}
          />
          <ProfileListItem
            IconComponent={() => <Feather name="lock" size={24} color={colors.primary} />}
            text="Cambiar Contraseña"
            onPress={() => router.push('/profile/change-password')}
          />

          {/* Logout Button */}
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
  profilePictureContainer: ViewStyle;
  profilePicture: ImageStyle;
  profileIconContainer: ViewStyle;
  editIconContainer: ViewStyle;
  userName: TextStyle;
  userEmail: TextStyle;
  uploadingText: TextStyle;
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
  profilePictureContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
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
  editIconContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.border,
    padding: spacing.xs,
    borderRadius: radius.circle,
    borderWidth: 1.5,
    borderColor: colors.background.light,
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
  uploadingText: {
    fontFamily: fonts.secondary,
    fontWeight: '400',
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
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
