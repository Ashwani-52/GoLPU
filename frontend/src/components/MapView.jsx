import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapView({ routeData }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [75.705, 31.255], // LPU roughly
      zoom: 15,
      pitch: 45, // Add some pitch for a modern 3D feel
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Add an empty GeoJSON source for the route
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      // Add a glow effect underneath the main line
      map.current.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF9933', // Saffron
          'line-width': 12,
          'line-opacity': 0.3,
          'line-blur': 10
        }
      });

      // Add the main route line
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF9933', // Saffron
          'line-width': 4,
        }
      });
    });
  }, []);

  // Update map when routeData changes
  useEffect(() => {
    if (!map.current || !routeData || !routeData.coordinates || routeData.coordinates.length === 0) return;

    const coords = routeData.coordinates.map(c => [c.lon, c.lat]);
    
    // Create GeoJSON LineString
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    };

    // Wait until map is loaded before updating source
    if (map.current.isStyleLoaded()) {
      map.current.getSource('route').setData(geojson);
    } else {
      map.current.once('styledata', () => {
        map.current.getSource('route').setData(geojson);
      });
    }

    // Calculate bounding box for the route
    const bounds = coords.reduce((acc, coord) => {
      return acc.extend(coord);
    }, new maplibregl.LngLatBounds(coords[0], coords[0]));

    // Fit map to bounds with padding
    map.current.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: 18,
      duration: 1500, // Smooth animation
      pitch: 45 // Ensure pitch is maintained
    });

    // Add markers for start and end
    // First remove old markers (we could keep refs, but let's keep it simple by removing by class)
    const oldMarkers = document.querySelectorAll('.route-marker');
    oldMarkers.forEach(m => m.remove());

    const startEl = document.createElement('div');
    startEl.className = 'route-marker w-4 h-4 bg-white rounded-full border-4 border-navy-900 shadow-[0_0_15px_rgba(255,255,255,0.8)]';
    new maplibregl.Marker({ element: startEl })
      .setLngLat(coords[0])
      .addTo(map.current);

    const endEl = document.createElement('div');
    endEl.className = 'route-marker w-5 h-5 bg-saffron-500 rounded-full border-4 border-navy-900 shadow-[0_0_20px_rgba(255,153,51,0.8)] animate-pulse';
    
    // Add a popup for the destination
    const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
      .setHTML(`<div class="font-bold text-saffron-400">${routeData.end}</div><div class="text-xs text-gray-300 mt-1">${routeData.total_distance_m}m • ${routeData.estimated_walk_minutes} mins</div>`);

    new maplibregl.Marker({ element: endEl })
      .setLngLat(coords[coords.length - 1])
      .setPopup(popup)
      .addTo(map.current)
      .togglePopup(); // Show popup by default

  }, [routeData]);

  return (
    <div className="relative w-full h-full bg-navy-950">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Overlay gradient for a seamless edge transition */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-navy-950 to-transparent pointer-events-none z-10" />
      
      {/* Loading overlay if needed (optional) */}
      {!map.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-950 z-20">
          <div className="w-8 h-8 border-4 border-navy-800 border-t-saffron-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
