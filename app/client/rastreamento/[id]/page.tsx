/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Página de Rastreamento de Entrega
 */

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { ArrowLeft, Loader2, MapPin, Phone, User, Package, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importa mapa dinamicamente para evitar erro de SSR
const DeliveryMap = dynamic(
  () => import('@/components/delivery-map').then((mod) => mod.DeliveryMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

interface DeliveryLocation {
  id: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  customerLatitude: number | null;
  customerLongitude: number | null;
  customerAddress: string;
  status: string;
  deliveryPerson: {
    name: string;
    phone: string | null;
  };
}

export default function RastreamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [delivery, setDelivery] = useState<DeliveryLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLocation = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/deliveries/${id}/location`);
      if (!res.ok) throw new Error('Entrega não encontrada');
      const data = await res.json();
      setDelivery(data);
      setLastUpdate(new Date());
      setError(null);
    } catch {
      setError('Não foi possível carregar o rastreamento');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    
    const interval = setInterval(() => fetchLocation(), 5000);
    return () => clearInterval(interval);
  }, [id]);

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 5) return 'agora';
    if (seconds < 60) return `${seconds}s atrás`;
    return `${Math.floor(seconds / 60)}min atrás`;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Aguardando entregador',
      in_progress: 'Em trânsito',
      delivered: 'Entregue',
      failed: 'Falha na entrega',
    };
    return labels[status.toLowerCase()] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-[#2D1B4E] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Logo size="sm" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{error || 'Entrega não encontrada'}</p>
              <Button className="mt-4" onClick={() => router.push('/client/dashboard')}>
                Voltar ao catálogo
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-[#2D1B4E] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/client/dashboard')}
            className="bg-white/10 text-white border border-white/30 hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rastreamento da Entrega</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLocation(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {lastUpdate && <span>Atualizado {formatLastUpdate()}</span>}
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
              {getStatusLabel(delivery.status)}
            </span>
          </div>
        </div>

        {/* Mapa */}
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <DeliveryMap
              deliveryLat={delivery.currentLatitude}
              deliveryLng={delivery.currentLongitude}
              customerLat={delivery.customerLatitude}
              customerLng={delivery.customerLongitude}
              deliveryPersonName={delivery.deliveryPerson.name}
              customerAddress={delivery.customerAddress}
            />
          </CardContent>
        </Card>

        {/* Informações */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Entregador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{delivery.deliveryPerson.name}</p>
              {delivery.deliveryPerson.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {delivery.deliveryPerson.phone}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{delivery.customerAddress}</p>
            </CardContent>
          </Card>
        </div>

        {delivery.status.toLowerCase() === 'in_progress' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="relative">
                <Package className="h-6 w-6 text-blue-600" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Seu pedido está a caminho!</p>
                <p className="text-sm text-blue-700">
                  Rastreamento em tempo real - atualiza automaticamente
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {delivery.status.toLowerCase() === 'delivered' && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 flex items-center gap-3">
              <Package className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Pedido entregue!</p>
                <p className="text-sm text-green-700">
                  Obrigado por comprar conosco
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
