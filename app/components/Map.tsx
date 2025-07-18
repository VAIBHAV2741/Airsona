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
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-[300px] w-[300px] rounded-md shadow-md"
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <SetViewOnSearch center={center} zoom={zoom} />
    </MapContainer>
  );
};

export default Map;
