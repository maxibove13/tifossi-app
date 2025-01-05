import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <View style={styles.tabBar}>
      <Pressable
        style={styles.tab}
        onPress={() => router.push('/(tabs)/store')}
      >
        <Ionicons
          name={isActive('/(tabs)/store') ? 'home' : 'home-outline'}
          size={24}
          color={isActive('/(tabs)/store') ? '#0C0C0C' : '#DCDCDC'}
        />
        <Text
          style={[
            styles.tabText,
            isActive('/(tabs)/store') && styles.activeTabText,
          ]}
        >
          Tienda
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => router.push('/(tabs)/favorites')}
      >
        <Ionicons
          name={isActive('/(tabs)/favorites') ? 'heart' : 'heart-outline'}
          size={24}
          color={isActive('/(tabs)/favorites') ? '#0C0C0C' : '#DCDCDC'}
        />
        <Text
          style={[
            styles.tabText,
            isActive('/(tabs)/favorites') && styles.activeTabText,
          ]}
        >
          Favoritos
        </Text>
      </Pressable>

      <Pressable style={styles.homeTab}>
        <Image
          source={require('../../../assets/images/logo/tiffosi.png')}
          style={[styles.homeIcon, { opacity: 0.25 }]}
          resizeMode="contain"
        />
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => router.push('/(tabs)/cart')}
      >
        <View style={styles.iconWrapper}>
          <Ionicons
            name={isActive('/(tabs)/cart') ? 'cart' : 'cart-outline'}
            size={17.3}
            color={isActive('/(tabs)/cart') ? '#0C0C0C' : '#DCDCDC'}
          />
        </View>
        <Text
          style={[
            styles.tabText,
            isActive('/(tabs)/cart') && styles.activeTabText,
          ]}
        >
          Carrito
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Ionicons
          name={isActive('/(tabs)/profile') ? 'person-circle' : 'person-circle-outline'}
          size={23}
          color={isActive('/(tabs)/profile') ? '#0C0C0C' : '#DCDCDC'}
        />
        <Text
          style={[
            styles.tabText,
            isActive('/(tabs)/profile') && styles.activeTabText,
          ]}
        >
          Perfil
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: '#FBFBFB',
    borderTopWidth: 0.4,
    borderTopColor: '#DCDCDC',
    paddingBottom: 34,
  },
  tab: {
    width: 75,
    height: 50,
    overflow: 'hidden',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  homeTab: {
    width: 75,
    height: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  homeIcon: {
    width: 40,
    height: 40,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#DCDCDC',
    fontFamily: 'Inter',
  },
  activeTabText: {
    color: '#0C0C0C',
  },
}); 