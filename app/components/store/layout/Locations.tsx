import { StyleSheet, View, Text, Image } from 'react-native';

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
    paddingVertical: 16,
    gap: 12,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    color: '#0C0C0C',
    fontFamily: 'Roboto',
  },
  locationsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    height: 280,
  },
  locationCard: {
    flex: 1,
    gap: 8,
  },
  locationImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  locationTextWrapper: {
    paddingHorizontal: 4,
  },
  locationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0C0C0C',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
}); 