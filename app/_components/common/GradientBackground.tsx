import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../_styles/colors';

type GradientBackgroundProps = {
  children: React.ReactNode;
};

export default function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={[`${colors.background.dark}00`, colors.background.dark]}
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