import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GradientBackgroundProps = {
  children: React.ReactNode;
};

export default function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={['rgba(12, 12, 12, 0)', '#0c0c0c']}
      style={styles.gradient}
      locations={[0, 1]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
  },
}); 