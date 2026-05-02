"use client";

import React, { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Popup,
  useMap,
  LayerGroup,
  Marker,
} from "react-leaflet";
import L, { LatLngBounds } from "leaflet";

interface MapPoint {
  lat: number;
  lng: number;
  aqi: number;
  color: string;
  stationName?: string;
}

interface AQIMapProps {
  center: [number, number];
  mapPoints: MapPoint[];
}

const pinIcon = new L.Icon({
  iconUrl: "/pin.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

function FitBoundsToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    const bounds = new LatLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [map, points]);

  return null;
}

export default function AQIMap({ center, mapPoints }: AQIMapProps) {
  return (
    <MapContainer center={center} zoom={11} className="w-full h-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBoundsToPoints points={mapPoints} />
      <LayerGroup>
        {mapPoints.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={pinIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.stationName ?? `Sensor ${i + 1}`}</div>
                <div>AQI: <span className="font-medium">{p.aqi}</span></div>
                <div>Status: <span className="font-medium">{p.color}</span></div>
                <div className="text-xs text-slate-400 mt-1">
                  Lat: {p.lat.toFixed(4)}, Lng: {p.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>
    </MapContainer>
  );
}
