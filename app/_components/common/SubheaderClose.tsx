import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../_styles/colors';
import { spacing, radius, components } from '../../_styles/spacing';
import { fonts, fontSizes } from '../../_styles/typography';
import CloseIcon from '../../../assets/icons/close_md.svg';

type SubheaderCloseProps = {
  title: string;
  onClose: () => void;
  closeTestID?: string;
};

export default function SubheaderClose({ title, onClose, closeTestID }: SubheaderCloseProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
      <View style={styles.iconWrapper}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          testID={closeTestID}
        >
          <CloseIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    height: 46,
  },
  title: {
    flex: 1,
    fontFamily: fonts.primary,
    fontSize: fontSizes.xl,
    fontWeight: '400',
    lineHeight: 28,
    color: colors.primary,
  },
  iconWrapper: {
    width: components.closeButton.width,
    height: 30,
    paddingVertical: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: components.closeButton.width,
    height: components.closeButton.height,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
