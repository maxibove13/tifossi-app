import React, { useMemo, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import SelectionListScreen, { SelectionItem } from '../_components/checkout/SelectionListScreen';
import { storesData } from '../_data/stores';
import { StoreDetails } from '../_types';

export default function ShippingPickupZoneScreen() {
  const { cityId, cityName } = useLocalSearchParams<{ cityId: string; cityName: string }>();

  const zones = useMemo<SelectionItem[]>(() => {
    if (!cityId) return [];

    const cityStores = storesData.filter((store: StoreDetails) => store.cityId === cityId);

    const uniqueZones = cityStores.reduce<SelectionItem[]>((acc, store) => {
      if (!acc.some((zone) => zone.id === store.zoneId)) {
        acc.push({ id: store.zoneId, name: store.name });
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
