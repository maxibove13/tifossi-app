export enum ProductStatus {
  NEW = 'new',
  SALE = 'sale',
  FEATURED = 'featured',
  OPPORTUNITY = 'opportunity',
  RECOMMENDED = 'recommended',
  POPULAR = 'popular',
  APP_EXCLUSIVE = 'app_exclusive',
}

export enum ProductLabel {
  NEW = 'Nuevo',
  FEATURED = 'Destacado',
  OPPORTUNITY = 'Oportunidad',
  SALE = 'Descuento',
  RECOMMENDED = 'Recomendado',
  POPULAR = 'Popular',
  APP_EXCLUSIVE = 'Exclusivo in-app',
}

export const STATUS_TO_LABEL: Record<ProductStatus, ProductLabel> = {
  [ProductStatus.NEW]: ProductLabel.NEW,
  [ProductStatus.SALE]: ProductLabel.SALE,
  [ProductStatus.FEATURED]: ProductLabel.FEATURED,
  [ProductStatus.OPPORTUNITY]: ProductLabel.OPPORTUNITY,
  [ProductStatus.RECOMMENDED]: ProductLabel.RECOMMENDED,
  [ProductStatus.POPULAR]: ProductLabel.POPULAR,
  [ProductStatus.APP_EXCLUSIVE]: ProductLabel.APP_EXCLUSIVE,
};

export const LABEL_TO_STATUS: Record<ProductLabel, ProductStatus> = {
  [ProductLabel.NEW]: ProductStatus.NEW,
  [ProductLabel.SALE]: ProductStatus.SALE,
  [ProductLabel.FEATURED]: ProductStatus.FEATURED,
  [ProductLabel.OPPORTUNITY]: ProductStatus.OPPORTUNITY,
  [ProductLabel.RECOMMENDED]: ProductStatus.RECOMMENDED,
  [ProductLabel.POPULAR]: ProductStatus.POPULAR,
  [ProductLabel.APP_EXCLUSIVE]: ProductStatus.APP_EXCLUSIVE,
};

export function getStatusFromLabel(label: ProductLabel): ProductStatus {
  return LABEL_TO_STATUS[label];
}

export function getLabelFromStatus(status: ProductStatus): ProductLabel {
  return STATUS_TO_LABEL[status];
}

export function isValidStatus(status: unknown): status is ProductStatus {
  return (
    typeof status === 'string' && Object.values(ProductStatus).includes(status as ProductStatus)
  );
}

export function isValidLabel(label: unknown): label is ProductLabel {
  return typeof label === 'string' && Object.values(ProductLabel).includes(label as ProductLabel);
}

// Add default export to fix router warnings
const productStatusModule = {
  name: 'ProductStatusTypes',
  version: '1.0.0',
  statuses: ProductStatus,
  labels: ProductLabel,
};

export default productStatusModule;
