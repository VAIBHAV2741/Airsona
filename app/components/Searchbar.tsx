"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (location: [number, number], zoom: number) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    if (!query) return;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    );
    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      onSearch([parseFloat(lat), parseFloat(lon)], 13); // Both maps zoom to 13
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 text-white bg-gray-800 rounded-md shadow-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="Enter location..."
      />
      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
