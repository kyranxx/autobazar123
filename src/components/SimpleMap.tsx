"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SimpleMapProps {
    lat: number;
    lng: number;
    radiusKm: number;
    cityName?: string;
}

export default function SimpleMap({ lat, lng, radiusKm, cityName }: SimpleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map only once
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current, {
                center: [lat, lng],
                zoom: 10,
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
            });

            // Add OpenStreetMap tiles
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 15,
            }).addTo(mapInstanceRef.current);
        }

        const map = mapInstanceRef.current;

        // Update view
        map.setView([lat, lng], getZoomForRadius(radiusKm));

        // Remove old marker and circle
        if (markerRef.current) {
            markerRef.current.remove();
        }
        if (circleRef.current) {
            circleRef.current.remove();
        }

        // Add marker with custom icon
        const icon = L.divIcon({
            html: `<div style="font-size: 24px;">📍</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            className: "custom-pin-icon",
        });
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);

        // Add circle for radius
        if (radiusKm > 0) {
            circleRef.current = L.circle([lat, lng], {
                radius: radiusKm * 1000, // Convert km to meters
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.15,
                weight: 2,
            }).addTo(map);
        }

        return () => {
            // Cleanup on unmount
        };
    }, [lat, lng, radiusKm]);

    // Cleanup map on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className="relative w-full rounded-lg overflow-hidden border border-border shadow-sm">
            <div ref={mapRef} style={{ height: "150px", width: "100%" }} />
            {cityName && (
                <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-primary shadow">
                    {cityName} • {radiusKm > 0 ? `${radiusKm} km` : "Celé Slovensko"}
                </div>
            )}
        </div>
    );
}

// Helper to determine zoom level based on radius
function getZoomForRadius(radiusKm: number): number {
    if (radiusKm <= 10) return 12;
    if (radiusKm <= 25) return 11;
    if (radiusKm <= 50) return 10;
    if (radiusKm <= 100) return 9;
    if (radiusKm <= 200) return 8;
    return 7; // Whole Slovakia
}
