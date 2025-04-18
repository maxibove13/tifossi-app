import { StyleSheet, View, Image } from 'react-native';

export default function HomeHeader() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/logo/tiffosi.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  logo: {
    width: 50.7,
    height: 48,
  },
}); 