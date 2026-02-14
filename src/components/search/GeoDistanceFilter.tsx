"use client";

import { useState, useEffect } from "react";
import { useInstantSearch } from "react-instantsearch";
import dynamic from "next/dynamic";
import {
  SLOVAK_CITIES,
  DISTANCE_OPTIONS,
  getCityCoordinates,
} from "@/lib/geo/cities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

// Dynamic import for SimpleMap (Leaflet requires browser)
const SimpleMap = dynamic(() => import("@/components/SimpleMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[150px] w-full bg-surface rounded-lg animate-pulse" />
  ),
});

export function GeoDistanceFilter() {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistance, setSelectedDistance] = useState<number>(0);
  const { setIndexUiState } = useInstantSearch();
  const citySelectValue = selectedCity || "__city_none__";
  const distanceSelectValue =
    selectedDistance > 0 ? selectedDistance.toString() : "__distance_none__";

  // Apply geo filter when city and distance are selected
  useEffect(() => {
    if (selectedCity && selectedDistance > 0) {
      const coords = getCityCoordinates(selectedCity);
      if (coords) {
        setIndexUiState((prevState) => ({
          ...prevState,
          configure: {
            ...prevState.configure,
            aroundLatLng: `${coords.lat},${coords.lng}`,
            aroundRadius: selectedDistance * 1000, // Convert km to meters
          },
        }));
      }
    } else {
      // Clear geo filter
      setIndexUiState((prevState) => ({
        ...prevState,
        configure: {
          ...prevState.configure,
          aroundLatLng: undefined,
          aroundRadius: undefined,
        },
      }));
    }
  }, [selectedCity, selectedDistance, setIndexUiState]);

  const cities = Object.keys(SLOVAK_CITIES).sort((a, b) =>
    a.localeCompare(b, "sk"),
  );

  return (
    <div className="space-y-3">
      {/* City selector */}
      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">
          Hľadať okolo mesta
        </label>
        <Select
          value={citySelectValue}
          onValueChange={(nextValue) =>
            setSelectedCity(nextValue === "__city_none__" ? "" : nextValue)
          }
        >
          <SelectTrigger className="w-full text-black">
            <SelectValue placeholder="Vybrať mesto..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__city_none__">Vybrať mesto...</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Distance selector - only show if city is selected */}
      {selectedCity && (
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Vzdialenosť
          </label>
          <Select
            value={distanceSelectValue}
            onValueChange={(nextValue) =>
              setSelectedDistance(
                nextValue === "__distance_none__" ? 0 : Number(nextValue),
              )
            }
          >
            <SelectTrigger className="w-full text-black">
              <SelectValue placeholder="Vybrať vzdialenosť..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__distance_none__">
                Vybrať vzdialenosť...
              </SelectItem>
              {DISTANCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Active filter indicator */}
      {selectedCity && selectedDistance > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-accent/10 rounded-lg">
          <span className="text-xs text-accent font-medium">
            Okruh {selectedDistance} km od {selectedCity}
          </span>
          <button
            onClick={() => {
              setSelectedCity("");
              setSelectedDistance(0);
            }}
            className="text-xs text-accent hover:text-accent-hover underline"
          >
            Zrušiť
          </button>
        </div>
      )}

      {/* Map preview */}
      {selectedCity && (
        <SimpleMap
          lat={getCityCoordinates(selectedCity)?.lat || 48.7}
          lng={getCityCoordinates(selectedCity)?.lng || 19.7}
          radiusKm={selectedDistance}
          cityName={selectedCity}
        />
      )}
    </div>
  );
}
