import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type CategoryButtonProps = {
  title: string;
  onPress: () => void;
};

function CategoryButton({ title, onPress }: CategoryButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#0C0C0C', '#3E3E3E']}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{title}</Text>
        <Ionicons name="chevron-forward" size={32} color="#FBFBFB" />
      </LinearGradient>
    </Pressable>
  );
}

export default function CategoryButtons() {
  const categories = [
    { title: 'medias', onPress: () => {} },
    { title: 'mochilas', onPress: () => {} },
    { title: 'ver todo', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      {categories.map((category, index) => (
        <CategoryButton key={index} {...category} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 28,
  },
  buttonText: {
    flex: 1,
    fontSize: 32,
    lineHeight: 44,
    color: '#FBFBFB',
    fontFamily: 'Roboto',
  },
});
