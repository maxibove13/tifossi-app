import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ImageBackground,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../../../_stores/authStore';
import { usePaymentStore } from '../../../../_stores/paymentStore';
import OverlayShippingSelection from './OverlayShippingSelection';
import CartIcon from '../../../../../assets/icons/cart_white.svg';
import { spacing } from '../../../../_styles/spacing';
import { fonts, fontSizes, fontWeights } from '../../../../_styles/typography';

interface OverlayProductAddingProps {
  isVisible: boolean;
  onClose: () => void;
}

function OverlayProductAdding({ isVisible, onClose }: OverlayProductAddingProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isShippingOverlayVisible, setIsShippingOverlayVisible] = useState(false);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const setShouldShowShippingSelectionOnReturn = usePaymentStore(
    (state) => state.setShouldShowShippingSelectionOnReturn
  );

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isVisible, fadeAnim]);

  const handleBuyNow = () => {
    setIsShippingOverlayVisible(true);
  };

  const handleSelectShipping = (method: 'delivery' | 'pickup' | '') => {
    if (!method) return;

    // Set flag so shipping selection overlay shows when user navigates back
    setShouldShowShippingSelectionOnReturn(true);

    setIsShippingOverlayVisible(false);
    onClose();

    if (method === 'delivery') {
      if (isLoggedIn) {
        router.navigate('/checkout/shipping-address');
      } else {
        router.navigate('/checkout/new-address?guest=true');
      }
    } else {
      if (isLoggedIn) {
        router.navigate('/checkout/shipping-pickup');
      } else {
        router.navigate('/checkout/guest-contact-info?returnTo=shipping-pickup');
      }
    }
  };

  const handleBackToStore = () => {
    onClose();
    router.navigate('/(tabs)');
  };

  return (
    <>
      <Modal
        transparent
        visible={isVisible && !isShippingOverlayVisible}
        onRequestClose={onClose}
        animationType="none"
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <ImageBackground
            source={require('../../../../../assets/images/added-to-cart-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <View style={styles.overlay}>
              <View style={styles.messageArea}>
                <CartIcon width={64} height={64} />
                <Text style={styles.messageText}>Item añadido al carrito.</Text>
              </View>

              <View style={styles.buttonsArea}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleBuyNow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Comprar ahora</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackToStore}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>Volver a Tienda</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>
      </Modal>

      <OverlayShippingSelection
        isVisible={isShippingOverlayVisible}
        onGoBack={() => setIsShippingOverlayVisible(false)}
        onClose={() => setIsShippingOverlayVisible(false)}
        onSelectShipping={handleSelectShipping}
      />
    </>
  );
}

type Styles = {
  container: ViewStyle;
  backgroundImage: ViewStyle;
  overlay: ViewStyle;
  messageArea: ViewStyle;
  messageText: TextStyle;
  buttonsArea: ViewStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
  buttonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.72)',
    justifyContent: 'flex-end',
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: spacing.lg,
    gap: 192,
  },
  messageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  messageText: {
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.lg,
    lineHeight: 28,
    color: '#FBFBFB',
    textAlign: 'center',
  },
  buttonsArea: {
    gap: spacing.sm,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(12, 12, 12, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(251, 251, 251, 0.25)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fonts.secondary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#FBFBFB',
  },
});

export default OverlayProductAdding;
