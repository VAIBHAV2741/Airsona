"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LocationDropdown from "../components/LocationDropdown";

// Dynamically import the Map component (disable SSR)
const Map = dynamic(() => import("../components/Map"), { ssr: false });

const Page = () => {
  const [location, setLocation] = useState<[number, number]>([51.505, -0.09]); // Default: London
  const [zoom, setZoom] = useState(5); // Default zoom

  const handleSearch = (newLocation: [number, number], newZoom: number) => {
    setLocation(newLocation);
    setZoom(newZoom);
  };

  return (
    <div className="flex h-screen bg-black text-white p-8">
      {/* Left side with heading & location dropdown */}
      <div className="w-1/2 flex flex-col justify-center items-center gap-6">
        <h1 className="text-4xl font-bold text-white text-center">
          Test Your Air Quality <br /> Instantly 🌍✨
        </h1>
        <LocationDropdown onSearch={handleSearch} />
      </div>

      {/* Right side with two stacked maps */}
      <div className="w-1/2 flex flex-col items-center gap-4">
        <Map center={location} zoom={zoom} />
        <Map center={location} zoom={zoom} />
      </div>
    </div>
  );
};

export default Page;