"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  readonly lat: number;
  readonly lng: number;
}

const TILE_STYLES: Record<string, { url: string; attribution: string }> = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function LocationMap({ lat, lng }: LocationMapProps) {
  const [style, setStyle] = useState<keyof typeof TILE_STYLES>("dark");
  const tile = TILE_STYLES[style];

  return (
    <div className="rounded-xl border border-slate-800 bg-[var(--color-surface)]/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-neon" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
            GPS Location Detected
          </span>
        </div>
        <select
          value={style}
          onChange={(e) =>
            setStyle(e.target.value as keyof typeof TILE_STYLES)
          }
          className="text-xs font-mono bg-[var(--color-surface-light)] border border-slate-700
                     rounded px-2 py-1 text-slate-300 outline-none"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="satellite">Satellite</option>
        </select>
      </div>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-[280px] w-full"
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />
        <Marker position={[lat, lng]} icon={defaultIcon}>
          <Popup>
            <span className="font-mono text-xs">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
