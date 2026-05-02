"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Station {
  station: string;
  lat?: number;
  lon?: number;
  name?: string;
}

interface Props {
  onSearch: (coords: [number, number], zoom: number) => void;
  onGetAQI: (stations: Station[]) => void;
}

interface CountryData {
  name: string;
  states: string[];
}

const LocationDropdown: React.FC<Props> = ({ onSearch, onGetAQI }) => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");

  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("");

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // load countries/states from local data.json
  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then((d) => setCountries(d.countries || []))
      .catch((e) => {
        console.error("Failed to load data.json", e);
        setCountries([]);
      });
  }, []);

  // when country changes update states
  useEffect(() => {
    const country = countries.find((c) => c.name === selectedCountry);
    setStates(country ? country.states : []);
    setSelectedState("");
    setStations([]);
    setSelectedStation("");
  }, [selectedCountry, countries]);

  // fetch stations when state changes
  useEffect(() => {
    if (!selectedState) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://airsonaapi.onrender.com/tree_recommendations?location=${encodeURIComponent(
            selectedState
          )}`
        );
        const data = await res.json();
        // API returns object with stations array (we expect this)
        setStations(data.stations || []);
      } catch (err) {
        console.error("Failed to fetch stations:", err);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedState]);

  // show map centered on selected station
  const handleShowMap = () => {
    if (!selectedStation) return alert("Please select a station to show on map.");
    const st = stations.find((s: Station) => s.station === selectedStation);
    if (!st || !st.lat || !st.lon) return alert("Station coordinates not available.");
    onSearch([st.lat, st.lon], 12);
  };

  // fetch AQI & tree recommendations for selected station (and push stations up)
  const handleGetAQI = async () => {
    if (!selectedStation) return alert("Please select a station.");
    setLoading(true);
    try {
      const res = await fetch(
        `https://airsonaapi.onrender.com/tree_recommendations?location=${encodeURIComponent(
          selectedStation
        )}`
      );
      const data = await res.json();
      const returnedStations = data.stations || [];
      onGetAQI(returnedStations);

      // focus map on first returned station (if any)
      if (returnedStations.length > 0) {
        const first = returnedStations[0];
        if (first.lat && first.lon) onSearch([first.lat, first.lon], 12);
      }

      if (!returnedStations.length) alert("No station results returned from API.");
    } catch (err) {
      console.error("Error fetching AQI from airsonaapi:", err);
      alert("Failed to fetch AQI from API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {/* Country */}
      <select
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(e.target.value)}
        className="bg-gray-800 text-white p-2 rounded w-64"
      >
        <option value="">Select Country</option>
        {countries.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      {/* State */}
      <select
        value={selectedState}
        onChange={(e) => setSelectedState(e.target.value)}
        disabled={!states.length}
        className="bg-gray-800 text-white p-2 rounded w-64"
      >
        <option value="">Select State</option>
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Station */}
      <select
        value={selectedStation}
        onChange={(e) => setSelectedStation(e.target.value)}
        disabled={!stations.length}
        className="bg-gray-800 text-white p-2 rounded w-64"
      >
        <option value="">Select Station</option>
        {stations.map((s: Station) => (
          <option key={s.station} value={s.station}>
            {s.station}
          </option>
        ))}
      </select>

      <div className="flex gap-3 mt-2">
        <button
          onClick={handleShowMap}
          type="button"
          disabled={!selectedStation}
          className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Show Map
        </button>

        <button
          onClick={handleGetAQI}
          type="button"
          disabled={!selectedStation || loading}
          className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Check AQI"}
        </button>

        <button
          onClick={() => router.push("/reduceaqi")}
          type="button"
          className="bg-green-500 px-4 py-2 rounded text-white hover:bg-green-600"
        >
          Reduce AQI
        </button>
      </div>
    </div>
  );
};

export default LocationDropdown;
