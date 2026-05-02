"use client";

import React from "react";

const AQIStations = () => {
  const dummyStations = [
    { id: 1, name: "Station 1", original: 180, reduced: 130 },
    { id: 2, name: "Station 2", original: 160, reduced: 120 },
    { id: 3, name: "Station 3", original: 200, reduced: 150 },
  ];

  return (
    <div className="bg-gray-900 p-4 rounded-xl text-white w-96 mt-6 shadow-lg border border-gray-700">
      <h2 className="text-lg font-bold mb-3 text-center">
        AQI Data for Stations
      </h2>
      {dummyStations.map((s) => (
        <div
          key={s.id}
          className="flex justify-between bg-gray-800 px-3 py-2 mb-2 rounded-lg"
        >
          <div>
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-gray-400">
              ORI: {s.original} | RED: {s.reduced}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AQIStations;
