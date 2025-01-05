import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type HomeContentProps = {
  onStorePress: () => void;
};

export default function HomeContent({ onStorePress }: HomeContentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Envíos gratis, productos exclusivos, lo mejor de Tiffosi, personalizado para ti.
      </Text>
      <View style={styles.buttonWrapper}>
        <Pressable style={styles.button} onPress={onStorePress}>
          <Text style={styles.buttonText}>Ir a Tienda</Text>
          <Ionicons name="arrow-forward" size={24} color="#FBFBFB" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 48,
  },
  message: {
    fontSize: 24,
    lineHeight: 32,
    color: '#FBFBFB',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  buttonWrapper: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 16,
  },
  buttonText: {
    color: '#FBFBFB',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 24,
  },
}); 