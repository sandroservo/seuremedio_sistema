/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Componente de Mapa para Rastreamento de Entrega em Tempo Real
 */

'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const deliveryIcon = new L.DivIcon({
  className: 'delivery-marker',
  html: `<div style="
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    border: 3px solid white;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="5" cy="17" r="2"/>
      <circle cx="19" cy="17" r="2"/>
      <path d="M12 17V5"/>
      <path d="m8 8 4-3 4 3"/>
      <path d="M7 17h10"/>
      <path d="M5 9h4l2 3h6l1-4h2"/>
      <path d="M14 17h-4"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
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
  onDistanceUpdate?: (distance: number, duration: number) => void;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function AnimatedMarker({ 
  position, 
  icon, 
  children 
}: { 
  position: [number, number]; 
  icon: L.Icon | L.DivIcon; 
  children: React.ReactNode;
}) {
  const markerRef = useRef<L.Marker>(null);
  const [currentPos, setCurrentPos] = useState(position);
  
  useEffect(() => {
    if (!markerRef.current) return;
    
    const marker = markerRef.current;
    const startPos = currentPos;
    const endPos = position;
    const duration = 1000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const newLat = startPos[0] + (endPos[0] - startPos[0]) * easeProgress;
      const newLng = startPos[1] + (endPos[1] - startPos[1]) * easeProgress;
      
      marker.setLatLng([newLat, newLng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentPos(endPos);
      }
    };
    
    if (startPos[0] !== endPos[0] || startPos[1] !== endPos[1]) {
      requestAnimationFrame(animate);
    }
  }, [position]);
  
  return (
    <Marker ref={markerRef} position={currentPos} icon={icon}>
      {children}
    </Marker>
  );
}

function MapUpdater({ center, follow }: { center: [number, number]; follow: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.setView(center, map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [center, map, follow]);
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
  onDistanceUpdate,
}: DeliveryMapProps) {
  const [mounted, setMounted] = useState(false);
  const [followDelivery, setFollowDelivery] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const distanceInfo = useMemo(() => {
    if (deliveryLat && deliveryLng && customerLat && customerLng) {
      const distance = calculateDistance(deliveryLat, deliveryLng, customerLat, customerLng);
      const avgSpeed = 25;
      const duration = (distance / avgSpeed) * 60;
      
      if (onDistanceUpdate) {
        onDistanceUpdate(distance, duration);
      }
      
      return { distance, duration };
    }
    return null;
  }, [deliveryLat, deliveryLng, customerLat, customerLng, onDistanceUpdate]);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  const defaultCenter: [number, number] = [-23.5505, -46.6333];
  
  let center: [number, number] = defaultCenter;
  if (deliveryLat && deliveryLng) {
    center = [deliveryLat, deliveryLng];
  } else if (customerLat && customerLng) {
    center = [customerLat, customerLng];
  }

  const hasDeliveryPosition = deliveryLat != null && deliveryLng != null;
  const hasCustomerPosition = customerLat != null && customerLng != null;

  const routePositions: [number, number][] = [];
  if (hasDeliveryPosition && hasCustomerPosition && showRoute) {
    routePositions.push([deliveryLat!, deliveryLng!]);
    routePositions.push([customerLat!, customerLng!]);
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border">
      {distanceInfo && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Distância:</span>
              <span className="font-semibold text-primary">
                {distanceInfo.distance < 1 
                  ? `${Math.round(distanceInfo.distance * 1000)}m`
                  : `${distanceInfo.distance.toFixed(1)}km`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Tempo:</span>
              <span className="font-semibold text-primary">
                {distanceInfo.duration < 1 
                  ? '< 1 min'
                  : `~${Math.round(distanceInfo.duration)} min`}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {hasDeliveryPosition && (
        <button
          onClick={() => setFollowDelivery(!followDelivery)}
          className={`absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium transition-colors ${
            followDelivery 
              ? 'bg-primary text-white' 
              : 'bg-white text-muted-foreground hover:bg-gray-100'
          }`}
        >
          {followDelivery ? '📍 Seguindo' : '📍 Seguir'}
        </button>
      )}
      
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} follow={followDelivery && hasDeliveryPosition} />

        {hasDeliveryPosition && (
          <AnimatedMarker position={[deliveryLat!, deliveryLng!]} icon={deliveryIcon}>
            <Popup>
              <strong>🛵 {deliveryPersonName}</strong>
              <br />
              Posição atual do entregador
            </Popup>
          </AnimatedMarker>
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
