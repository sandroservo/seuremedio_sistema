/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Componente de Mapa para Rastreamento de Entrega
 */

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corrige ícones do Leaflet no Next.js
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface DeliveryMapProps {
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
  deliveryPersonName?: string;
  customerAddress?: string;
  showRoute?: boolean;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function DeliveryMap({
  deliveryLat,
  deliveryLng,
  customerLat,
  customerLng,
  deliveryPersonName = 'Entregador',
  customerAddress = 'Destino',
  showRoute = true,
}: DeliveryMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  // Centro padrão (São Paulo)
  const defaultCenter: [number, number] = [-23.5505, -46.6333];
  
  // Determina o centro do mapa
  let center: [number, number] = defaultCenter;
  if (deliveryLat && deliveryLng) {
    center = [deliveryLat, deliveryLng];
  } else if (customerLat && customerLng) {
    center = [customerLat, customerLng];
  }

  const hasDeliveryPosition = deliveryLat != null && deliveryLng != null;
  const hasCustomerPosition = customerLat != null && customerLng != null;

  // Linha entre entregador e destino
  const routePositions: [number, number][] = [];
  if (hasDeliveryPosition && hasCustomerPosition && showRoute) {
    routePositions.push([deliveryLat!, deliveryLng!]);
    routePositions.push([customerLat!, customerLng!]);
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} />

        {hasDeliveryPosition && (
          <Marker position={[deliveryLat!, deliveryLng!]} icon={deliveryIcon}>
            <Popup>
              <strong>🛵 {deliveryPersonName}</strong>
              <br />
              Posição atual do entregador
            </Popup>
          </Marker>
        )}

        {hasCustomerPosition && (
          <Marker position={[customerLat!, customerLng!]} icon={customerIcon}>
            <Popup>
              <strong>📍 Destino</strong>
              <br />
              {customerAddress}
            </Popup>
          </Marker>
        )}

        {routePositions.length === 2 && (
          <Polyline
            positions={routePositions}
            color="#FF6B00"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  );
}
