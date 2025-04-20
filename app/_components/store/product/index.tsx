import FeaturedCard from './featured/FeaturedCard';
import HighlightedCard from './horizontal/HighlightedCard';
import PromotionCard from './promotion/PromotionCard';
import MinicardCard from './minicard';
import ImageOnlyCard from './image/ImageOnlyCard';
import type {
  BaseProductCardProps,
  PromotionProductCardProps,
  FeaturedProductCardProps,
  HorizontalProductCardProps,
  ProductCardSize,
} from './types';

const ProductCards = {
  Featured: FeaturedCard,
  Highlighted: HighlightedCard,
  Promotion: PromotionCard,
  Minicard: MinicardCard,
  ImageOnly: ImageOnlyCard,
};

export {
  FeaturedCard as Featured,
  HighlightedCard as Highlighted,
  PromotionCard as Promotion,
  MinicardCard as Minicard,
  ImageOnlyCard as ImageOnly,
};

export type {
  BaseProductCardProps,
  PromotionProductCardProps,
  FeaturedProductCardProps,
  HorizontalProductCardProps,
  ProductCardSize,
};

export default ProductCards;
