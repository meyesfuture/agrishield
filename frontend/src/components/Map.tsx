import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapProps {
  alerts: any[];
}

function DynamicBounds({ alerts }: { alerts: any[] }) {
  const map = useMap();

  useEffect(() => {
    const validAlerts = alerts.filter(a => a.latitude && a.longitude);
    if (validAlerts.length > 0) {
      const bounds = L.latLngBounds(validAlerts.map(a => [a.latitude, a.longitude]));
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 7, duration: 1.5 });
      }
    } else {
      map.flyTo([20.5937, 78.9629], 4, { duration: 1.5 });
    }
  }, [alerts, map]);

  return null;
}

const getCustomIcon = (severity: string) => {
  const color = severity === 'critical' ? '#ef4444' : '#f97316';
  return L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 15px ${color}; opacity: 0.9;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export default function Map({ alerts }: MapProps) {
  // Center roughly on India initially
  const center: [number, number] = [20.5937, 78.9629];
  
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border-0">
      <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-full w-full map-dark" style={{ background: '#0a0a0a' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <DynamicBounds alerts={alerts} />
        {alerts.map((alert) => (
          alert.latitude && alert.longitude ? (
            <Marker key={alert.id} position={[alert.latitude, alert.longitude]} icon={getCustomIcon(alert.severity)}>
              <Popup className="custom-popup">
                <div className="font-bold text-gray-900 mb-1">{alert.location_name}</div>
                <div className="text-sm font-semibold text-gray-700">{alert.commodity_name}</div>
                <div className={`text-xs mt-2 px-2 py-1 inline-block rounded font-bold uppercase tracking-wider ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  Score: {alert.risk_score != null ? alert.risk_score.toFixed(1) : 'N/A'}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
