"use client";

import { useEffect, useId, useState } from "react";
import { useInstantSearch } from "react-instantsearch";
import dynamic from "next/dynamic";
import {
  DISTANCE_OPTIONS,
  SLOVAK_CITIES,
  getCityCoordinates,
} from "@/lib/geo/cities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

const SimpleMap = dynamic(() => import("@/components/SimpleMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[150px] w-full bg-surface rounded-lg animate-pulse" />
  ),
});

function GeoDistanceFilter() {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistance, setSelectedDistance] = useState<number>(0);
  const { setIndexUiState } = useInstantSearch();
  const cityLabelId = useId();
  const distanceLabelId = useId();

  const citySelectValue = selectedCity || "__city_none__";
  const distanceSelectValue =
    selectedDistance > 0 ? selectedDistance.toString() : "__distance_none__";

  useEffect(() => {
    if (selectedCity && selectedDistance > 0) {
      const coords = getCityCoordinates(selectedCity);
      if (coords) {
        setIndexUiState((prevState) => ({
          ...prevState,
          configure: {
            ...prevState.configure,
            aroundLatLng: `${coords.lat},${coords.lng}`,
            aroundRadius: selectedDistance * 1000,
          },
        }));
      }
      return;
    }

    setIndexUiState((prevState) => ({
      ...prevState,
      configure: {
        ...prevState.configure,
        aroundLatLng: undefined,
        aroundRadius: undefined,
      },
    }));
  }, [selectedCity, selectedDistance, setIndexUiState]);

  const cities = Object.keys(SLOVAK_CITIES).sort((a, b) =>
    a.localeCompare(b, "sk"),
  );

  return (
    <div className="space-y-3">
      <div>
        <p id={cityLabelId} className="block text-xs font-medium text-secondary mb-1.5">
          Hladat okolo mesta
        </p>
        <Select
          value={citySelectValue}
          onValueChange={(nextValue) =>
            setSelectedCity(nextValue === "__city_none__" ? "" : nextValue)
          }
        >
          <SelectTrigger className="w-full text-black" aria-labelledby={cityLabelId}>
            <SelectValue placeholder="Vybrat mesto..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__city_none__">Vybrat mesto...</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCity && (
        <div>
          <p
            id={distanceLabelId}
            className="block text-xs font-medium text-secondary mb-1.5"
          >
            Vzdialenost
          </p>
          <Select
            value={distanceSelectValue}
            onValueChange={(nextValue) =>
              setSelectedDistance(
                nextValue === "__distance_none__" ? 0 : Number(nextValue),
              )
            }
          >
            <SelectTrigger
              className="w-full text-black"
              aria-labelledby={distanceLabelId}
            >
              <SelectValue placeholder="Vybrat vzdialenost..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__distance_none__">
                Vybrat vzdialenost...
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

      {selectedCity && selectedDistance > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-accent/10 rounded-lg">
          <span className="text-xs text-accent font-medium">
            Okruh {selectedDistance} km od {selectedCity}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCity("");
              setSelectedDistance(0);
            }}
            className="text-xs text-accent hover:text-accent-hover underline"
          >
            Zrusit
          </button>
        </div>
      )}

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
