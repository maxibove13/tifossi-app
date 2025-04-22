import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Button,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing, radius } from '../_styles/spacing';
import { colors } from '../_styles/colors';
import { fonts, fontSizes, lineHeights } from '../_styles/typography';
import ScreenHeader from '../_components/common/ScreenHeader';

// Import SVGs as React components
import MapPinIcon from '../../assets/icons/map-pin.svg';
import CarAutoIcon from '../../assets/icons/car-auto.svg';
import CreditCardIcon from '../../assets/icons/credit-card.svg';
import PencilIcon from '../../assets/icons/pencil.svg';

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
const LoggedInProfileCard = () => (
  <View style={styles.profileCard}>
    <View style={styles.profilePictureContainer}>
      {user.profilePicture ? (
        <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
      ) : (
        <View style={styles.profileIconContainer}>
          <Feather name="user" size={32} color={colors.primary} />
        </View>
      )}
      <TouchableOpacity style={styles.editIconContainer}>
        <PencilIcon width={12} height={12} stroke={colors.background.light} strokeWidth={1.2} />
      </TouchableOpacity>
    </View>
    <Text style={styles.userName}>{user.name}</Text>
    <Text style={styles.userEmail}>{user.email}</Text>
  </View>
);

// Logged-out Profile Card Content
const LoggedOutProfileCard = () => (
  <View style={[styles.profileCard, styles.loggedOutCard]}>
    <Text style={styles.loggedOutText}>Aún no iniciaste sesión.</Text>
    <View style={styles.authButtonsContainer}>
      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Iniciar sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.registerButton}>
        <Text style={styles.registerButtonText}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function ProfileScreen() {
  // --- TEMPORARY STATE FOR TESTING --- Remove when auth is implemented
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const toggleLogin = () => setIsLoggedIn(!isLoggedIn);
  // --- END TEMPORARY STATE ---

  return (
    <View style={styles.container}>
      <ScreenHeader title="Perfil" />

      {/* --- TEMPORARY BUTTON --- */}
      <Button
        title={isLoggedIn ? 'Log Out (Test)' : 'Log In (Test)'}
        onPress={toggleLogin}
        color={colors.error}
      />
      {/* --- END TEMPORARY BUTTON --- */}

      <ImageBackground
        source={backgroundImage}
        style={styles.profileCardBackground}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.backgroundOverlay} />
        {isLoggedIn ? <LoggedInProfileCard /> : <LoggedOutProfileCard />}
      </ImageBackground>

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
  actionButtonsContainer: ViewStyle;
  listItemContainer: ViewStyle;
  listItemText: TextStyle;
  // Logged out styles
  loggedOutCard: ViewStyle;
  loggedOutText: TextStyle;
  authButtonsContainer: ViewStyle;
  loginButton: ViewStyle;
  loginButtonText: TextStyle;
  registerButton: ViewStyle;
  registerButtonText: TextStyle;
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
  // Logged out styles
  loggedOutCard: {
    height: 128 + 2 * spacing.lg, // Figma height 128 + vertical padding 16*2
    justifyContent: 'space-between', // Figma: space-between
    gap: spacing.xl, // Figma: 24px
    paddingVertical: spacing.lg, // Keep consistent padding
  },
  loggedOutText: {
    fontFamily: fonts.secondary, // Figma: Inter
    fontWeight: '400', // Figma: 400
    fontSize: fontSizes.md, // Figma: 14
    lineHeight: lineHeights.md, // Figma: 1.428em (20)
    color: colors.background.light, // Figma: #FBFBFB
    textAlign: 'center',
    width: '100%', // Ensure text fills width
  },
  authButtonsContainer: {
    width: '100%', // Ensure buttons fill width
    gap: spacing.sm, // Figma: 8px
  },
  loginButton: {
    backgroundColor: 'rgba(251, 251, 251, 0.25)', // Figma: rgba(251, 251, 251, 0.25)
    paddingVertical: spacing.md, // Figma: 12px
    paddingHorizontal: spacing.xl, // Figma: 24px
    borderRadius: 22, // Figma: 22px (approximated radius.xxl or circle)
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontFamily: fonts.secondary, // Figma: Inter
    fontWeight: '500', // Figma: 500
    fontSize: fontSizes.md, // Figma: 14
    lineHeight: lineHeights.md, // Figma: 1.428em (20)
    color: colors.background.light, // Figma: #FBFBFB
    textAlign: 'center',
  },
  registerButton: {
    paddingVertical: spacing.sm, // Figma: 8px
    paddingHorizontal: spacing.lg, // Figma: 16px
    // No background color specified, assume transparent
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontFamily: fonts.secondary, // Figma: Inter
    fontWeight: '400', // Figma: 400
    fontSize: fontSizes.md, // Figma: 14
    lineHeight: lineHeights.md, // Figma: 1.428em (20)
    color: colors.background.light, // Figma: #FBFBFB
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
