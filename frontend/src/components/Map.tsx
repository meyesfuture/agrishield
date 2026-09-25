import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  alerts: any[];
}

export default function Map({ alerts }: MapProps) {
  // Center roughly on India
  const center: [number, number] = [20.5937, 78.9629];
  
  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-border mt-6">
      <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {alerts.map((alert) => (
          alert.latitude && alert.longitude ? (
            <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
              <Popup>
                <div className="font-semibold text-primary">{alert.location_name}</div>
                <div className="text-sm">{alert.commodity_name}</div>
                <div className={`text-xs font-bold ${alert.severity === 'critical' ? 'text-red-600' : 'text-orange-500'}`}>
                  Score: {alert.risk_score.toFixed(1)}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
