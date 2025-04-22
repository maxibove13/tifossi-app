import { StyleSheet, View, Image } from 'react-native';
import { memo } from 'react';

const HomeHeader = memo(() => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/logo/tiffosi.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
});

export default HomeHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  logo: {
    width: 50.7,
    height: 48,
  },
});
