import { StyleSheet, View, ScrollView } from 'react-native';
import StoreHeader from '../components/store/StoreHeader';
import FeaturedProducts from '../components/store/FeaturedProducts';
import RecommendedProducts from '../components/store/RecommendedProducts';
import CategoryButtons from '../components/store/CategoryButtons';
import TrendingProducts from '../components/store/TrendingProducts';
import HighlightedProduct from '../components/store/HighlightedProduct';
import NewReleases from '../components/store/NewReleases';
import StoreLocations from '../components/store/StoreLocations';
import BrandFooter from '../components/store/BrandFooter';

export default function StoreScreen() {
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <StoreHeader />
        <FeaturedProducts />
        <View style={styles.content}>
          <RecommendedProducts />
          <CategoryButtons />
          <TrendingProducts />
          <HighlightedProduct />
          <NewReleases />
          <StoreLocations />
          <BrandFooter />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 96,
    gap: 48,
  },
}); 