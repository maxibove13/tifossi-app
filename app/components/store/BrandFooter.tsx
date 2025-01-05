import { StyleSheet, View, Text, Image } from 'react-native';

export default function BrandFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.tagline}>Sos parte.</Text>
      <View style={styles.logoWrapper}>
        <Image
          source={require('../../../assets/images/logo/tiffosi.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 64,
    paddingBottom: 16,
    gap: 16,
  },
  tagline: {
    alignSelf: 'stretch',
    fontSize: 14,
    lineHeight: 20,
    color: '#0C0C0C',
    fontWeight: '500',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  logoWrapper: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 38,
    height: 38,
  },
}); 