import { StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import Text from '../typography/Text';
import { spacing, layout } from '../../../_styles/spacing';

type SectionProps = {
  title: string;
  onViewMore?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function Section({ title, onViewMore, children, style }: SectionProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text variant="title">{title}</Text>
        {onViewMore && (
          <Pressable onPress={onViewMore}>
            <Text variant="link">Ver Más</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: layout.sectionPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
}); 