import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { fonts, fontSizes, lineHeights } from '../../../_styles/typography';
import { colors } from '../../../_styles/colors';
import { spacing } from '../../../_styles/spacing';
import { useRouter } from 'expo-router';
import { storesData } from '../../../_data/stores';
import { StoreDetails } from '../../../_types';

type LocationCardProps = {
  image: any;
  location: string;
  onPress: () => void;
};

function LocationCard({ image, location, onPress }: LocationCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.locationCard}>
      <Image source={image} style={styles.locationImage} resizeMode="cover" />
      <View style={styles.locationTextWrapper}>
        <Text style={styles.locationText}>{location}</Text>
      </View>
    </Pressable>
  );
}

export default function StoreLocations() {
  const router = useRouter();
  const locations = [
    {
      image: require('../../../../assets/images/locations/montevideo.png'),
      location: 'Montevideo',
      cityId: 'mvd',
    },
    {
      image: require('../../../../assets/images/locations/punta_del_este.png'),
      location: 'Punta del Este',
      cityId: 'pde',
    },
  ];

  function handleLocationPress(cityName: string, cityId: string) {
    const cityStores = storesData.filter((store: StoreDetails) => store.cityId === cityId);
    if (cityStores.length > 1) {
      router.push(`/locations/${encodeURIComponent(cityId)}`);
    } else if (cityStores.length === 1) {
      router.push(
        `/locations/${encodeURIComponent(cityId)}/${encodeURIComponent(cityStores[0].zoneId)}`
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Encuentra más en nuestros locales</Text>
      </View>
      <View style={styles.locationsGrid}>
        {locations.map((location, index) => (
          <LocationCard
            key={index}
            {...location}
            onPress={() => handleLocationPress(location.location, location.cityId)}
          />
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
