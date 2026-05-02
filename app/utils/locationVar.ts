// utils/locationVar.ts

export let sharedLocation = ""; // string like "Delhi" or "Noida"

export const setSharedLocation = (val: string) => {
  sharedLocation = val;
};

// ------------------ fetch coordinates from city/state ------------------
export const fetchCoordsFromLocation = async (location: string) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
  );

  const data = await res.json();

  if (!data || data.length === 0) throw new Error("Location not found");

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
};
