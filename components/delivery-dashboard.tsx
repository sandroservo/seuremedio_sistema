'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useOrders } from '@/hooks/use-orders';
import { useDeliveries } from '@/hooks/use-deliveries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Logo } from '@/components/logo';
import { Loader2, MapPin, Package, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export function DeliveryDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders, isLoading: loadingOrders, changeStatus: changeOrderStatus, refetch: refetchOrders } = useOrders();
  const { deliveries, isLoading: loadingDeliveries, changeStatus: changeDeliveryStatus, refetch: refetchDeliveries } = useDeliveries(user?.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  
  // Paginação
  const [myDeliveriesPage, setMyDeliveriesPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Rastreamento automático de localização quando há entrega ativa
  useEffect(() => {
    const activeDelivery = deliveries.find((d) => d.status.toLowerCase() === 'in_progress');
    
    if (!activeDelivery) return;

    let watchId: number;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Envia localização silenciosamente
          fetch(`/api/deliveries/${activeDelivery.id}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [deliveries]);

  // Pedidos com status SHIPPED estão disponíveis para entrega
  const availableOrders = orders.filter((o) => {
    const status = o.status.toLowerCase();
    return status === 'shipped' && !o.deliveryTask;
  });

  const handleAcceptDelivery = async (orderId: string) => {
    if (!user?.id || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Cria a tarefa de entrega atribuindo ao entregador
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          deliveryPersonId: user.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro ao aceitar entrega');
      }

      await refetchOrders();
      await refetchDeliveries();
      
      setFeedback({
        type: 'success',
        title: 'Entrega aceita!',
        message: 'Você aceitou a entrega. Dirija-se ao estabelecimento para retirar o pedido.',
      });
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível aceitar a entrega. Tente novamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteDelivery = async (deliveryId: string, orderId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await changeDeliveryStatus(deliveryId, 'delivered');
      await changeOrderStatus(orderId, 'delivered');
      await refetchDeliveries();
      await refetchOrders();
      
      setFeedback({
        type: 'success',
        title: 'Entrega concluída!',
        message: 'Parabéns! A entrega foi marcada como concluída.',
      });
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível concluir a entrega. Tente novamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/delivery/login');
  };

  const isLoading = loadingOrders || loadingDeliveries;
  const activeDeliveries = deliveries.filter((d) => d.status.toLowerCase() === 'in_progress');
  const completedDeliveries = deliveries.filter((d) => d.status.toLowerCase() === 'delivered');

  // Paginação - Minhas Entregas
  const totalMyDeliveriesPages = Math.ceil(deliveries.length / ITEMS_PER_PAGE);
  const paginatedDeliveries = deliveries.slice(
    (myDeliveriesPage - 1) * ITEMS_PER_PAGE,
    myDeliveriesPage * ITEMS_PER_PAGE
  );

  // Paginação - Entregas Disponíveis
  const totalAvailablePages = Math.ceil(availableOrders.length / ITEMS_PER_PAGE);
  const paginatedAvailableOrders = availableOrders.slice(
    (availablePage - 1) * ITEMS_PER_PAGE,
    availablePage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-[#2D1B4E] sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-white/60 text-sm font-medium px-2 py-1 bg-white/10 rounded">Entregador</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">{user?.name}</span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleLogout}
              className="bg-white/10 text-white border border-white/30 hover:bg-white/20"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Entregas Ativas</p>
              <p className="text-2xl font-bold">{activeDeliveries.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Entregas Concluídas</p>
              <p className="text-2xl font-bold">{completedDeliveries.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Disponíveis</p>
              <p className="text-2xl font-bold">{availableOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Minhas Entregas</h2>
            <div className="space-y-4">
              {deliveries.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma entrega
                  </CardContent>
                </Card>
              ) : (
                paginatedDeliveries.map((delivery) => {
                  const status = delivery.status.toLowerCase();
                  return (
                    <Card key={delivery.id} className="overflow-hidden">
                      <CardHeader className="pb-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Pedido #{delivery.orderId?.slice(0, 8).toUpperCase() || delivery.id.slice(0, 8)}
                          </CardTitle>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            status === 'delivered' ? 'bg-green-100 text-green-800' :
                            status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {status === 'delivered' ? 'Entregue' : status === 'in_progress' ? 'Em trânsito' : 'Pendente'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm">
                            {delivery.customerAddress || delivery.order?.shippingAddress || 'Endereço não informado'}
                          </p>
                        </div>
                        {delivery.order?.client && (
                          <p className="text-sm text-muted-foreground">
                            Cliente: {delivery.order.client.name} {delivery.order.client.phone && `• ${delivery.order.client.phone}`}
                          </p>
                        )}
                        {delivery.estimatedDeliveryTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Estimativa: {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        )}
                        {delivery.order && (
                          <p className="text-lg font-bold text-primary">
                            R$ {Number(delivery.order.totalPrice).toFixed(2)}
                          </p>
                        )}
                        {status === 'in_progress' && (
                          <Button
                            onClick={() => handleCompleteDelivery(delivery.id, delivery.orderId)}
                            className="w-full"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                            ) : (
                              <><Check className="h-4 w-4 mr-2" /> Marcar como Entregue</>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
              
              {/* Paginação Minhas Entregas */}
              {totalMyDeliveriesPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {myDeliveriesPage} de {totalMyDeliveriesPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMyDeliveriesPage(p => Math.max(1, p - 1))}
                      disabled={myDeliveriesPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMyDeliveriesPage(p => Math.min(totalMyDeliveriesPages, p + 1))}
                      disabled={myDeliveriesPage === totalMyDeliveriesPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Entregas Disponíveis</h2>
            <div className="space-y-4">
              {availableOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma entrega disponível
                  </CardContent>
                </Card>
              ) : (
                paginatedAvailableOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden border-orange-200">
                    <CardHeader className="pb-3 bg-orange-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Pedido #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-800">
                          Disponível
                        </span>
                      </div>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{order.shippingAddress}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{order.items?.length || 0} itens</p>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        R$ {Number(order.totalPrice).toFixed(2)}
                      </p>
                      <Button
                        onClick={() => handleAcceptDelivery(order.id)}
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                        ) : (
                          'Aceitar Entrega'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
              
              {/* Paginação Entregas Disponíveis */}
              {totalAvailablePages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {availablePage} de {totalAvailablePages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAvailablePage(p => Math.max(1, p - 1))}
                      disabled={availablePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAvailablePage(p => Math.min(totalAvailablePages, p + 1))}
                      disabled={availablePage === totalAvailablePages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      <AlertDialog open={!!feedback} onOpenChange={(open) => !open && setFeedback(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {feedback?.type === 'success' ? '✓ ' : '✕ '}{feedback?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {feedback?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeedback(null)}>Ok</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
