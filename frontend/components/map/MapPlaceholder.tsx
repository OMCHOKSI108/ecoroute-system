'use client';

import { useEffect, useRef, useState } from 'react';
import type { Route } from '@/lib/types';

interface MapPlaceholderProps {
  height?: string;
  routes?: Route[];
  zoom?: number;
  center?: [number, number];
}

export function MapPlaceholder({
  height = '450px',
  routes = [],
  zoom = 13,
  center = [40.73061, -73.935242],
}: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Ensure Leaflet CSS is loaded in document head
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Avoid duplicate map instance error on re-render
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default demo stops matching database seed
      const stops = [
        {
          id: 'stop-1',
          name: 'Metro Supermarket Central',
          address: '100 Broadway, New York, NY 10006',
          category: 'Glass (90 kg)',
          lat: 40.7077,
          lng: -74.0119,
          status: 'arrived',
          order: 1,
        },
        {
          id: 'stop-2',
          name: 'TechLogix Industrial Park',
          address: '450 5th Ave, New York, NY 10018',
          category: 'Paper (120 kg)',
          lat: 40.7516,
          lng: -73.9832,
          status: 'pending',
          order: 2,
        },
        {
          id: 'stop-3',
          name: 'Harbor Manufacturing Co',
          address: '730 8th Ave, New York, NY 10036',
          category: 'Metal (320 kg)',
          lat: 40.7589,
          lng: -73.9882,
          status: 'pending',
          order: 3,
        },
      ];

      const vehiclePos: [number, number] = [40.7297, -73.9976];

      const map = L.map(mapContainerRef.current, {
        center: vehiclePos,
        zoom,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Create Custom Stop Icon Function
      const createStopIcon = (num: number, status: string) => {
        const bg = status === 'arrived' ? '#10B981' : '#F59E0B';
        return L.divIcon({
          className: 'custom-stop-marker',
          html: `<div style="background-color: ${bg}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${num}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
      };

      // Create Vehicle Icon Function
      const vehicleIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `<div style="background-color: #2563EB; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 10px rgba(37,99,235,0.4);">🚛</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Add Stop Markers with interactive popups
      const routePoints: [number, number][] = [];
      stops.forEach((s) => {
        const pos: [number, number] = [s.lat, s.lng];
        routePoints.push(pos);
        const marker = L.marker(pos, { icon: createStopIcon(s.order, s.status) }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
            <div style="font-weight: bold; font-size: 13px; color: #1E293B;">Stop #${s.order}: ${s.name}</div>
            <div style="color: #64748B; margin-top: 2px;">${s.address}</div>
            <div style="margin-top: 6px; display: inline-block; background: #EEF2FF; color: #4338CA; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${s.category}</div>
            <div style="margin-top: 4px; font-size: 11px; color: ${s.status === 'arrived' ? '#10B981' : '#F59E0B'}; font-weight: 600;">Status: ${s.status.toUpperCase()}</div>
          </div>
        `);
      });

      // Add Vehicle Marker
      const vMarker = L.marker(vehiclePos, { icon: vehicleIcon }).addTo(map);
      vMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
          <div style="font-weight: bold; font-size: 13px; color: #2563EB;">Vehicle: ECO-VAN-01</div>
          <div style="color: #64748B; margin-top: 2px;">Model: Electric Van (Dispatched)</div>
          <div style="margin-top: 6px; background: #ECFDF5; color: #065F46; padding: 2px 6px; border-radius: 4px; font-weight: 500;">Current Load: 210.0 / 500 kg</div>
          <div style="margin-top: 4px; font-size: 11px; color: #475569;">Active Route: 8.4 km</div>
        </div>
      `);

      // Connect stops with route polyline
      const fullPath: [number, number][] = [
        [40.7077, -74.0119],
        vehiclePos,
        [40.7516, -73.9832],
        [40.7589, -73.9882],
      ];
      L.polyline(fullPath, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 6',
      }).addTo(map);

      // Fit bounds to encompass all points comfortably
      const bounds = L.latLngBounds(fullPath);
      map.fitBounds(bounds, { padding: [40, 40] });

      setMapLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: height }} />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 text-sm text-gray-500">
          Loading OpenStreetMap tiles…
        </div>
      )}
      <div className="absolute bottom-2 left-2 z-[1000] rounded bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-md backdrop-blur">
        📍 Live Fleet Tracking • OpenStreetMap
      </div>
    </div>
  );
}

export const InteractiveMap = MapPlaceholder;
