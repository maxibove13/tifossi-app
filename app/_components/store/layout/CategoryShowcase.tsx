import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type CategoryShowcaseProps = {
  title: string;
  onPress?: () => void;
};

export default function CategoryShowcase({ title, onPress }: CategoryShowcaseProps) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#0C0C0C', '#3E3E3E']}
        start={{ x: 0.25, y: 0.25 }}
        end={{ x: 0.75, y: 0.75 }}
        style={styles.container}
      >
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconContainer}>
          <Ionicons name="chevron-forward" size={32} color="#FBFBFB" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 28,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: '#FBFBFB',
    fontSize: 32,
    fontFamily: 'Roboto',
    fontWeight: '400',
    lineHeight: 44,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
