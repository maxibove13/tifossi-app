import { StyleSheet, View, Text, Image, ViewStyle } from 'react-native';
import { spacing } from '../../../styles/spacing';
import { colors } from '../../../styles/colors';
import { fonts } from '../../../styles/typography';

type FooterProps = {
  style?: ViewStyle
}

export default function Footer({ style }: FooterProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.tagline}>Sos parte.</Text>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../../assets/images/logo/tiffosi.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FBFBFB',
    borderTopWidth: 0.4,
    borderTopColor: '#DCDCDC',
    paddingBottom: 34,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  tagline: {
    fontSize: 12,
    lineHeight: 16,
    color: '#0C0C0C',
    fontFamily: 'Inter',
    fontWeight: '400',
    textAlign: 'center',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
}); 