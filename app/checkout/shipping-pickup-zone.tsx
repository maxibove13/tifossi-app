import React, { useMemo, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import SelectionListScreen, { SelectionItem } from '../_components/checkout/SelectionListScreen';
import { storesData } from '../_data/stores';
import { StoreDetails } from '../_types';

const ZONE_DISPLAY_NAMES: Record<string, string> = {
  centro: 'Centro',
  plaza_italia: 'Plaza Italia',
  punta_del_este: 'Punta del Este',
};

const formatZoneName = (zoneId: string, fallbackName: string) => {
  if (!zoneId) return fallbackName;

  if (ZONE_DISPLAY_NAMES[zoneId]) {
    return ZONE_DISPLAY_NAMES[zoneId];
  }

  if (fallbackName) {
    return fallbackName;
  }

  return zoneId
    .split('_')
    .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment))
    .join(' ');
};

export default function ShippingPickupZoneScreen() {
  const { cityId, cityName } = useLocalSearchParams<{ cityId: string; cityName: string }>();

  const zones = useMemo<SelectionItem[]>(() => {
    if (!cityId) return [];

    const cityStores = storesData.filter((store: StoreDetails) => store.cityId === cityId);

    const uniqueZones = cityStores.reduce<SelectionItem[]>((acc, store) => {
      if (!acc.some((zone) => zone.id === store.zoneId)) {
        acc.push({
          id: store.zoneId,
          name: formatZoneName(store.zoneId, store.name),
        });
      }
      return acc;
    }, []);

    return uniqueZones;
  }, [cityId]);

  useEffect(() => {
    if (!cityId || !cityName) {
      if (router.canGoBack()) router.back();
    } else if (zones.length === 0) {
      router.replace({
        pathname: '/checkout/store-selection',
        params: { cityId },
      });
    }
  }, [cityId, cityName, zones]);

  const handleZoneSelect = (selectedItem: SelectionItem) => {
    if (!cityId || !selectedItem?.id) return;
    router.push({
      pathname: '/checkout/store-selection',
      params: { cityId: cityId, zoneId: selectedItem.id },
    });
  };

  const cityExists = storesData.some((store) => store.cityId === cityId);
  if (!cityId || !cityName || (zones.length === 0 && !cityExists)) {
    return null;
  }

  return (
    <SelectionListScreen
      pageTitle="Recoge tu pedido"
      sectionTitle={cityName || 'Seleccionar Zona'}
      items={zones}
      onItemSelect={handleZoneSelect}
    />
  );
}
