import { StyleSheet, View, ScrollView } from 'react-native';
import Skeleton from '../common/Skeleton';
import ProductCardSkeleton from './ProductCardSkeleton';

export default function StoreSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Skeletons */}
      <View style={styles.header}>
        <View style={styles.toggleParent}>
          <Skeleton width={89} height={32} borderRadius={100} />
          <Skeleton width={32} height={32} borderRadius={2} />
        </View>
        <Skeleton width={95} height={32} borderRadius={2} />
      </View>

      {/* Featured Products Skeleton */}
      <View style={styles.featuredSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.featuredProducts}>
            {[1, 2, 3].map((key) => (
              <View key={key} style={styles.featuredCard}>
                <Skeleton width={119} height={142} borderRadius={10} />
                <View style={styles.featuredContent}>
                  <Skeleton width={180} height={16} />
                  <Skeleton width={200} height={16} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Categories Section */}
      <View style={styles.categoriesSection}>
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} width="100%" height={92} borderRadius={4} />
        ))}
      </View>

      {/* Products Grid Section */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Skeleton width={200} height={28} />
          <Skeleton width={62} height={22} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.productsGrid}>
            {[1, 2, 3, 4].map((key) => (
              <ProductCardSkeleton key={key} />
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FBFBFB',
    padding: 16,
    paddingTop: 44,
    gap: 24,
  },
  toggleParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredSection: {
    paddingVertical: 32,
    borderTopWidth: 0.4,
    borderTopColor: '#DCDCDC',
  },
  featuredProducts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  featuredCard: {
    width: 328,
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#FBFBFB',
    overflow: 'hidden',
  },
  featuredContent: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  categoriesSection: {
    padding: 16,
    gap: 8,
  },
  productsSection: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
}); 