import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StoreHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.toggleParent}>
        <View style={styles.toggle}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/images/logo/tiffosi.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Image
            source={require('../../../assets/images/partial-react-logo.png')}
            style={styles.partialLogo}
            resizeMode="contain"
          />
        </View>
        <Pressable>
          <Ionicons name="search" size={24} color="#0C0C0C" />
        </Pressable>
      </View>
      <Text style={styles.title}>Tienda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FBFBFB',
    paddingTop: 44,
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 24,
  },
  toggleParent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(180deg, #A1A1A1 50%, #E1E1E1)',
    borderRadius: 100,
    padding: 2,
    paddingRight: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoWrapper: {
    width: 28,
    height: 28,
    borderRadius: 100,
    backgroundColor: '#FBFBFB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 16,
    height: 16,
  },
  partialLogo: {
    width: 49,
    height: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
    color: '#0C0C0C',
    fontFamily: 'Roboto',
  },
}); 