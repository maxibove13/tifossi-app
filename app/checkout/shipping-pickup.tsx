import React, { useMemo } from 'react';
import { router } from 'expo-router';

import SelectionListScreen, { SelectionItem } from '../_components/checkout/SelectionListScreen';
import { storesData } from '../_data/stores';
import { StoreDetails } from '../_types';

type CityWithZones = {
  id: string;
  name: string;
  zoneIds: string[];
};

export default function ShippingPickupScreen() {
  const citiesWithZones = useMemo<CityWithZones[]>(() => {
    const cityMap = new Map<string, { name: string; zoneIds: Set<string> }>();

    storesData.forEach((store: StoreDetails) => {
      if (!cityMap.has(store.cityId)) {
        const cityName =
          store.cityId === 'mvd'
            ? 'Montevideo'
            : store.cityId === 'pde'
              ? 'Punta del Este'
              : store.cityId;
        cityMap.set(store.cityId, { name: cityName, zoneIds: new Set() });
      }
      cityMap.get(store.cityId)!.zoneIds.add(store.zoneId);
    });

    return Array.from(cityMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      zoneIds: Array.from(data.zoneIds),
    }));
  }, []);

  const cityItems = useMemo<SelectionItem[]>(() => {
    return citiesWithZones.map((city) => ({ id: city.id, name: city.name }));
  }, [citiesWithZones]);

  const handleCitySelect = (selectedItem: SelectionItem) => {
    const selectedCityData = citiesWithZones.find((city) => city.id === selectedItem.id);

    if (!selectedCityData) {
      console.error('Selected city not found in processed data:', selectedItem.id);
      return;
    }

    if (selectedCityData.zoneIds.length > 1) {
      router.push({
        pathname: '/checkout/shipping-pickup-zone',
        params: { cityId: selectedCityData.id, cityName: selectedCityData.name },
      });
    } else if (selectedCityData.zoneIds.length === 1) {
      const zoneId = selectedCityData.zoneIds[0];
      router.push({
        pathname: '/checkout/store-selection',
        params: { cityId: selectedCityData.id, zoneId: zoneId },
      });
    } else {
      console.warn(`City ${selectedCityData.name} has no zones defined in storesData.`);
      router.push({
        pathname: '/checkout/store-selection',
        params: { cityId: selectedCityData.id },
      });
    }
  };

  return (
    <SelectionListScreen
      pageTitle="Recoge tu pedido"
      sectionTitle="Ciudad"
      items={cityItems}
      onItemSelect={handleCitySelect}
    />
  );
}
