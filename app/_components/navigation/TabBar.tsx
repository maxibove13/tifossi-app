import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { fonts, fontSizes, lineHeights, fontWeights } from '../../_styles/typography';
import { colors } from '../../_styles/colors';

// Import SVG icons
import HouseActive from '../../../assets/icons/house_active.svg';
import HouseInactive from '../../../assets/icons/house_inactive.svg';
import HeartActive from '../../../assets/icons/heart_active.svg';
import HeartInactive from '../../../assets/icons/heart_inactive.svg';
import CartActive from '../../../assets/icons/cart_active.svg';
import CartInactive from '../../../assets/icons/cart_inactive.svg';
import UserCircleActive from '../../../assets/icons/user_circle_active.svg';
import UserCircleInactive from '../../../assets/icons/user_circle_inactive.svg';

export type TabRoute = 'store' | 'favorites' | 'tiffosi' | 'cart' | 'profile';

interface TabBarProps {
  activeRoute: TabRoute;
  onChangeRoute: (route: TabRoute) => void;
  cartItemCount?: number;
  isDark?: boolean;
}

const LABELS = {
  store: 'Inicio',
  favorites: 'Favoritos',
  tiffosi: '',
  cart: 'Carrito',
  profile: 'Perfil',
};

const TabBar = ({ activeRoute, onChangeRoute, cartItemCount = 0, isDark = false }: TabBarProps) => {
  const renderIcon = (route: TabRoute, isActive: boolean) => {
    const iconProps = {
      width: 24,
      height: 24,
    };

    switch (route) {
      case 'store':
        return isActive ? <HouseActive {...iconProps} /> : <HouseInactive {...iconProps} />;
      case 'favorites':
        return isActive ? <HeartActive {...iconProps} /> : <HeartInactive {...iconProps} />;
      case 'tiffosi':
        return null;
      case 'cart':
        return isActive ? <CartActive {...iconProps} /> : <CartInactive {...iconProps} />;
      case 'profile':
        return isActive ? (
          <UserCircleActive {...iconProps} />
        ) : (
          <UserCircleInactive {...iconProps} />
        );
      default:
        return null;
    }
  };

  const renderTab = (route: TabRoute) => {
    const isActive = activeRoute === route;
    const label = LABELS[route];

    if (route === 'tiffosi') {
      return (
        <TouchableOpacity
          onPress={() => onChangeRoute('tiffosi')}
          style={[styles.centerTab, isActive && styles.centerTabActive]}
        >
          <Image
            source={
              isDark
                ? require('../../../assets/images/logo/tiffosi-light.png')
                : require('../../../assets/images/logo/tiffosi.png')
            }
            style={styles.centerLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity onPress={() => onChangeRoute(route)} style={styles.tab}>
        <View style={styles.iconContainer}>
          {renderIcon(route, isActive)}
          {route === 'cart' && cartItemCount > 0 && (
            <View style={[styles.badge, isDark && styles.badgeDark]}>
              <Text style={styles.badgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.label,
            isActive && styles.labelActive,
            isDark && styles.labelDark,
            isActive && isDark && styles.labelActiveDark,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {renderTab('store')}
      {renderTab('favorites')}
      {renderTab('tiffosi')}
      {renderTab('cart')}
      {renderTab('profile')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 84,
    paddingBottom: 34,
    backgroundColor: colors.background.offWhite,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
  },
  containerDark: {
    backgroundColor: '#0C0C0C',
  },
  tab: {
    width: 75,
    height: 50,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  centerTab: {
    width: 75,
    height: 50,
    paddingBottom: 2,
    opacity: 0.25,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  centerTabActive: {
    opacity: 1,
  },
  centerLogo: {
    width: 40,
    height: 40,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#AD3026',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeDark: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontFamily: fonts.secondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: '#FFFFFF',
    lineHeight: lineHeights.sm,
  },
  label: {
    alignSelf: 'stretch',
    textAlign: 'center',
    color: '#DCDCDC',
    fontSize: fontSizes.sm,
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.sm,
  },
  labelActive: {
    color: '#0C0C0C',
    fontWeight: fontWeights.medium,
  },
  labelDark: {
    color: '#FFFFFF',
  },
  labelActiveDark: {
    color: '#FFFFFF',
    fontWeight: fontWeights.medium,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});

export default TabBar;
