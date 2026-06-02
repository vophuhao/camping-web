'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FreeSpot } from '@/lib/free-spot-api';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Props {
  spots: FreeSpot[];
  highlightedId?: string | null;
  onMarkerClick?: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  nearbyRadius?: number; // km
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  height?: number;
  interactive?: boolean;
  onLocationChange?: (lat: number, lng: number) => void; // for create form
  singleSpot?: boolean; // show just one marker (detail page)
}

export default function FreeSpotMap({
  spots,
  highlightedId,
  onMarkerClick,
  userLocation,
  nearbyRadius,
  center,
  zoom = 6,
  height = 480,
  interactive = false,
  onLocationChange,
  singleSpot = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const editMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const defaultCenter: [number, number] = center ?? [106.6297, 10.8231]; // HCM

  // Init map
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: defaultCenter,
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => setIsLoaded(true));

    // Interactive click for create form
    if (interactive) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        if (editMarkerRef.current) {
          editMarkerRef.current.setLngLat([lng, lat]);
        } else {
          editMarkerRef.current = new mapboxgl.Marker({ color: '#10b981', draggable: true })
            .setLngLat([lng, lat])
            .addTo(map);
          editMarkerRef.current.on('dragend', () => {
            const pos = editMarkerRef.current!.getLngLat();
            onLocationChange?.(pos.lat, pos.lng);
          });
        }
        onLocationChange?.(lat, lng);
      });
    }

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      userMarkerRef.current?.remove();
      editMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add/update spot markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;

    // Remove stale markers
    const newIds = new Set(spots.map((s) => s._id));
    markersRef.current.forEach((marker, id) => {
      if (!newIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add new markers
    spots.forEach((spot) => {
      if (markersRef.current.has(spot._id)) return;
      const [lng, lat] = spot.location.coordinates;

      const el = document.createElement('div');
      el.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%;
        background: #10b981; border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer; display: flex; align-items: center;
        justify-content: center; font-size: 14px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      `;
      el.innerHTML = '🏕';
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.boxShadow = '0 4px 16px rgba(16,185,129,0.5)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      });
      el.addEventListener('click', () => onMarkerClick?.(spot._id));

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: '220px' })
        .setHTML(`
          <div style="font-family: sans-serif; padding: 4px;">
            <div style="font-weight:700; font-size:13px; margin-bottom:4px;">${spot.title}</div>
            <div style="font-size:11px; color:#6b7280;">📍 ${spot.city}</div>
            <div style="margin-top:6px; font-size:12px; color:#10b981; font-weight:600;">
              ❤️ ${spot.likeCount ?? 0} &nbsp; 👁 ${spot.viewCount ?? 0}
            </div>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.set(spot._id, marker);
    });
  }, [spots, isLoaded, onMarkerClick]);

  // Highlight selected marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === highlightedId) {
        el.style.background = '#f59e0b';
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = '0 4px 20px rgba(245,158,11,0.6)';
        marker.getPopup()?.addTo(mapRef.current!);
        mapRef.current?.flyTo({ center: marker.getLngLat(), zoom: 12, duration: 600 });
      } else {
        el.style.background = '#10b981';
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        marker.getPopup()?.remove();
      }
    });
  }, [highlightedId]);

  // User location marker + radius circle
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !userLocation) return;
    const map = mapRef.current;

    userMarkerRef.current?.remove();
    const el = document.createElement('div');
    el.style.cssText = `
      width: 20px; height: 20px; border-radius: 50%;
      background: #3b82f6; border: 3px solid #fff;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
    `;
    userMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    // Draw radius circle
    const circleId = 'user-radius';
    if (map.getLayer(circleId)) map.removeLayer(circleId);
    if (map.getSource(circleId)) map.removeSource(circleId);

    if (nearbyRadius) {
      const radiusDeg = nearbyRadius / 111.32;
      const points = 64;
      const coords: [number, number][] = Array.from({ length: points + 1 }, (_, i) => {
        const angle = (i / points) * 2 * Math.PI;
        return [
          userLocation.lng + radiusDeg * Math.cos(angle),
          userLocation.lat + radiusDeg * Math.sin(angle),
        ];
      });
      map.addSource(circleId, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } },
      });
      map.addLayer({
        id: circleId,
        type: 'fill',
        source: circleId,
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.08 },
      });
    }

    map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 10, duration: 800 });
  }, [userLocation, nearbyRadius, isLoaded]);

  // Fit bounds to all spots
  useEffect(() => {
    if (!isLoaded || !mapRef.current || spots.length === 0 || singleSpot) return;
    if (spots.length === 1) {
      mapRef.current.flyTo({ center: spots[0].location.coordinates as [number, number], zoom: 12 });
      return;
    }
    const bounds = new mapboxgl.LngLatBounds();
    spots.forEach((s) => bounds.extend(s.location.coordinates as [number, number]));
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 600 });
  }, [spots, isLoaded, singleSpot]);

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div ref={containerRef} style={{ height }} />
      {!isLoaded && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--muted)', fontSize: 14, color: 'var(--muted-foreground)',
          }}
        >
          Đang tải bản đồ...
        </div>
      )}
      {interactive && (
        <div
          style={{
            position: 'absolute', top: 10, left: 10, zIndex: 10,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            padding: '6px 12px', borderRadius: 8, fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#374151',
          }}
        >
          💡 Click vào bản đồ để chọn vị trí
        </div>
      )}
    </div>
  );
}
