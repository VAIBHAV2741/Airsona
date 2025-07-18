import React, { useState, useEffect } from "react";

interface Props {
  onSearch: (coords: [number, number], zoom: number) => void;
}

interface CountryData {
  name: string;
  states: string[];
}

const LocationDropdown: React.FC<Props> = ({ onSearch }) => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => setCountries(data.countries));
  }, []);

  useEffect(() => {
    const country = countries.find((c) => c.name === selectedCountry);
    setStates(country ? country.states : []);
    setSelectedState("");
  }, [selectedCountry, countries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use a geocoding API to get coordinates for the selected state
    const query = `${selectedState}, ${selectedCountry}`;
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`
    );
    const geoData = await geoRes.json();
    if (geoData && geoData[0]) {
      const lat = parseFloat(geoData[0].lat);
      const lon = parseFloat(geoData[0].lon);
      onSearch([lat, lon], 7);
    } else {
      alert("Location not found!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full items-center">
      <select
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(e.target.value)}
        required
        className="bg-gray-800 text-white p-2 rounded w-64"
      >
        <option value="">Select Country</option>
        {countries.map((country) => (
          <option key={country.name} value={country.name}>
            {country.name}
          </option>
        ))}
      </select>
      <select
        value={selectedState}
        onChange={(e) => setSelectedState(e.target.value)}
        required
        disabled={!states.length}
        className="bg-gray-800 text-white p-2 rounded w-64"
      >
        <option value="">Select State</option>
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!selectedCountry || !selectedState}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Show Map
      </button>
    </form>
  );
};

export default LocationDropdown;