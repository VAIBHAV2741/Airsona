"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  center: [number, number];
  zoom: number;
}

const SetViewOnSearch = ({ center, zoom }: MapProps) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const Map = ({ center, zoom }: MapProps) => {
  return (
    <div className="w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <SetViewOnSearch center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
};

export default Map;
