import { StyleSheet, View, Text, Image } from 'react-native';
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography';
import { colors } from '../../../_styles/colors';
import { spacing } from '../../../_styles/spacing';

type LocationCardProps = {
  image: any;
  location: string;
};

function LocationCard({ image, location }: LocationCardProps) {
  return (
    <View style={styles.locationCard}>
      <Image source={image} style={styles.locationImage} resizeMode="cover" />
      <View style={styles.locationTextWrapper}>
        <Text style={styles.locationText}>{location}</Text>
      </View>
    </View>
  );
}

export default function StoreLocations() {
  const locations = [
    {
      image: require('../../../../assets/images/locations/montevideo.png'),
      location: 'Montevideo',
    },
    {
      image: require('../../../../assets/images/locations/punta_del_este.png'),
      location: 'Punta del Este',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Encuentra más en nuestros locales</Text>
      </View>
      <View style={styles.locationsGrid}>
        {locations.map((location, index) => (
          <LocationCard key={index} {...location} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.primary,
    fontFamily: fonts.primary,
    textAlign: 'center',
  },
  locationsGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    height: 280,
  },
  locationCard: {
    flex: 1,
    gap: spacing.sm,
  },
  locationImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  locationTextWrapper: {
    paddingHorizontal: spacing.xs,
  },
  locationText: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.primary,
    fontWeight: '500',
    fontFamily: fonts.secondary,
  },
});
